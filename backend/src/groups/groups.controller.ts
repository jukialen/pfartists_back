import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  NotAcceptableException,
  Param,
  Patch,
  Post,
  Query, UseGuards,
} from '@nestjs/common';
import { Groups as GroupsModel, Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';

import { GroupsService } from './groups.service';
import { stringToJsonForGet } from '../utilities/convertValues';
import { allContent } from '../constants/allCustomsHttpMessages';
import { GroupDto } from '../DTOs/group.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @UseGuards(new AuthGuard())
  async findALl(
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('where') where?: string,
    @Query('cursor') cursor?: string,
  ): Promise<GroupDto[] | { message: string; statusCode: HttpStatus }> {
    const getCache: GroupDto[] = await this.cacheManager.get('groups');

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

      const firstResults = await this.groupsService.groups({
        take: parseInt(limit) || undefined,
        orderBy: order || undefined,
        where: whereElements || undefined,
      });

      const firstNextData: GroupDto[] = [];
      const nextData: GroupDto[] = [];

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

        if (nextResults.length > 0) {
          if (firstNextData.length === 0) {
            firstNextData.concat(firstResults, nextResults);
            await this.cacheManager.set('groups', firstNextData, 0);
            return firstNextData;
          }

          if (nextData.length === 0) {
            nextData.concat(firstNextData, nextResults);
            await this.cacheManager.set('groups', nextData, 0);
            return nextData;
          }

          nextData.concat(nextResults);
          await this.cacheManager.set('groups', nextData, 0);
          return nextData;
        } else {
          return allContent;
        }
      }

      await this.cacheManager.set('groups', firstResults, 0);
      return firstResults;
    }
  }

  @Get(':id')
  @UseGuards(new AuthGuard())
  async findOne(@Param('id') id: string): Promise<GroupDto> {
    const getCache: GroupDto = await this.cacheManager.get('groupsOne');

    if (!!getCache) {
      return getCache;
    } else {
      await this.groupsService.findGroup({ groupId: id });
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  async createGroup(
    @Body() groupData: Prisma.GroupsCreateInput,
  ): Promise<string | NotAcceptableException> {
    return this.groupsService.createGroup(groupData);
  }

  @Patch(':groupId')
  @UseGuards(new AuthGuard())
  async updateGroup(
    @Param('groupId') groupId: string,
    @Body('data')
    data: Prisma.GroupsUpdateInput | Prisma.GroupsUncheckedUpdateInput,
  ): Promise<GroupsModel> {
    return this.groupsService.updateGroup({
      where: { groupId },
      data,
    });
  }

  @Delete(':username')
  @UseGuards(new AuthGuard())
  async deleteGroup(
    @Param('username') username: string,
  ): Promise<HttpException> {
    return await this.groupsService.deleteGroup({ name: username });
  }
}
