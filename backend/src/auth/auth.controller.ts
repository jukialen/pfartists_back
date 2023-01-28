import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import {
  createNewSession,
  SessionClaimValidator,
} from 'supertokens-node/recipe/session';
import { UserDto } from '../DTOs/user.dto';
import { AuthGuard } from './auth.guard';
import { EmailVerificationClaim } from 'supertokens-node/recipe/emailverification';
@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(
    new AuthGuard({
      overrideGlobalClaimValidators: async (
        globalValidators: SessionClaimValidator[],
      ) => [
        ...globalValidators,
        EmailVerificationClaim.validators.isVerified(),
      ],
    }),
  )
  async log_user(
    @Res() res: Response,
    @Body('data') data: Prisma.UsersCreateInput,
  ): Promise<{ message: string }> {
    console.log('data', data);
    const userData: UserDto | BadRequestException =
      await this.usersService.validateUser(data);

    console.log('userdata', userData);
    if (!(userData instanceof BadRequestException)) {
      const session = await createNewSession(res, userData.id);
      console.log(session);
    }

    return { message: 'User logged in!' };
  }
}
