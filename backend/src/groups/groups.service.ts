import {
  CACHE_MANAGER,
  HttpException,
  Inject,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Groups, Prisma } from '@prisma/client';

import { deleted } from '../constants/allCustomsHttpMessages';
import { Cache } from 'cache-manager';
import { GroupDto } from '../DTOs/group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findGroup(
    groupWhereUniqueInput: Prisma.GroupsWhereUniqueInput,
  ): Promise<GroupDto | null> {
    const _groupOne = await this.prisma.groups.findUnique({
      where: groupWhereUniqueInput,
    });

    const groupArray: GroupDto = {
      name: _groupOne.name,
      description: _groupOne.description,
      logoUrl: _groupOne.logoUrl,
      adminId: _groupOne.adminId,
      moderatorsId: _groupOne.moderatorsId,
      usersId: _groupOne.usersId,
    };

    await this.cacheManager.set('groupOne', groupArray, 0);
    return groupArray;
  }

  async groups(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GroupsWhereUniqueInput;
    where?: Prisma.GroupsWhereInput;
    orderBy?: Prisma.GroupsOrderByWithRelationInput;
  }): Promise<GroupDto[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const groupsArray: GroupDto[] = [];

    const _groups = await this.prisma.groups.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });

    for (const _g of _groups) {
      groupsArray.push({
        name: _g.name,
        description: _g.description,
        logoUrl: _g.logoUrl,
        adminId: _g.adminId,
        moderatorsId: _g.moderatorsId,
        usersId: _g.usersId,
      });
    }

    return groupsArray;
  }

  async createGroup(
    data: Prisma.GroupsCreateInput,
  ): Promise<string | NotAcceptableException> {
    const group = await this.groups({ where: { name: data.name } });

    group.length > 0 && new NotAcceptableException('The group already exists.');
    await this.prisma.groups.create({ data });

    return `Success!!! The group was created.`;
  }

  async updateGroup(params: {
    where: Prisma.GroupsWhereUniqueInput;
    data: Prisma.GroupsUpdateInput;
  }): Promise<Groups> {
    const { where, data } = params;
    return this.prisma.groups.update({ data, where });
  }

  async deleteGroup(
    where: Prisma.GroupsWhereUniqueInput,
  ): Promise<HttpException> {
    await this.prisma.groups.delete({ where });
    await this.cacheManager.del('groups');
    await this.cacheManager.del('groupOne');
    return deleted(where.name);
  }
}
