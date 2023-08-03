import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Groups, Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';

import { UsersGroupsService } from '../users-groups/users-groups.service';

import { deleted } from '../constants/allCustomsHttpMessages';
import { GroupDto } from '../DTOs/group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private usersGroupsService: UsersGroupsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findGroup(
    groupWhereUniqueInput: Prisma.GroupsWhereUniqueInput,
    userId: string,
  ) {
    const join = await this.prisma.usersGroups.findFirst({
      where: {
        AND: [{ userId }, { name: groupWhereUniqueInput.name }],
      },
      select: {
        usersGroupsId: true,
        groupId: true,
        roleId: true,
        favorite: true,
      },
    });

    if (!!join) {
      const favs = await this.usersGroupsService.getFavs(userId);

      const _groupOne: GroupDto = await this.prisma.groups.findUnique({
        where: groupWhereUniqueInput,
        select: {
          description: true,
          logo: true,
          usersGroups: {
            where: {
              AND: [{ name: groupWhereUniqueInput.name }, { userId }],
            },
            select: {
              usersGroupsId: true,
              roles: {
                where: { roleId: join.roleId },
                select: { type: true },
              },
            },
          },
        },
      });

      const groupDataFromUser = {
        usersGroupId: _groupOne.usersGroups[0].usersGroupsId,
        description: _groupOne.description,
        logo: _groupOne.logo,
        favorites: favs.favLength,
        favorited: join.favorite,
        role: _groupOne.usersGroups[0].roles[0].type,
      };

      await this.cacheManager.set(
        `groupOne: ${groupWhereUniqueInput.name}`,
        groupDataFromUser,
      );

      return groupDataFromUser;
    } else {
      const _groupOne: GroupDto = await this.prisma.groups.findUnique({
        where: groupWhereUniqueInput,
        select: {
          groupId: true,
          description: true,
          logo: true,
          usersGroups: {
            where: {
              AND: [{ name: groupWhereUniqueInput.name }, { userId }],
            },
            select: {
              usersGroupsId: true,
              roleId: true,
            },
          },
        },
      });

      const groupData = {
        usersGroupId: _groupOne.usersGroups[0].usersGroupsId,
        description: _groupOne.description,
        logo: _groupOne.logo,
        roleId: _groupOne.usersGroups[0].roleId,
        groupId: _groupOne.groupId,
      };

      await this.cacheManager.set(
        `groupOne: ${groupWhereUniqueInput.name}`,
        groupData,
      );
      return groupData;
    }
  }

  async groups(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GroupsWhereUniqueInput;
    where?: Prisma.GroupsWhereInput;
    orderBy?: Prisma.GroupsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.groups.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      select: {
        name: true,
        description: true,
        logo: true,
      },
    });
  }

  async createGroup(
    data: Prisma.GroupsCreateInput & Prisma.UsersGroupsUncheckedCreateInput,
  ): Promise<string | NotAcceptableException> {
    const group = await this.groups({
      where: { name: data.name },
    });
    const { name, description, logo, roleId, userId } = data;

    if (group.length > 0) {
      throw new NotAcceptableException('The group already exists.');
    } else {
      const userData = await this.prisma.groups.create({
        data: {
          name,
          description,
          logo,
        },
        select: { name: true, groupId: true },
      });

      await this.usersGroupsService.createRelation({
        name,
        groupId: userData.groupId,
        roleId,
        userId,
      });
      return `Success!!! The group was created.`;
    }
  }

  async updateGroup(params: {
    data: Prisma.GroupsUpdateInput & Prisma.UsersGroupsUncheckedUpdateInput;
    where: Prisma.GroupsWhereUniqueInput & Prisma.UsersGroupsWhereUniqueInput;
  }): Promise<Groups> {
    const { data, where } = params;

    if (data === data.name || data.roleId || data.favorite) {
      await this.usersGroupsService.updateRelation(data, where);
    }
    return this.prisma.groups.update({ data, where });
  }

  async deleteGroup(
    where: Prisma.GroupsWhereUniqueInput & Prisma.UsersGroupsWhereInput,
  ) {
    await this.prisma.groups.delete({ where });
    await this.usersGroupsService.deleteRelation({
      usersGroupsId: where.usersGroupsId.toString(),
      roleId: where.roleId.toString(),
    });
    await this.cacheManager.del('groups');
    await this.cacheManager.del('groupOne');
    return deleted(where.name);
  }
}
