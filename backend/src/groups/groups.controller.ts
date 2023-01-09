import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Groups as GroupsModel, Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';

import { GroupsService } from './groups.service';
import { stringToJsonForGet } from '../utilities/convertValues';
import { allContent } from '../constants/allContent';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async findALl(
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('where') where?: string,
    @Query('cursor') cursor?: string,
  ): Promise<unknown | GroupsModel[] | NotFoundException> {
    const getCache = await this.cacheManager.get('groups');

    if (!!getCache) {
      return getCache;
    } else {
      let order;

      if (typeof orderBy === 'string') {
        try {
          const { orderArray } = await stringToJsonForGet(orderBy);
          order = orderArray;
        } catch (e) {
          console.error(e);
        }
      }

      let whereElements;

      if (typeof where === 'string') {
        try {
          const { whereObj } = await stringToJsonForGet(where);
          whereElements = whereObj;
        } catch (e) {
          console.error(e);
        }
      }

      let firstGroups = await this.groupsService.groups({
        take: parseInt(limit) || undefined,
        orderBy: order || undefined,
        where: whereElements || undefined,
      });

      if (!!cursor) {
        const nextResults = await this.groupsService.groups({
          take: parseInt(limit) || undefined,
          orderBy: order || undefined,
          skip: 1,
          cursor: {
            groupId: cursor,
          },
          where: whereElements || undefined,
        });

        const nextData = [];
        nextData.concat(...firstGroups, nextResults);
        firstGroups = null;
        await this.cacheManager.set('groups', nextData, 0);

        return nextData;
      } else if (!!firstGroups) {
        await this.cacheManager.set('groups', firstGroups, 0);

        return firstGroups;
      } else {
        return allContent;
      }
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GroupsModel> {
    return this.groupsService.findGroup({ groupId: id });
  }

  @Post()
  async createGroup(
    @Body()
    groupData: {
      name: string;
      description: string;
      adminId: string;
      owner: Prisma.UsersCreateNestedOneWithoutOwnerInput;
    },
  ): Promise<GroupsModel> {
    return this.groupsService.createGroup(groupData);
  }

  @Patch()
  async updateGroup(
    @Param('groupId') groupId: string,
    @Param('data') data: Prisma.GroupsUpdateInput,
  ): Promise<GroupsModel> {
    return this.groupsService.updateGroup({
      where: { groupId },
      data,
    });
  }

  @Delete(':name')
  async deleteGroup(@Param('name') name: GroupsModel): Promise<GroupsModel> {
    await this.cacheManager.del('groups');
    return this.groupsService.deleteGroup(name);
  }
}
