import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersGroupsService {
  constructor(private prisma: PrismaService) {}

  async findUserGroup(userId: string, name: string) {
    return this.prisma.usersGroups.findFirst({
      where: { AND: [{ userId }, { name }] },
      select: {
        usersGroupsId: true,
        groupId: true,
        roleId: true,
        favorite: true,
      },
    });
  }

  async findFavoritesGroups(userId: string) {
    return this.prisma.usersGroups.findMany({
      take: 5,
      orderBy: { name: 'desc' },
      where: { AND: [{ userId }, { favorite: true }] },
      select: {
        name: true,
      },
    });
  }

  async getFavsLength(userId: string) {
    const favs = await this.prisma.usersGroups.findMany({
      where: { AND: [{ userId }, { favorite: true }] },
      select: { name: true },
    });

    return {
      favLength: favs.length,
    };
  }

  async createRelation(data: Prisma.UsersGroupsUncheckedCreateInput) {
    return this.prisma.usersGroups.create({ data });
  }

  async updateRelation(
    data: Prisma.GroupsUpdateInput & Prisma.UsersGroupsUncheckedUpdateInput,
    where: Prisma.UsersGroupsWhereUniqueInput,
  ) {
    return this.prisma.usersGroups.update({
      data,
      where,
    });
  }

  async deleteRelations(groupId: string, userId: string) {
    return this.prisma.usersGroups.deleteMany({
      where: { AND: [{ groupId }, { userId }] },
    });
  }

  async deleteRelationsForOnlyDeletedGroup(name: string) {
    return this.prisma.usersGroups.deleteMany({ where: { name } });
  }
}
