import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { Session } from './session.decorator';
import ses, { SessionContainer } from 'supertokens-node/recipe/session';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Patch('/change-password')
  @UseGuards(new AuthGuard())
  async updatePassword(
    @Session() session: SessionContainer,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    const userId = session?.getUserId();
    const { email } = await ThirdPartyEmailPassword.getUserById(userId);

    if (email === undefined) {
      throw new Error('Should never come here');
    }
    const isPasswordValid = await ThirdPartyEmailPassword.emailPasswordSignIn(
      email,
      oldPassword,
    );

    if (isPasswordValid.status !== 'OK') {
      return;
    }

    await this.authService.updatePassword(userId, newPassword);
    await ses.revokeAllSessionsForUser(userId);
    await session.revokeSession();
  }
}
