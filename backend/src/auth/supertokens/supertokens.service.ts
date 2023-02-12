import { Inject, Injectable } from '@nestjs/common';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';

import { ConfigInjectionToken, AuthModuleConfig } from '../config.interface';
import { send } from '../../config/email';
import { templates, state, emails, titles } from '../../constants/constatnts';
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
          //password validation override
          signUpFeature: {
            formFields: [
              {
                id: 'password',
                validate: async (value: string) => {
                  if (value.length < 9) {
                    return 'Password is too short. Must have a minimum 9 letters.';
                  }

                  if (!value.match(/[a-ząćęłńóśźżĄĘŁŃÓŚŹŻぁ-んァ-ヾ一-龯]+/g)) {
                    return 'Password accept only letters. These can be Hiragana, Katakana and kanji characters.';
                  }

                  if (!value.match(/[A-Z]+/g)) {
                    return 'Password must have at least 1 big letter.';
                  }

                  if (!value.match(/\d+/g)) {
                    return 'Password must have at least 1 number.';
                  }

                  if (!value.match(/[#?!@$%^&*-]+/g)) {
                    return 'Password must include at least 1 special character: #?!@$%^&*-';
                  }
                },
              },
            ],
          },
          //account deduplication
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
            //Post signin / signup callbacks override
            apis: (originalImplementation) => {
              return {
                ...originalImplementation,
                thirdPartySignInUpPOST: async function (input) {
                  try {
                    const response =
                      await originalImplementation.thirdPartySignInUpPOST(
                        input,
                      );

                    if (
                      originalImplementation.thirdPartySignInUpPOST ===
                      undefined
                    ) {
                      throw Error('Should never come here');
                    }

                    if (response.status === 'OK' && response.createdNewUser) {
                      const accessToken =
                        response.authCodeResponse.access_token;

                      accessToken.id;
                      await usersService.createUser({
                        pseudonym: accessToken.pseudonym,
                        username: accessToken.pseudonym,
                        profilePhoto: accessToken.profilePhoto,
                        emailpassword_users: {
                          create: undefined,
                          connectOrCreate: {
                            where: {
                              user_id: accessToken.id,
                              email: accessToken.email,
                            },
                            create: undefined,
                          },
                          connect: {
                            user_id: accessToken.id,
                            email: accessToken.email,
                          },
                        },
                      });
                    }

                    return await originalImplementation.thirdPartySignInUpPOST?.(
                      input,
                    );
                  } catch (e: any) {
                    if (
                      e.message === 'Cannot sign up as email already exists'
                    ) {
                      return {
                        status: 'GENERAL_ERROR',
                        message:
                          'Seems like you already have an account with another method. Please use that instead.',
                      };
                    }
                    throw e;
                  }
                },
              };
            },
          },
          providers: [
            {
              id: 'google',
              get: (redirectURI, authCodeFromRequest) => {
                return {
                  accessTokenAPI: {
                    url: process.env.GOOGLE_TOKEN_URL,
                    params: {
                      client_id: process.env.GOOGLE_ID,
                      client_secret: process.env.GOOGLE_SECRET_ID,
                      grant_type: 'authorization_code',
                      redirect_uri: redirectURI || '',
                      code: authCodeFromRequest || '',
                      state: state,
                    },
                  },
                  authorisationRedirect: {
                    url: process.env.GOOGLE_AUTHORIZE_REDIRECT_URL,
                    params: {
                      client_id: process.env.GOOGLE_ID,
                      scope:
                        'https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/userinfo.profile',
                      response_type: 'code',
                      redirect_uri: redirectURI || '',
                    },
                  },
                  getClientId: () => process.env.GOOGLE_ID,
                  getProfileInfo: async (accessTokenAPIResponse) => {
                    return {
                      id: accessTokenAPIResponse.id,
                      email: accessTokenAPIResponse.email,
                      isVerified: accessTokenAPIResponse.isVerified,
                      username:
                        accessTokenAPIResponse.display_name || undefined,
                      pseudonym:
                        accessTokenAPIResponse.display_name || undefined,
                      profilePhoto: accessTokenAPIResponse.images[0].url,
                    };
                  },
                };
              },
            },
            {
              id: 'spotify',
              get: (redirectURI, authCodeFromRequest) => {
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
                  getClientId: () => process.env.SPOTIFY_ID,
                  getProfileInfo: async (accessTokenAPIResponse) => {
                    return {
                      id: accessTokenAPIResponse.id,
                      email: accessTokenAPIResponse.email,
                      isVerified: accessTokenAPIResponse.isVerified,
                      username:
                        accessTokenAPIResponse.display_name || undefined,
                      pseudonym:
                        accessTokenAPIResponse.display_name || undefined,
                      profilePhoto: accessTokenAPIResponse.images[0].url,
                    };
                  },
                };
              },
            },
            {
              id: 'discord',
              get: (redirectURI, authCodeFromRequest) => {
                return {
                  accessTokenAPI: {
                    url: process.env.DISCORD_TOKEN_URL,
                    params: {
                      client_id: process.env.SPOTIFY_ID,
                      client_secret: process.env.DISCORD_SECRET_ID,
                      grant_type: 'authorization_code',
                      redirect_uri: redirectURI || '',
                      code: authCodeFromRequest || '',
                      state: state,
                    },
                  },
                  authorisationRedirect: {
                    url: process.env.DISCORD_AUTHORIZE_REDIRECT_URL,
                    params: {
                      client_id: process.env.DISCORD_ID,
                      scope: 'email, identify',
                      response_type: 'code',
                      redirect_uri: redirectURI || '',
                    },
                  },
                  getClientId: () => process.env.DISCORD_ID,
                  getProfileInfo: async (accessTokenAPIResponse) => {
                    return {
                      id: accessTokenAPIResponse.id,
                      email: accessTokenAPIResponse.email,
                      isVerified: accessTokenAPIResponse.verified,
                      username: accessTokenAPIResponse.username || undefined,
                      pseudonym: accessTokenAPIResponse.username || undefined,
                      profilePhoto: `https://cdn.discordapp.com/avatars/${accessTokenAPIResponse.id}/${accessTokenAPIResponse.avatar}.webp`,
                    };
                  },
                };
              },
            },
            {
              id: 'line',
              get: (redirectURI, authCodeFromRequest) => {
                return {
                  accessTokenAPI: {
                    url: process.env.LINE_TOKEN_URL,
                    params: {
                      client_id: process.env.LINE_ID,
                      client_secret: process.env.LINE_SECRET_ID,
                      grant_type: 'authorization_code',
                      redirect_uri: redirectURI || '',
                      code: authCodeFromRequest || '',
                      state: state,
                    },
                  },
                  authorisationRedirect: {
                    url: process.env.LINE_AUTHORIZE_REDIRECT_URL,
                    params: {
                      client_id: process.env.LINE_ID,
                      scope: 'openid profile',
                      response_type: 'code',
                      redirect_uri: redirectURI || '',
                    },
                  },
                  getClientId: () => process.env.LINE_ID,
                  getProfileInfo: async (accessTokenAPIResponse) => {
                    return {
                      id: accessTokenAPIResponse.sub,
                      email: accessTokenAPIResponse.email,
                      isVerified: accessTokenAPIResponse.isVerified,
                      username: accessTokenAPIResponse.name || undefined,
                      pseudonym: accessTokenAPIResponse.name || undefined,
                      profilePhoto: accessTokenAPIResponse.picture,
                    };
                  },
                };
              },
            },
          ],
          emailDelivery: {
            override: () => {
              return {
                sendEmail: async function (input) {
                  const data = await usersService.users({
                    where: { id: input.user.id },
                  });

                  await send({
                    templateVersion: templates.forgottenPassword,
                    verificationUrl: input.passwordResetLink,
                    email: input.user.email,
                    emails: emails.forgottenPasswordEmail,
                    title: titles.forgotten,
                    username: `${data[0].username}!`,
                  });
                },
              };
            },
          },
        }),
        EmailVerification.init({
          mode: 'REQUIRED',
          emailDelivery: {
            override: () => {
              return {
                sendEmail: async function (input) {
                  await send({
                    templateVersion: templates.confirmEmail,
                    verificationUrl: input.emailVerifyLink,
                    email: input.user.email,
                    emails: emails.confirmEmail,
                    title: titles.confirm,
                    username: '',
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
