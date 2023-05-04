import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

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
    role: Role;
  }) {
    const { skip, orderBy, take, cursor, role, roleId, userId } = params;

    return this.prisma.usersGroups.findMany({
      where: {
        AND: [
          { userId },
          { roleId },
          {
            roles: {
              some: {
                AND: [{ roleId }, { type: role }, { userId }],
              },
            },
          },
        ],
      },
      orderBy,
      take,
      skip,
      cursor,
      select: {
        groups: {
          select: { name: true, logo: true },
        },
      },
    });
  }

  async createRelation(data: Prisma.UsersGroupsUncheckedCreateInput) {
    return this.prisma.usersGroups.create({ data });
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
