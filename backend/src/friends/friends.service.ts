import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Friends, Prisma } from '@prisma/client';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async findUser(
    friendWhereUniqueInput: Prisma.FriendsWhereUniqueInput,
  ): Promise<Friends | null> {
    return this.prisma.friends.findUnique({
      where: friendWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FriendsWhereUniqueInput;
    where?: Prisma.FriendsWhereInput;
    orderBy?: Prisma.FriendsOrderByWithRelationInput;
  }): Promise<Friends[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.friends.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createFriend(data: Prisma.FriendsCreateInput): Promise<Friends> {
    return this.prisma.friends.create({
      data,
    });
  }

  async updateFriend(params: {
    where: Prisma.FriendsWhereUniqueInput;
    data: Prisma.FriendsUpdateInput;
  }): Promise<Friends> {
    const { where, data } = params;
    return this.prisma.friends.update({
      data,
      where,
    });
  }

  async deleteFriend(where: Prisma.FriendsWhereUniqueInput): Promise<Friends> {
    return this.prisma.friends.delete({
      where
    });
  }
}
