import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import crypto from 'crypto';

import { ConfigInjectionToken, AuthModuleConfig } from '../config.interface';
import { send } from '../../config/email';
import { templates } from '../../constants/constatnts';
import { UsersService } from '../../users/users.service';

@Injectable()
export class SupertokensService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(ConfigInjectionToken) private config: AuthModuleConfig,
  ) {
    supertokens.init({
      appInfo: config.appInfo,
      supertokens: {
        connectionURI: config.connectionURI,
        apiKey: config.apiKey,
      },
      recipeList: [
        ThirdPartyEmailPassword.init({
          override: {
            apis: (originalImplementation) => {
              return {
                ...originalImplementation,

                // override the email password sign up API
                emailPasswordSignUpPOST: async function (input) {
                  if (
                    originalImplementation.emailPasswordSignUpPOST === undefined
                  ) {
                    throw Error('Should never come here');
                  }
                  // TODO: some pre sign up logic

                  const response =
                    await originalImplementation.emailPasswordSignUpPOST(input);

                  if (response.status === 'OK') {
                    // TODO: some post sign up logic
                  }

                  return response;
                },

                // override the email password sign in API
                emailPasswordSignInPOST: async function (input) {
                  if (
                    originalImplementation.emailPasswordSignInPOST === undefined
                  ) {
                    throw Error('Should never come here');
                  }

                  // TODO: some pre sign in logic

                  const response =
                    await originalImplementation.emailPasswordSignInPOST(input);

                  if (response.status === 'OK') {
                    // TODO: some post sign in logic
                  }

                  return response;
                },

                // override the thirdparty sign in / up API
                thirdPartySignInUpPOST: async function (input) {
                  if (
                    originalImplementation.thirdPartySignInUpPOST === undefined
                  ) {
                    throw Error('Should never come here');
                  }

                  // TODO: Some pre sign in / up logic

                  const response =
                    await originalImplementation.thirdPartySignInUpPOST(input);

                  if (response.status === 'OK') {
                    if (response.createdNewUser) {
                      // TODO: some post sign up logic
                    } else {
                      // TODO: some post sign in logic
                    }
                  }

                  return response;
                },
              };
            },
          },
          providers: [
            ThirdPartyEmailPassword.Google({
              clientId: process.env.GOOGLE_ID,
              clientSecret: process.env.GOOGLE_SECRET_ID,
            }),
            {
              id: 'spotify',
              get: (redirectURI, authCodeFromRequest) => {
                const state = crypto.randomBytes(16).toString('hex');

                return {
                  accessTokenAPI: {
                    url: process.env.SPOTIFY_TOKEN_URL,
                    params: {
                      client_id: process.env.SPOTIFY_ID,
                      client_secret: process.env.SPOTIFY_SECRET_ID,
                      grant_type: 'authorization_code',
                      redirect_uri: redirectURI || '',
                      code: authCodeFromRequest || '',
                      state: state,
                    },
                  },
                  authorisationRedirect: {
                    url: process.env.SPOTIFY_AUTHORIZE_REDIRECT_URL,
                    params: {
                      client_id: process.env.SPOTIFY_ID,
                      scope: 'user-read-email',
                      response_type: 'code',
                      redirect_uri: redirectURI || '',
                    },
                  },
                  getClientId: () => {
                    return process.env.SPOTIFY_ID;
                  },
                  getProfileInfo: async (accessTokenAPIResponse) => {
                    return {
                      id: accessTokenAPIResponse.id,
                      username:
                        accessTokenAPIResponse.display_name || undefined,
                      pseudonym:
                        accessTokenAPIResponse.display_name || undefined,
                      profilePhoto: accessTokenAPIResponse.images[0].url,
                      email: accessTokenAPIResponse.email,
                      isVerified: accessTokenAPIResponse.isVerified,
                    };
                  },
                };
              },
            },
          ],
          emailDelivery: {
            override: () => {
              return {
                // ...originalImplementation,
                sendEmail: async function (
                  input,
                ): Promise<
                  | { statusCode: HttpStatus; message: string }
                  | BadRequestException
                > {
                  return send({
                    templateVersion: templates.forgottenPassword,
                    verificationUrl: input.passwordResetLink,
                    email: input.user.email,
                  });
                },
              };
            },
          },
        }),
        EmailVerification.init({
          mode: 'OPTIONAL',
          emailDelivery: {
            override: () => {
              return {
                // ...originalImplementation,
                sendEmail: async function (
                  input,
                ): Promise<
                  | { statusCode: HttpStatus; message: string }
                  | BadRequestException
                > {
                  return send({
                    templateVersion: templates.confirmEmail,
                    verificationUrl: input.emailVerifyLink,
                    email: input.user.email,
                  });
                },
              };
            },
          },
        }),
        Session.init(),
      ],
    });
  }
}
