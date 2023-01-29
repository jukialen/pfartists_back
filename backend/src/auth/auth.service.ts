import { Injectable } from '@nestjs/common';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';

@Injectable()
export class AuthService {
  async updatePassword(userId: string, newPassword: string) {
    await ThirdPartyEmailPassword.updateEmailOrPassword({
      userId,
      password: newPassword,
    });
  }
}
