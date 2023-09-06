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
import { GroupDto } from '../DTOs/group.dto';

import { AuthGuard } from '../auth/auth.guard';
import { GroupsPipe } from '../Pipes/GroupsPipe';

import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async findALl(@Query('queryData') queryData: string) {
    const { orderBy, limit, where, cursor } = JSON.parse(queryData);

    const firstResults = await this.groupsService.groups({
      take: parseInt(limit),
      orderBy,
      where,
    });

    if (!!cursor) {
      const nextResults = await this.groupsService.groups({
        take: parseInt(limit),
        orderBy,
        skip: 1,
        cursor: {
          name: cursor,
        },
        where,
      });

      if (nextResults.length > 0) {
        return nextResults;
      } else {
        return allContent;
      }
    }

    return firstResults;
  }

  @Get('favorites')
  @UseGuards(new AuthGuard())
  async favorites(@Session() session: SessionContainer) {
    const userId = session.getUserId();
    return this.groupsService.findFavoritesGroups(userId);
  }
  @Get('members/:groupId/:role')
  @UseGuards(new AuthGuard())
  async members(
    @Param('groupId') groupId: string,
    @Param('role') role: Role,
    @Query('queryData') queryData: string,
  ) {
    const { limit, cursor } = JSON.parse(queryData);

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
    // const getCache: GroupDto = await this.cacheManager.get('groupsOne');
    //
    // if (!!getCache) {
    //   return getCache;
    // } else {
    return this.groupsService.findGroup({ name }, userId);
    // }
  }

  @Post()
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(GroupsPipe))
  async createGroup(
    @Session() session: SessionContainer,
    @Body('data')
    data: Prisma.GroupsCreateInput,
    // & Prisma.UsersGroupsUncheckedCreateInput,
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
    data: Prisma.GroupsUpdateInput & { usersGroupsId: string },
  ) {
    const userId = session.getUserId();

    return this.groupsService.updateGroup({
      data,
      userId,
      name,
    });
  }

  @Patch(':name/:newRole')
  @UseGuards(new AuthGuard())
  async newRole(
    @Session() session: SessionContainer,
    @Param('name') name: string,
    @Param('newRole') newRole: Role,
  ) {
    const userId = session.getUserId();
    return this.groupsService.updateRole(newRole, name, userId);
  }

  @Patch(':roleId/favs/:usersGroupsId')
  @UseGuards(new AuthGuard())
  async changingFavorites(
    @Param('roleId') roleId: string,
    @Param('usersGroupsId') usersGroupsId: string,
    @Body('favs') favs: boolean,
  ) {
    return this.groupsService.toggleFavs(roleId, favs, usersGroupsId);
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
