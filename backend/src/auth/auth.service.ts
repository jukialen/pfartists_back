import { Injectable } from '@nestjs/common';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async updateMail(user_id: string, newEmail: string) {
    await this.prisma.emailpassword_users.update({
      where: { user_id },
      data: { email: newEmail },
    });
    await this.prisma.emailverification_tokens.update({
      where: { user_id_email_token: { user_id, email: null, token: null } },
      data: { email: newEmail },
    });
    await this.prisma.emailverification_verified_emails.update({
      where: { user_id_email: { user_id, email: null } },
      data: { email: newEmail },
    });
  }
  async updatePassword(userId: string, newPassword: string) {
    await ThirdPartyEmailPassword.updateEmailOrPassword({
      userId,
      password: newPassword,
    });
  }
}
