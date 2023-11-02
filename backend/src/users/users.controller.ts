import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Post,
  UsePipes,
  UploadedFile,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';
import ses from 'supertokens-node/recipe/session';

import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';

import { JoiValidationPipe } from '../Pipes/JoiValidationPipe';
import { FilesPipe } from '../Pipes/FilesPipe';
import { UsersPipe } from '../Pipes/UsersPipe';
import { allContent } from '../constants/allCustomsHttpMessages';
import { UserDto } from '../DTOs/user.dto';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('current/:id')
  @UseGuards(new AuthGuard())
  async currentUser(@Param('id') id: string) {
    return this.usersService.findUser({ id });
  }

  @Get('all')
  @UseGuards(new AuthGuard())
  async users(@Query('queryData') queryData: string) {
    const { orderBy, limit, where, cursor } = JSON.parse(queryData);

    const firstResults = await this.usersService.findAllUsers({
      take: parseInt(limit),
      orderBy,
      where,
    });

    if (!!cursor) {
      const nextResults = await this.usersService.findAllUsers({
        take: parseInt(limit),
        orderBy,
        skip: 1,
        cursor: {
          pseudonym: cursor,
        },
        where,
      });

      if (nextResults.length > 0) {
        return nextResults;
      } else {
        return allContent;
      }
    } else {
      return firstResults;
    }
  }

  @Get(':pseudonym')
  @UseGuards(new AuthGuard())
  async oneUser(@Param('pseudonym') pseudonym: string) {
    return await this.usersService.findUser({ pseudonym });
  }

  @Post()
  @UseGuards(new AuthGuard())
  // @UsePipes(new JoiValidationPipe(UsersPipe))
  async newUser(
    @Session() session: SessionContainer,
    @Body('userData') userData: Prisma.UsersCreateInput,
  ) {
    const id = session.getUserId();

    return this.usersService.createUser({
      ...userData,
      all_auth_recipe_users: {
        connect: {
          user_id: id,
        },
      },
    });
  }

  @Patch(':pseudonym')
  @UseGuards(new AuthGuard())
  // @UsePipes(new JoiValidationPipe(UsersPipe))
  @UseInterceptors(FilesPipe)
  async update(
    @Session() session: SessionContainer,
    @Param('pseudonym') pseudonym: string,
    @Body('data')
    data: Prisma.UsersUpdateInput | Prisma.UsersUncheckedUpdateInput,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ statusCode: number; message: string } | BadRequestException> {
    const id = session.getUserId();

    const updatedUser = await this.usersService.updateUser({
      where: { pseudonym },
      data: { ...data, file },
    });

    if (!!updatedUser) {
      await ses.revokeAllSessionsForUser(id);
      await session.revokeSession();
      return {
        statusCode: 200,
        message: 'Your password was updated',
      };
    } else {
      throw new BadRequestException('You have given the wrong data.');
    }
  }

  @Delete(':pseudonym')
  @UseGuards(new AuthGuard())
  async delete(
    @Session() session: SessionContainer,
    @Param('pseudonym') pseudonym: string,
  ) {
    const userId = session.getUserId();
    return this.usersService.deleteUser({ pseudonym }, userId, ses, session);
  }
}
