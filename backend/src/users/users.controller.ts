import {
  Body,
  CACHE_MANAGER,
  CacheInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
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
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';
import ses from 'supertokens-node/recipe/session';

import { queriesTransformation } from '../constants/queriesTransformation';
import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';
import { JoiValidationPipe } from '../Pipes/JoiValidationPipe';
import { FilesPipe } from '../Pipes/FilesPipe';
import { UsersPipe } from '../Pipes/UsersPipe';
import { allContent } from '../constants/allCustomsHttpMessages';
import { UserDto, SortType } from '../DTOs/user.dto';
import { QueryDto } from '../DTOs/query.dto';

import { UsersService } from './users.service';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async users(@Query('queryData') queryData: QueryDto) {
    const getCache: UserDto[] = await this.cacheManager.get('users');

    const { orderBy, limit, where, cursor } = queryData;
    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortType = await queriesTransformation(
        true,
        orderBy,
        where,
      );

      const firstResults = await this.usersService.findAllUsers({
        take: parseInt(limit),
        orderBy: order,
        where: whereElements,
      });

      if (!!cursor) {
        const nextResults = await this.usersService.findAllUsers({
          take: parseInt(limit),
          orderBy: order,
          skip: 1,
          cursor: {
            pseudonym: cursor,
          },
          where: whereElements,
        });

        if (nextResults.length > 0) {
          await this.cacheManager.set('users', nextResults);
          return nextResults;
        } else {
          return allContent;
        }
      } else {
        await this.cacheManager.set('users', firstResults);
        return firstResults;
      }
    }
  }

  @Get(':pseudonym')
  @UseGuards(new AuthGuard())
  async oneUser(@Param('pseudonym') pseudonym: string) {
    const getCache: UserDto = await this.cacheManager.get('userOne');

    if (!!getCache) {
      return getCache;
    } else {
      return await this.usersService.findUser({ pseudonym });
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(UsersPipe))
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
  @UsePipes(new JoiValidationPipe(UsersPipe))
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
