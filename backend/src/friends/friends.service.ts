import {
  BadRequestException,
  CACHE_MANAGER,
  HttpException,
  Inject,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Friends, Prisma } from '@prisma/client';

import { deleted } from '../constants/allCustomsHttpMessages';
import { FriendDto } from '../DTOs/friend.dto';

@Injectable()
export class FriendsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async findFriend(
    friendWhereUniqueInput: Prisma.FriendsWhereUniqueInput,
  ): Promise<FriendDto | null> {
    const _findOne = await this.prisma.friends.findUnique({
      where: friendWhereUniqueInput,
    });

    const friendArray: FriendDto = {
      username: _findOne.usernameId,
      friend: _findOne.friendId,
    };

    await this.cacheManager.set('friendOne', friendArray, 0);
    return friendArray;
  }

  async friends(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FriendsWhereUniqueInput;
    where?: Prisma.FriendsWhereInput;
    orderBy?: Prisma.FriendsOrderByWithRelationInput;
  }): Promise<FriendDto[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const friendsArray: FriendDto[] = [];

    const _friends = await this.prisma.friends.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });

    for (const _f of _friends) {
      friendsArray.push({
        username: _f.usernameId,
        friend: _f.friendId,
      });
    }

    return friendsArray;
  }

  async createFriend(
    data: Prisma.FriendsUncheckedCreateInput,
  ): Promise<string | NotAcceptableException> {
    try {
      const { usernameId, friendId } = data;

      usernameId === friendId &&
        new BadRequestException('Your friend cannot be you.');

      const addedFriend = await this.friends({
        where: { AND: [{ usernameId }, { friendId }] },
      });

      addedFriend.length > 0 &&
        new NotAcceptableException(`We're already friends.`);

      await this.prisma.friends.create({
        data,
      });

      return `Success!!! We're friends.`;
    } catch (e) {
      console.error(e);
    }
  }

  async updateFriend(params: {
    where: Prisma.FriendsWhereUniqueInput;
    data: Prisma.FriendsUpdateInput;
  }): Promise<Friends> {
    const { where, data } = params;
    return this.prisma.friends.update({ data, where });
  }

  async deleteFriend(
    where: Prisma.FriendsWhereUniqueInput,
  ): Promise<HttpException> {
    await this.prisma.friends.delete({ where });
    await this.cacheManager.del('friends');
    await this.cacheManager.del('friendOne');
    return deleted(where.usernameId);
  }
}
