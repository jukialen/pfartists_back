import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersGroupsService {
  constructor(private prisma: PrismaService) {}

  async getTheGroupOfGivenUserAboutGivenRole(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UsersGroupsWhereUniqueInput;
    orderBy?: Prisma.UsersGroupsOrderByWithRelationInput;
    userId: string;
    roleId: string;
  }) {
    const { skip, orderBy, take, cursor, roleId, userId } = params;

    return this.prisma.usersGroups.findMany({
      where: {
        AND: [{ userId }, { roleId }, { roles: { some: { roleId } } }],
      },
      orderBy,
      take,
      skip,
      cursor,
      select: {
        usersGroupsId: true,
        favorite: true,
        groups: {
          select: { name: true, logo: true },
        },
      },
    });
  }

  async getFavs(userId: string) {
    const favs = await this.prisma.usersGroups.findMany({
      where: { AND: [{ userId }, { favorite: true }] },
      select: { name: true },
    });

    return {
      favLength: favs.length,
    };
  }

  async createRelation(data: Prisma.UsersGroupsUncheckedCreateInput) {
    const roleId = await this.prisma.roles.findFirst({
      where: { type: Role.USER },
      select: {
        roleId: true,
      },
    });
    return this.prisma.usersGroups.create({
      data: {
        name: data.name,
        groupId: data.groupId,
        roleId: roleId.roleId,
        userId: data.userId,
      },
    });
  }

  async updateRelation(
    data: Prisma.UsersGroupsUncheckedUpdateInput,
    where: Prisma.UsersGroupsWhereUniqueInput,
  ) {
    return this.prisma.usersGroups.update({ data, where });
  }

  async deleteRelation(where: Prisma.UsersGroupsWhereUniqueInput) {
    await this.prisma.usersGroups.delete({ where });
  }
}
