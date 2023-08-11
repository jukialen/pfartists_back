import { Injectable } from '@nestjs/common';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';

@Injectable()
export class AuthService {
  async updateMail(userId: string, newEmail: string) {
    const resp = await ThirdPartyEmailPassword.updateEmailOrPassword({
      userId,
      email: newEmail,
    });

    if (resp.status === 'OK') {
      return {
        statusCode: 200,
        message: 'Successfully email update',
      };
    }

    if (resp.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
      throw new Error('There is already an account with this email address.');
    }
    throw new Error('Should never come here');
  }

  async updatePassword(userId: string, newPassword: string, tenantId: string) {
    const res = await ThirdPartyEmailPassword.updateEmailOrPassword({
      userId,
      password: newPassword,
      tenantIdForPasswordPolicy: tenantId,
    });

    if (res.status === 'PASSWORD_POLICY_VIOLATED_ERROR') {
      throw new Error('Incorrect password');
    }
    return {
      statusCode: 200,
      message: 'Successfully password change',
    };
  }
}
