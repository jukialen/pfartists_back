import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import ses, { SessionContainer } from 'supertokens-node/recipe/session';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import { Session } from './session.decorator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('change-email')
  @UseGuards(new AuthGuard())
  async updateEmail(
    @Session() session: SessionContainer,
    @Body('data') data: { newEmail: string },
  ) {
    const { newEmail } = data;
    function isValidEmail(email: string) {
      const regexp = new RegExp(
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
      return regexp.test(email);
    }
    if (!isValidEmail(newEmail)) {
      throw new BadRequestException('Incorrect email');
    }

    const userId = session.getUserId();

    const userAccount = await ThirdPartyEmailPassword.getUserById(userId);
    if (userAccount.thirdParty !== undefined) {
      throw new BadRequestException(
        'Only users logged in via the form can update their email.',
      );
    }

    const isVerified = await EmailVerification.isEmailVerified(
      userId,
      newEmail,
    );

    if (!isVerified) {
      const user: ThirdPartyEmailPassword.User =
        await ThirdPartyEmailPassword.getUserById(userId);
      for (let i = 0; i < user?.tenantIds.length; i++) {
        const usersWithEmail = await ThirdPartyEmailPassword.getUsersByEmail(
          user.tenantIds[i],
          newEmail,
        );
        for (let y = 0; y < usersWithEmail.length; y++) {
          if (usersWithEmail[y].id !== session.getUserId()) {
            throw new Error(
              'There is already an account with this email address.',
            );
          }
        }
      }

      await EmailVerification.sendEmailVerificationEmail(
        session.getTenantId(),
        userId,
        newEmail,
      );

      return {
        statusCode: 200,
        message: 'Email verification email sent.',
      };
    }

    return this.authService.updateMail(userId, newEmail);
  }

  @Post('change-password')
  @UseGuards(new AuthGuard())
  async updatePassword(
    @Session() session: SessionContainer,
    @Body('passwords') passwords: { oldPassword: string; newPassword: string },
  ) {
    const { oldPassword, newPassword } = passwords;
    const userId = session?.getUserId();
    const tenantId = session.getTenantId();

    const userInfo = await ThirdPartyEmailPassword.getUserById(userId);

    if (userInfo === undefined) {
      throw new Error('Should never come here');
    }
    const email = userInfo.email;

    const isPasswordValid = await ThirdPartyEmailPassword.emailPasswordSignIn(
      tenantId,
      email,
      oldPassword,
    );

    if (isPasswordValid.status !== 'OK') {
      throw new BadRequestException('Incorrect password');
    }

    await this.authService.updatePassword(userId, newPassword, tenantId);
    await ses.revokeAllSessionsForUser(userId);
    await session.revokeSession();
  }
}
