import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { Cache } from 'cache-manager';
import { JoiValidationPipe } from '../Pipes/JoiValidationPipe';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';

import { allContent } from '../constants/allCustomsHttpMessages';
import { queriesTransformation } from '../constants/queriesTransformation';
import { QueryDto } from '../DTOs/query.dto';
import { GroupDto, SortType } from '../DTOs/group.dto';

import { AuthGuard } from '../auth/auth.guard';
import { GroupsPipe } from '../Pipes/GroupsPipe';

import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async findALl(@Query('queryData') queryData: QueryDto) {
    const getCache: GroupDto[] = await this.cacheManager.get('groups');

    const { orderBy, limit, where, cursor } = queryData;

    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortType = await queriesTransformation(
        true,
        orderBy,
        where,
      );

      const firstResults = await this.groupsService.groups({
        take: parseInt(limit),
        orderBy: order,
        where: whereElements,
      });

      if (!!cursor) {
        const nextResults = await this.groupsService.groups({
          take: parseInt(limit) || undefined,
          orderBy: order || undefined,
          skip: 1,
          cursor: {
            name: cursor,
          },
          where: whereElements || undefined,
        });

        if (nextResults.length > 0) {
          await this.cacheManager.set('groups', nextResults);
          return nextResults;
        } else {
          return allContent;
        }
      }

      await this.cacheManager.set('groups', firstResults);
      return firstResults;
    }
  }

  @Get('members/:groupId/:role')
  @UseGuards(new AuthGuard())
  async members(
    @Param('groupId') groupId: string,
    @Param('role') role: Role,
    @Query('queryData') queryData: QueryDto,
  ) {
    const { limit, cursor } = queryData;

    const firstResults = await this.groupsService.findMembers(groupId, role, {
      take: parseInt(limit),
    });

    if (!!cursor) {
      const nextResults = await this.groupsService.findMembers(groupId, role, {
        skip: 1,
        take: parseInt(limit),
        cursor: { id: cursor },
      });

      if (nextResults.length > 0) {
        await this.cacheManager.set('groups', nextResults);
        return nextResults;
      } else {
        return allContent;
      }
    }

    return firstResults;
  }

  @Get('my-groups/:role')
  @UseGuards(new AuthGuard())
  async myGroups(
    @Session() session: SessionContainer,
    @Param('role') role: Role,
  ) {
    const userId = session.getUserId();
    return this.groupsService.findMyGroups(userId, role);
  }

  @Get(':name')
  @UseGuards(new AuthGuard())
  async findOne(
    @Session() session: SessionContainer,
    @Param('name') name: string,
  ) {
    const userId = session.getUserId();
    const getCache: GroupDto = await this.cacheManager.get('groupsOne');

    if (!!getCache) {
      return getCache;
    } else {
      return this.groupsService.findGroup({ name }, userId);
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(GroupsPipe))
  async createGroup(
    @Session() session: SessionContainer,
    @Body('data')
    data: Prisma.GroupsCreateInput & Prisma.UsersGroupsUncheckedCreateInput,
  ) {
    const userId = session.getUserId();

    return this.groupsService.createGroup({ ...data, userId });
  }

  @Post('join')
  @UsePipes(new JoiValidationPipe(GroupsPipe))
  async joining(
    @Session() session: SessionContainer,
    @Body('data')
    data: { name: string; groupId: string },
  ) {
    const userId = session.getUserId();

    return this.groupsService.joinUser(data.name, data.groupId, userId);
  }

  @Patch(':name')
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(GroupsPipe))
  async updateGroup(
    @Session() session: SessionContainer,
    @Param('name') name: string,
    @Body('data')
    data: Prisma.GroupsUpdateInput | Prisma.UsersGroupsUncheckedUpdateInput,
  ) {
    const userId = session.getUserId();

    return this.groupsService.updateGroup({
      data,
      userId,
      name,
    });
  }

  @Delete('unjoin/:usersGroupsId')
  async unJoinToGroup(@Param('usersGroupsId') usersGroupsId: string) {
    return this.groupsService.deleteUserFromGroup(usersGroupsId);
  }

  @Delete(':name/:groupId/:roleId')
  @UseGuards(new AuthGuard())
  async deleteGroup(
    @Param('name') name: string,
    @Param('groupId') groupId: string,
    @Param('roleId') roleId: string,
  ) {
    return await this.groupsService.deleteGroup(name, groupId, roleId);
  }
}
