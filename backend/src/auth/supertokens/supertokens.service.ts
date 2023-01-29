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

@Injectable()
export class SupertokensService {
  constructor(@Inject(ConfigInjectionToken) private config: AuthModuleConfig) {
    supertokens.init({
      appInfo: config.appInfo,
      supertokens: {
        connectionURI: config.connectionURI,
        apiKey: config.apiKey,
      },
      recipeList: [
        ThirdPartyEmailPassword.init({
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                emailPasswordSignUp: async function (input) {
                  const existingUsers =
                    await ThirdPartyEmailPassword.getUsersByEmail(input.email);
                  if (existingUsers.length === 0) {
                    return originalImplementation.emailPasswordSignUp(input);
                  }
                  return {
                    status: 'EMAIL_ALREADY_EXISTS_ERROR',
                  };
                },
                thirdPartySignInUp: async function (input) {
                  const existingUsers =
                    await ThirdPartyEmailPassword.getUsersByEmail(input.email);
                  if (existingUsers.length === 0) {
                    return originalImplementation.thirdPartySignInUp(input);
                  }
                  if (
                    existingUsers.find(
                      (i) =>
                        i.thirdParty !== undefined &&
                        i.thirdParty.id === input.thirdPartyId &&
                        i.thirdParty.userId === input.thirdPartyUserId,
                    )
                  ) {
                    return originalImplementation.thirdPartySignInUp(input);
                  }
                  throw new Error('Cannot sign up as email already exists');
                },
              };
            },
            apis: (originalImplementation) => {
              return {
                ...originalImplementation,
                thirdPartySignInUpPOST: async function (input) {
                  try {
                    return await originalImplementation.thirdPartySignInUpPOST?.(
                      input,
                    );
                  } catch (err: any) {
                    if (
                      err.message === 'Cannot sign up as email already exists'
                    ) {
                      return {
                        status: 'GENERAL_ERROR',
                        message:
                          'Seems like you already have an account with another method. Please use that instead.',
                      };
                    }
                    throw err;
                  }
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
