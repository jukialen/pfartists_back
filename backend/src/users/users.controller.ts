import {
  Body,
  CACHE_MANAGER,
  CacheInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Query,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  NotAcceptableException,
  Post,
  UsePipes,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';
import ses from 'supertokens-node/recipe/session';

import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';

import { queriesTransformation } from '../constants/queriesTransformation';
import { allContent } from '../constants/allCustomsHttpMessages';
import { UserDto, SortType } from '../DTOs/user.dto';
import { JoiValidationPipe } from '../Pipes/JoiValidationPipe';
import { UsersPipe } from '../Pipes/UsersPipe';
import { QueryDto } from '../DTOs/query.dto';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  @Get()
  @UseGuards(new AuthGuard())
  async findAll(
    @Query('queryData')
    queryData: QueryDto,
  ): Promise<UserDto[] | { message: string; statusCode: HttpStatus }> {
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

      const firstResults = await this.usersService.users({
        take: parseInt(limit) || undefined,
        orderBy: [order] || undefined,
        where: whereElements || undefined,
      });

      const firstNextData: UserDto[] = [];
      const nextData: UserDto[] = [];

      if (!!cursor) {
        const nextResults = await this.usersService.users({
          take: parseInt(limit) || undefined,
          orderBy: [order] || undefined,
          skip: 1,
          cursor: {
            pseudonym: cursor,
          },
          where: whereElements || undefined,
        });

        if (nextResults.length > 0) {
          if (firstNextData.length === 0) {
            firstNextData.concat(firstResults, nextResults);
            await this.cacheManager.set('users', firstNextData, 0);
            return firstNextData;
          }

          if (nextData.length === 0) {
            nextData.concat(firstNextData, nextResults);
            await this.cacheManager.set('users', nextData, 0);
            return nextData;
          }

          nextData.concat(nextResults);
          await this.cacheManager.set('users', nextData, 0);
          return nextData;
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
  async findOne(
    @Session() session: SessionContainer,
    @Param('pseudonym') pseudonym: string,
  ): Promise<UserDto> {
    const getCache: UserDto = await this.cacheManager.get('userOne');

    if (!!getCache) {
      return getCache;
    } else {
      return await this.usersService.findUser(session, { pseudonym });
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(UsersPipe))
  async newUser(
    @Body() userData: Prisma.UsersCreateInput,
  ): Promise<string | NotAcceptableException> {
    return this.usersService.createUser(userData);
  }

  @Patch(':pseudonym')
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(UsersPipe))
  async update(
    @Session() session: SessionContainer,
    @Param('pseudonym') pseudonym: string,
    @Body('data')
    data: Prisma.UsersUpdateInput | Prisma.UsersUncheckedUpdateInput,
  ): Promise<{ statusCode: number; message: string } | BadRequestException> {
    const updatedUser = await this.usersService.updateUser({
      where: { pseudonym },
      data,
    });

    if (!!updatedUser) {
      const id = session.getUserId();
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
    return this.usersService.deleteUser(
      { pseudonym },
      session.getUserId(),
      ses,
      session,
    );
  }
}
