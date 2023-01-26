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
          providers: [
            ThirdPartyEmailPassword.Google({
              clientId: process.env.GOOGLE_ID,
              clientSecret: process.env.GOOGLE_SECRET_ID,
            }),
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
