import {
  CACHE_MANAGER,
  HttpException,
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
  ): Promise<GroupDto | null> {
    const _groupOne = await this.prisma.groups.findUnique({
      where: groupWhereUniqueInput,
      select: {
        name: true,
        description: true,
        logo: true,
      },
    });

    await this.cacheManager.set('groupOne', _groupOne);
    return _groupOne;
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

      await this.prisma.usersGroups.create({
        data: { groupId: userData.groupId, name, userId, roleId },
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
    where: Prisma.GroupsWhereUniqueInput;
  }): Promise<Groups> {
    const { data, where } = params;

    if (data === data.name || data.roleId || data.favorite) {
      await this.usersGroupsService.updateRelation(data, where);
    }
    return this.prisma.groups.update({ data, where });
  }

  async deleteGroup(
    where: Prisma.GroupsWhereUniqueInput,
  ): Promise<HttpException> {
    await this.prisma.groups.delete({ where });
    await this.usersGroupsService.deleteRelation(where);
    await this.cacheManager.del('groups');
    await this.cacheManager.del('groupOne');
    return deleted(where.name);
  }
}
