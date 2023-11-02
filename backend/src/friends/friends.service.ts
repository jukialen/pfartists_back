import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

import { deleted } from '../constants/allCustomsHttpMessages';
import { FriendDto } from '../DTOs/friend.dto';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async findFriend(friendWhereUniqueInput: Prisma.FriendsWhereUniqueInput) {
    const _findOne = await this.prisma.friends.findUnique({
      where: friendWhereUniqueInput,
      select: {
        id: true,
        usernameId: true,
        favorite: true,
        createdAt: true,
        updatedAt: true,
        friends: {
          select: {
            pseudonym: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!_findOne) {
      throw new BadRequestException(`He/She isn't your friends`);
    }

    const friendArray: FriendDto = {
      id: _findOne.id,
      usernameId: _findOne.usernameId,
      favorite: _findOne.favorite,
      pseudonym: _findOne.friends.pseudonym,
      profilePhoto: _findOne.friends.profilePhoto,
      createdAt: _findOne.createdAt,
      updatedAt: _findOne.updatedAt,
    };

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
    const friends = await this.prisma.friends.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        friends: {
          select: {
            pseudonym: true,
            profilePhoto: true,
          },
        },
      },
    });

    for (const _f of friends) {
      friendsArray.push({
        id: _f.id,
        usernameId: _f.usernameId,
        pseudonym: _f.friends.pseudonym,
        profilePhoto: _f.friends.profilePhoto,
        favorite: _f.favorite,
        createdAt: _f.createdAt,
        updatedAt: _f.updatedAt,
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
      return this.prisma.friends.update({ data, where });
    } catch (e) {
      console.error(e);
    }
  }

  async deleteFriend(where: Prisma.FriendsWhereUniqueInput) {
    await this.prisma.friends.delete({ where });
    return deleted(where.id);
  }
}
