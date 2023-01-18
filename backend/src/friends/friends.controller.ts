import {
  Body,
  CACHE_MANAGER,
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
} from '@nestjs/common';
import { Friends, Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';

import { FriendsService } from './friends.service';
import { stringToJsonForGet } from '../utilities/convertValues';
import { allContent } from '../constants/allCustomsHttpMessages';
import { FriendDto } from '../DTOs/friend.dto';

@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async findALl(
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('where') where?: string,
    @Query('cursor') cursor?: string,
  ): Promise<FriendDto[] | { message: string; statusCode: HttpStatus }> {
    const getCache: FriendDto[] = await this.cacheManager.get('friends');

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

      const firstResults = await this.friendsService.friends({
        take: parseInt(limit) || undefined,
        orderBy: order || undefined,
        where: whereElements || undefined,
      });

      const firstNextData: FriendDto[] = [];
      const nextData: FriendDto[] = [];

      if (!!cursor) {
        const nextResults = await this.friendsService.friends({
          take: parseInt(limit) || undefined,
          orderBy: order || undefined,
          skip: 1,
          cursor: {
            id: cursor,
          },
          where: whereElements || undefined,
        });

        if (nextResults.length > 0) {
          if (firstNextData.length === 0) {
            firstNextData.concat(firstResults, nextResults);
            await this.cacheManager.set('friends', firstNextData, 0);
            return firstNextData;
          }

          if (nextData.length === 0) {
            nextData.concat(firstNextData, nextResults);
            await this.cacheManager.set('friends', nextData, 0);
            return nextData;
          }

          nextData.concat(nextResults);
          await this.cacheManager.set('friends', nextData, 0);
          return nextData;
        } else {
          return allContent;
        }
      }

      await this.cacheManager.set('friends', firstResults, 0);
      return firstResults;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FriendDto> {
    const getCache: FriendDto = await this.cacheManager.get('friendsOne');

    if (!!getCache) {
      return getCache;
    } else {
      await this.friendsService.findFriend({ id });
    }
  }

  @Post()
  async createFriend(
    @Body()
    friendData: {
      username: string;
      friends: string;
      usersFriends: Prisma.UsersCreateNestedOneWithoutUserInFriendInput;
      friend: Prisma.UsersCreateNestedOneWithoutFriendInput;
    },
  ): Promise<string | NotAcceptableException> {
    return this.friendsService.createFriend(friendData);
  }

  @Patch()
  async updateFriend(
    @Param('id') id: string,
    @Param('data') data: Prisma.FriendsUpdateInput,
  ): Promise<Friends> {
    return this.friendsService.updateFriend({
      where: { id },
      data,
    });
  }

  @Delete(':username')
  async deleteFiend(
    @Param('username') username: string,
  ): Promise<HttpException> {
    return await this.friendsService.deleteFriend({ usernameId: username });
  }
}
