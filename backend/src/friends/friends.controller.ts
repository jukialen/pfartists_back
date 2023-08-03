import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { AuthGuard } from '../auth/auth.guard';

import { FriendsService } from './friends.service';

import { JoiValidationPipe } from '../Pipes/JoiValidationPipe';
import { FriendsPipe } from '../Pipes/FriendsPipe';

import { allContent } from '../constants/allCustomsHttpMessages';
import { queriesTransformation } from '../constants/queriesTransformation';
import { FriendDto, SortType } from '../DTOs/friend.dto';
import { QueryDto } from '../DTOs/query.dto';

@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @UseGuards(new AuthGuard())
  async findALl(@Query('queryData') queryData: QueryDto) {
    const { orderBy, limit, where, cursor } = queryData;

    const getCache: FriendDto[] = await this.cacheManager.get(
      `friends_${where || ''}_${orderBy || ''}_${limit || ''}_${cursor || ''}`,
    );

    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortType = await queriesTransformation(
        true,
        orderBy,
        where,
      );

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
            await this.cacheManager.set(
              `friends_${where || ''}_${orderBy || ''}_${limit || ''}_${
                cursor || ''
              }`,
              firstNextData,
            );
            return firstNextData;
          }

          if (nextData.length === 0) {
            nextData.concat(firstNextData, nextResults);
            await this.cacheManager.set(
              `friends_${where || ''}_${orderBy || ''}_${limit || ''}_${
                cursor || ''
              }`,
              nextData,
            );
            return nextData;
          }

          nextData.concat(nextResults);
          await this.cacheManager.set(
            `friends_${where || ''}_${orderBy || ''}_${limit || ''}_${
              cursor || ''
            }`,
            nextData,
          );
          return nextData;
        } else {
          return allContent;
        }
      }

      await this.cacheManager.set(
        `friends_${where || ''}_${orderBy || ''}_${limit || ''}_${
          cursor || ''
        }`,
        firstResults,
      );
      return firstResults;
    }
  }

  @Get(':id')
  @UseGuards(new AuthGuard())
  async findOne(@Param('id') id: string) {
    const getCache: FriendDto = await this.cacheManager.get(`friend ${id}`);

    if (!!getCache) {
      return getCache;
    } else {
      return this.friendsService.findFriend({ id });
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(FriendsPipe))
  async create(@Body() data: Prisma.FriendsUncheckedCreateInput) {
    return this.friendsService.createFriend(data);
  }

  @Patch(':id')
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(FriendsPipe))
  async update(
    @Param('id') id: string,
    @Body('data') data: Prisma.FriendsUpdateInput,
  ) {
    return this.friendsService.updateFriend({ where: { id }, data });
  }

  @Delete(':id')
  async deleteFiend(@Param('id') id: string) {
    return this.friendsService.deleteFriend({ id });
  }
}
