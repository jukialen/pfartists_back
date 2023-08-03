import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/rolesService';

@Injectable()
export class UsersGroupsService {
  constructor(
    private prisma: PrismaService,
    private rolesService: RolesService,
  ) {}

  async getTheGroupOfGivenUserAboutGivenRole(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UsersGroupsWhereUniqueInput;
    orderBy?: Prisma.UsersGroupsOrderByWithRelationInput;
    name: string;
    roleId: string;
  }) {
    const { skip, orderBy, take, cursor, name, roleId } = params;

    return this.prisma.usersGroups.findMany({
      where: {
        AND: [{ name }, { roleId }, { roles: { some: { roleId } } }],
      },
      orderBy,
      take,
      skip,
      cursor,
      select: {
        usersGroupsId: true,
        userId: true,
      },
    });
  }

  async getUserFromGroup(usersGroupsId: string) {
    const user = await this.prisma.usersGroups.findUnique({
      where: { usersGroupsId },
      select: { name: true },
    });

    return { name: user.name };
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
    const role = await this.rolesService.getRoleId('USER');

    return this.prisma.usersGroups.create({
      data: {
        name: data.name,
        groupId: data.groupId,
        roleId: role.roleId,
        userId: data.userId,
      },
    });
  }

  async updateRelation(
    data: Prisma.UsersGroupsUncheckedUpdateInput & { role?: Role },
    where: Prisma.UsersGroupsWhereUniqueInput,
  ) {
    const goodRole = await this.rolesService.canUpdateGroup(
      data.roleId.toString(),
    );

    if (goodRole && !data.role) {
      return this.prisma.usersGroups.update({ data, where });
    } else if (goodRole && !!data.role) {
      const newRoleId = await this.rolesService.getRoleId(data.role);

      return this.prisma.usersGroups.update({
        data: { roleId: newRoleId.roleId },
        where,
      });
    } else {
      throw new UnauthorizedException('You are neither admin nor moderator.');
    }
  }

  async deleteRelation(data: Prisma.UsersGroupsWhereInput) {
    const { usersGroupsId, roleId } = data;

    const role = await this.rolesService.canAddDelete(roleId.toString());

    if (role) {
      return this.prisma.usersGroups.delete({
        where: { usersGroupsId: usersGroupsId.toString() },
      });
    } else {
      throw new UnauthorizedException("You aren't admin.");
    }
  }
}
