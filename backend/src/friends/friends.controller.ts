import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';

import { FriendsService } from './friends.service';

import { JoiValidationPipe } from '../Pipes/JoiValidationPipe';
import { FriendsPipe } from '../Pipes/FriendsPipe';

import { allContent } from '../constants/allCustomsHttpMessages';
import { FriendDto } from '../DTOs/friend.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async findALl(@Query('queryData') queryData: string) {
    const { orderBy, limit, where, cursor } = JSON.parse(queryData);

    const firstResults = await this.friendsService.friends({
      take: parseInt(limit),
      orderBy,
      where,
    });

    const firstNextData: FriendDto[] = [];
    const nextData: FriendDto[] = [];

    if (!!cursor) {
      const nextResults = await this.friendsService.friends({
        take: parseInt(limit),
        orderBy,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where,
      });

      if (nextResults.length > 0) {
        if (firstNextData.length === 0) {
          firstNextData.concat(firstResults, nextResults);
          return firstNextData;
        }

        if (nextData.length === 0) {
          nextData.concat(firstNextData, nextResults);
          return nextData;
        }

        nextData.concat(nextResults);
        return nextData;
      } else {
        return allContent;
      }
    }

    return firstResults;
  }

  @Get(':id')
  @UseGuards(new AuthGuard())
  async findOne(@Param('id') id: string) {
    return this.friendsService.findFriend({ id });
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
