import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import Dashboard from 'supertokens-node/recipe/dashboard';
import axios from 'axios';
import { ConfigInjectionToken, AuthModuleConfig } from '../config.interface';
import { send } from '../../config/signUpForgottenPassEmails';
import {
  templates,
  state,
  emails,
  titles,
  googleUrl,
  discordUrl,
  spotifyUrl,
  lineUrl,
} from '../../constants/links&emailObjects';
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

                  //disable creation session for sign up
                  //https://supertokens.com/docs/thirdpartyemailpassword/advanced-customizations/user-context
                  const res = await originalImplementation.thirdPartySignInUp(
                    input,
                  );
                  if (res.status === 'OK' && res.createdNewUser) {
                    input.userContext.isSignUp = true;
                  }
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
            //Post signin/signup callbacks override
            //https://supertokens.com/docs/thirdpartyemailpassword/advanced-customizations/user-context
            apis: (originalImplementation) => {
              return {
                ...originalImplementation,
                thirdPartySignInUpPOST: async function (input) {
                  try {
                    if (
                      originalImplementation.thirdPartySignInUpPOST ===
                      undefined
                    ) {
                      throw Error('Should never come here');
                    }

                    const response =
                      await originalImplementation.thirdPartySignInUpPOST(
                        input,
                      );

                    if (response.status === 'OK' && response.createdNewUser) {
                      const accessToken =
                        response.authCodeResponse.access_token;

                      console.log('access token create', accessToken);
                      console.log('provider id', input.provider.id);

                      const authHeader = `Bearer ${accessToken}`;

                      if (input.provider.id === 'google') {
                        const response = await axios.get(googleUrl, {
                          params: {
                            alt: 'json',
                          },
                          headers: {
                            Authorization: authHeader,
                          },
                        });

                        console.log('data2', response.data);
                        console.log('res2', response);
                        const userInfo = response.data;
                        const id = userInfo.id;
                        const email = userInfo.email.id;
                        const pseudonym = userInfo.pseudonym;
                        const profilePhoto = userInfo.profilePhoto;

                        await usersService.createUser({
                          pseudonym,
                          username: pseudonym,
                          profilePhoto,
                          all_auth_recipe_users: {
                            connectOrCreate: {
                              where: {
                                user_id: id,
                              },
                              create: {
                                user_id: accessToken.id,
                                recipe_id: 'google',
                                time_joined: accessToken.time_joined,
                              },
                            },
                            // connect: {
                            //   user_id: accessToken.id,
                            // },
                          },
                        });
                      }

                      if (input.provider.id === 'spotify') {
                        const res = await axios.get(spotifyUrl, {
                          headers: {
                            Authorization: authHeader,
                          },
                        });

                        console.log('data2', res.data);
                        console.log('res2', res);
                        const userInfo = res.data;
                        const id = userInfo.id;
                        const email = userInfo.email;
                        const username = userInfo.display_name;
                        const picture = userInfo.images[0].url;

                        await usersService.createUser({
                          pseudonym: username,
                          username,
                          profilePhoto: picture,
                          all_auth_recipe_users: {
                            // connectOrCreate: {
                            //   where: {
                            //     user_id: id,
                            //   },
                            //   create: {
                            //     user_id: id,
                            //     recipe_id: 'spotify',
                            //     time_joined: Date.now(),
                            //   },
                            // },
                            connect: {
                              user_id: id,
                            },
                          },
                        });
                      }

                      if (input.provider.id === 'discord') {
                        const response = await axios.get(discordUrl, {
                          params: {
                            alt: 'json',
                          },
                          headers: {
                            Authorization: authHeader,
                          },
                        });

                        const userInfo = response.data;
                        const id = userInfo.id;
                        const username = userInfo.name;
                        const email = userInfo.email;
                        const picture = `https://cdn.discordapp.com/avatars/${id}/${userInfo.avatar}.webp`;

                        console.log(userInfo);
                        await usersService.createUser({
                          pseudonym: username,
                          username,
                          profilePhoto: picture,
                          all_auth_recipe_users: {
                            connectOrCreate: {
                              where: {
                                user_id: id,
                              },
                              create: undefined,
                            },
                            connect: {
                              user_id: accessToken.id,
                            },
                          },
                        });
                      }

                      if (input.provider.id === 'line') {
                        const res = await axios.get(lineUrl, {
                          headers: {
                            Authorization: authHeader,
                          },
                        });

                        const userInfo = res.data;
                        const sub = userInfo.sub;
                        const email = userInfo.email;
                        const username = userInfo.name;
                        const picture = userInfo.picture;

                        console.log(res);
                        // await usersService.createUser({
                        //   pseudonym: username,
                        //   username,
                        //   profilePhoto: picture,
                        //   all_auth_recipe_users: {
                        //     connectOrCreate: {
                        //       where: {
                        //         user_id: sub,
                        //         email,
                        //       },
                        //       create: undefined,
                        //     },
                        //     connect: {
                        //       user_id: sub,
                        //     },
                        //   },
                        // });
                      }
                    }

                    return await originalImplementation.thirdPartySignInUpPOST?.(
                      input,
                    );
                  } catch (e: any) {
                    console.log(e);
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
                console.log(
                  'red url & auth code',
                  redirectURI,
                  authCodeFromRequest,
                );
                return {
                  accessTokenAPI: {
                    url: process.env.GOOGLE_TOKEN_URL,
                    params: {
                      client_id: process.env.GOOGLE_ID,
                      client_secret: process.env.GOOGLE_SECRET_ID,
                      grant_type: 'authorization_code',
                      redirect_uri: redirectURI,
                      code: authCodeFromRequest,
                      state,
                    },
                  },
                  authorisationRedirect: {
                    url: process.env.GOOGLE_AUTHORIZE_REDIRECT_URL,
                    params: {
                      client_id: process.env.GOOGLE_ID,
                      scope:
                        'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
                      response_type: 'code',
                      redirect_uri: redirectURI || '',
                    },
                  },
                  getClientId: () => {
                    return process.env.GOOGLE_ID;
                  },
                  getProfileInfo: async (accessTokenAPIResponse) => {
                    await console.log('token res', accessTokenAPIResponse);
                    const accessToken = accessTokenAPIResponse.access_token;
                    console.log('access token', accessToken);

                    const authHeader = `Bearer ${accessToken}`;
                    const response = await axios.get(googleUrl, {
                      params: {
                        alt: 'json',
                      },
                      headers: {
                        Authorization: authHeader,
                      },
                    });

                    const userInfo = response.data;
                    const id = userInfo.id;
                    const isVerified = userInfo.verified_email;
                    const email = userInfo.email;

                    // const pseudonym = userInfo.name;
                    // const profilePhoto = userInfo.picture;

                    console.log('user info', userInfo);
                    if (email === undefined || email === null) {
                      throw new BadRequestException('no email access');
                    }

                    return {
                      id,
                      email: {
                        id: email,
                        isVerified,
                      },
                    };
                  },
                };
              },
            },
            {
              id: 'spotify',
              get: (redirectURI, authCodeFromRequest) => {
                console.log('redirectURI', redirectURI, authCodeFromRequest);
                return {
                  accessTokenAPI: {
                    url: process.env.SPOTIFY_TOKEN_URL,
                    params: {
                      client_id: process.env.SPOTIFY_ID,
                      client_secret: process.env.SPOTIFY_SECRET_ID,
                      grant_type: 'authorization_code',
                      redirect_uri: redirectURI || '',
                      code: authCodeFromRequest || '',
                      state,
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
                    console.log('token res', accessTokenAPIResponse);
                    const accessToken = accessTokenAPIResponse.access_token;
                    console.log('accesstoken', accessToken);

                    const authHeader = `Bearer ${accessToken}`;
                    const response = await axios.get(spotifyUrl, {
                      headers: {
                        Authorization: authHeader,
                      },
                    });

                    const userInfo = response.data;
                    const id = userInfo.id;
                    const email = userInfo.email;
                    console.log('user info', userInfo);

                    if (email === undefined || email === null) {
                      throw new BadRequestException('no email access');
                    }

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
                console.log('redirectURI', redirectURI, authCodeFromRequest);
                return {
                  accessTokenAPI: {
                    url: process.env.DISCORD_TOKEN_URL,
                    params: {
                      client_id: process.env.DISCORD_ID,
                      client_secret: process.env.DISCORD_SECRET_ID,
                      grant_type: 'authorization_code',
                      redirect_uri: redirectURI,
                      code: authCodeFromRequest,
                      state,
                    },
                  },
                  authorisationRedirect: {
                    url: process.env.DISCORD_AUTHORIZE_REDIRECT_URL,
                    params: {
                      client_id: process.env.DISCORD_ID,
                      scope: 'email identify',
                      response_type: 'code',
                      redirect_uri: redirectURI || '',
                    },
                  },
                  getClientId: () => {
                    return process.env.DISCORD_ID;
                  },
                  getProfileInfo: async (accessTokenAPIResponse) => {
                    console.log('token res', accessTokenAPIResponse);
                    const accessToken = accessTokenAPIResponse.access_token;
                    console.log('accesstoken', accessToken);

                    const authHeader = `Bearer ${accessToken}`;
                    const response = await axios.get(discordUrl, {
                      headers: {
                        Authorization: authHeader,
                      },
                    });

                    const { id, email, verified } = response.data;

                    console.log('userinfo', response.data);

                    if (email === undefined || email === null) {
                      throw new BadRequestException('no email access');
                    }

                    return {
                      id,
                      email: {
                        id: email,
                        isVerified: verified,
                      },
                    };
                  },
                };
              },
            },
            {
              id: 'line',
              get: (redirectURI, authCodeFromRequest) => {
                console.log('redirectURI', redirectURI, authCodeFromRequest);
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
                      scope: 'openid_connect profile oc_mail',
                      response_type: 'code',
                      redirect_uri: redirectURI || '',
                    },
                  },
                  getClientId: () => process.env.LINE_ID,
                  getProfileInfo: async (accessTokenAPIResponse) => {
                    console.log('token res', accessTokenAPIResponse);
                    const accessToken = accessTokenAPIResponse.access_token;
                    console.log('access token', accessToken);

                    const authHeader = `Bearer ${accessToken}`;
                    const response = await axios.get(discordUrl, {
                      headers: {
                        Authorization: authHeader,
                      },
                    });

                    const userInfo = response.data;
                    const sub = userInfo.sub;
                    const email = userInfo.email;

                    if (email === undefined || email === null) {
                      throw new BadRequestException('no email access');
                    }

                    return {
                      id: sub,
                      email: {
                        id: email,
                        isVerified: true,
                      },
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
                  const data = await usersService.findAllUsers({
                    where: { id: input.user.id },
                  });

                  await send({
                    templateVersion: templates.forgottenPassword,
                    verificationUrl: input.passwordResetLink,
                    email: input.user.email,
                    emailFrom: emails.forgottenPasswordEmail,
                    supportEmail: emails.supportEmail,
                    title: titles.forgotten,
                    username: `${data[0].username || ''}!`,
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
                  console.log('input ver', input);
                  await send({
                    templateVersion: templates.confirmEmail,
                    verificationUrl: input.emailVerifyLink,
                    email: input.user.email,
                    emailFrom: emails.confirmEmail,
                    supportEmail: emails.supportEmail,
                    title: titles.confirm,
                    username: '',
                  });
                },
              };
            },
          },
        }),
        Session.init(),
        Dashboard.init({
          apiKey: process.env.DASHBOARD_KEY,
        }),
      ],
    });
  }
}
