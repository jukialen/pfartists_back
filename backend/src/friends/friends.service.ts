import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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

    if (!_findOne) {
      throw new BadRequestException(`He/She isn't your friends`);
    }

    const friendArray: FriendDto = {
      id: _findOne.id,
      usernameId: _findOne.usernameId,
      friendId: _findOne.friendId,
      favorite: _findOne.favorite,
    };

    await this.cacheManager.set(`friend ${friendArray.id}`, friendArray);
    return friendArray;
  }

  async friends(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FriendsWhereUniqueInput;
    where?: Prisma.FriendsWhereInput;
    orderBy?: Prisma.FriendsOrderByWithRelationInput;
  }) {
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
        id: _f.id,
        usernameId: _f.usernameId,
        friendId: _f.friendId,
        favorite: _f.favorite,
      });
    }

    return friendsArray;
  }

  async createFriend(
    data: Prisma.FriendsUncheckedCreateInput,
  ): Promise<string | NotAcceptableException | BadRequestException> {
    const { usernameId, friendId } = data;

    if (usernameId === friendId) {
      throw new BadRequestException('Your friend cannot be you.');
    }

    const addedFriend = await this.friends({
      where: { AND: [{ usernameId }, { friendId }] },
    });

    if (addedFriend.length > 0) {
      throw new NotAcceptableException(`We're already friends.`);
    }
    await this.prisma.friends.create({ data });

    return `Success!!! We're friends.`;
  }

  async updateFriend(params: {
    where: Prisma.FriendsWhereUniqueInput;
    data: Prisma.FriendsUpdateInput;
  }) {
    try {
      const { where, data } = params;
      await this.cacheManager.del(`friend ${where.id} `);
      return this.prisma.friends.update({ data, where });
    } catch (e) {
      console.error(e);
    }
  }

  async deleteFriend(where: Prisma.FriendsWhereUniqueInput) {
    await this.prisma.friends.delete({ where });
    // await this.cacheManager.del(`friends_${where || ''}_${orderBy || ''}_${limit || ''}_${cursor || ''}`);
    await this.cacheManager.del(`friend ${where.id}`);
    return deleted(where.id);
  }
}
