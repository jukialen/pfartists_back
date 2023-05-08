import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  Inject,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersGroupsService } from './users-groups.service';
import { Prisma } from '@prisma/client';
import { RolesService } from '../roles/rolesService';
import { AuthGuard } from '../auth/auth.guard';
import { QueryDto } from '../DTOs/query.dto';
import { UsersGroupsDto, SortType } from '../DTOs/users-groups.dto';
import { queriesTransformation } from '../constants/queriesTransformation';
import { Cache } from 'cache-manager';

@Controller('users-groups')
export class UsersGroupsController {
  constructor(
    private usersGroupsService: UsersGroupsService,
    private rolesService: RolesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  //a group list with the given user role, e.g. all groups where the user is admin
  @Get('allSameRole')
  @UseGuards(new AuthGuard())
  async getAllGroups(
    @Query('queryData')
    queryData: QueryDto & { userId: string; roleId: string },
  ) {
    const { orderBy, limit, cursor, roleId, userId } = queryData;

    const { order }: SortType = await queriesTransformation(false, orderBy);

    const firstResults =
      await this.usersGroupsService.getTheGroupOfGivenUserAboutGivenRole({
        orderBy: order,
        take: parseInt(limit),
        roleId,
        userId,
      });

    const firstNextData: UsersGroupsDto[] = [];
    const nextData: UsersGroupsDto[] = [];

    if (!!cursor) {
      const nextResults =
        await this.usersGroupsService.getTheGroupOfGivenUserAboutGivenRole({
          orderBy: order,
          take: parseInt(limit),
          skip: 1,
          cursor: {
            usersGroupsId: cursor,
          },
          roleId,
          userId,
        });

      if (nextResults.length > 0) {
        if (firstNextData.length === 0) {
          return firstNextData.concat(firstResults, nextResults);
        }
        if (nextData.length === 0) {
          nextData.concat(firstNextData, nextResults);
        }

        nextData.concat(nextResults);
        await this.cacheManager.set('usersGroups', nextData);
        return nextData;
      } else {
        await this.cacheManager.set('usersGroups', firstResults);
        return firstResults;
      }
    } else {
      throw new UnauthorizedException("You haven't created groups");
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  async createRelation(
    @Body('data') data: Prisma.UsersGroupsUncheckedCreateInput,
  ) {
    return this.usersGroupsService.createRelation(data);
  }

  @Patch(':name')
  @UseGuards(new AuthGuard())
  async updateGroup(
    @Body('data') data: Prisma.UsersGroupsUncheckedUpdateInput,
  ) {
    const role = await this.rolesService.canUpdateGroup(data.roleId.toString());

    if (role) {
      return this.usersGroupsService.updateRelation(data, {
        usersGroupsId: data.usersGroupsId.toString(),
      });
    } else {
      throw new UnauthorizedException('You are neither admin nor moderator.');
    }
  }
  @Delete(':name')
  @UseGuards(new AuthGuard())
  async deleteGroup(
    @Body('data') data: Prisma.UsersGroupsUncheckedCreateInput,
  ) {
    const role = await this.rolesService.canAddDelete(data.roleId);

    if (role) {
      return this.usersGroupsService.deleteRelation(data);
    } else {
      throw new UnauthorizedException("You aren't admin.");
    }
  }
}
