import {
  Body,
  CACHE_MANAGER,
  CacheInterceptor,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  NotAcceptableException,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';
import ses from 'supertokens-node/recipe/session';

import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';

import { stringToJsonForGet } from '../utilities/convertValues';
import { allContent } from '../constants/allCustomsHttpMessages';
import { UserDto } from '../DTOs/user.dto';

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
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('where') where?: string,
    @Query('cursor') cursor?: string,
  ): Promise<UserDto[] | { message: string; statusCode: HttpStatus }> {
    const getCache: UserDto[] = await this.cacheManager.get('users');

    if (!!getCache) {
      return getCache;
    } else {
      let order;

      if (typeof orderBy === 'string') {
        try {
          const { orderArray } = await stringToJsonForGet(orderBy);
          order = orderArray;
        } catch (e) {
          console.error(e);
        }
      }

      let whereElements;

      if (typeof where === 'string') {
        try {
          const { whereObj } = await stringToJsonForGet(where);
          whereElements = whereObj;
        } catch (e) {
          console.error(e);
        }
      }

      const firstResults = await this.usersService.users({
        take: parseInt(limit) || undefined,
        orderBy: order || undefined,
        where: whereElements || undefined,
      });

      const firstNextData: UserDto[] = [];
      const nextData: UserDto[] = [];

      if (!!cursor) {
        const nextResults = await this.usersService.users({
          take: parseInt(limit) || undefined,
          orderBy: order || undefined,
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
      }

      await this.cacheManager.set('users', firstResults, 0);
      return firstResults;
    }
  }
  @Get(':pseudonym')
  @UseGuards(new AuthGuard())
  async getOneUser(@Param('pseudonym') pseudonym: string): Promise<UserDto> {
    const getCache: UserDto = await this.cacheManager.get('userOne');

    if (!!getCache) {
      return getCache;
    } else {
      return await this.usersService.findUser({ pseudonym });
    }
  }

  @Post()
  async signUp(
    @Body() userData: Prisma.UsersCreateInput,
  ): Promise<string | NotAcceptableException> {
    return this.usersService.createUser(userData);
  }
  @Patch(':pseudonym')
  @UseGuards(new AuthGuard())
  async updateUsername(
    @Session() session: SessionContainer,
    @Param('pseudonym') pseudonym: string,
    @Body('data')
    data: Prisma.UsersUpdateInput | Prisma.UsersUncheckedUpdateInput,
  ): Promise<{ statusCode: number; message: string }> {
    const updatedUser = await this.usersService.updateUser({
      where: { pseudonym },
      data,
    });
    if (!!updatedUser) {
      const { id } = await this.getOneUser(pseudonym);
      await ses.revokeAllSessionsForUser(id);
      await session.revokeSession();
      return {
        statusCode: 200,
        message: 'Your password was updated',
      };
    }
  }
  @Delete(':pseu')
  @UseGuards(new AuthGuard())
  async delete(
    @Session() session: SessionContainer,
    @Param('pseu') pseu: string,
  ): Promise<HttpException | UnauthorizedException> {
    const userId = session.getUserId();
    if (userId) {
      return await this.usersService.deleteUser({ pseudonym: pseu }, userId);
    } else {
      throw new UnauthorizedException(`You aren't sign in.`);
    }
  }
}
