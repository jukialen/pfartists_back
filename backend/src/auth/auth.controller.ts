import {
  BadRequestException,
  Body,
  Controller,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import ses, { SessionContainer } from 'supertokens-node/recipe/session';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import { Session } from './session.decorator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('change-password')
  @UseGuards(new AuthGuard())
  async updatePassword(
    @Session() session: SessionContainer,
    @Body('passwords') passwords: { oldPassword: string; newPassword: string },
  ) {
    const { oldPassword, newPassword } = passwords;
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
      throw new BadRequestException('Incorrect login details');
    }

    await this.authService.updatePassword(userId, newPassword);
    await ses.revokeAllSessionsForUser(userId);
    await session.revokeSession();
  }

  @Patch('change-email')
  @UseGuards(new AuthGuard())
  async updateEmail(
    @Session() session: SessionContainer,
    @Body('data') data: { user_id: string; newEmail: string },
  ) {
    const { user_id, newEmail } = data;
    await this.authService.updateMail(user_id, newEmail);
    await ses.revokeAllSessionsForUser(user_id);
    await session.revokeSession();
  }
}
