import {
  BadRequestException,
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
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Friends, Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';

import { FriendsService } from './friends.service';
import { stringToJsonForGet } from '../utilities/convertValues';
import { allContent } from '../constants/allCustomsHttpMessages';
import { FriendDto } from '../DTOs/friend.dto';
import { AuthGuard } from '../auth/auth.guard';
import { JoiValidationPipe } from '../Pipes/JoiValidationPipe';
import { FriendsPipe } from '../Pipes/FriendsPipe';

@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @UseGuards(new AuthGuard())
  async findALl(
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('where') where?: string,
    @Query('cursor') cursor?: string,
  ): Promise<FriendDto[] | { message: string; statusCode: HttpStatus }> {
    const getCache: FriendDto[] = await this.cacheManager.get(
      `friends_${where || ''}_${orderBy || ''}_${limit || ''}_${cursor || ''}`,
    );

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
  async findOne(@Param('id') id: string): Promise<FriendDto> {
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
  async create(
    @Body() data: Prisma.FriendsUncheckedCreateInput,
  ): Promise<string | NotAcceptableException | BadRequestException> {
    return this.friendsService.createFriend(data);
  }

  @Patch(':id')
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(FriendsPipe))
  async update(
    @Param('id') id: string,
    @Body('data')
    data: Prisma.FriendsUpdateInput,
  ): Promise<Friends> {
    return this.friendsService.updateFriend({ where: { id }, data });
  }

  @Delete(':id')
  async deleteFiend(@Param('id') id: string): Promise<HttpException> {
    return this.friendsService.deleteFriend({ id });
  }
}
