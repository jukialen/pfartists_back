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
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { AuthGuard } from '../auth/auth.guard';
import { GroupsPosts, Prisma } from '@prisma/client';
import { GroupsPostsService } from './groups-posts.service';
import { QueryDto } from '../DTOs/query.dto';
import { SortType } from '../DTOs/user.dto';
import { queriesTransformation } from '../constants/queriesTransformation';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';

@Controller('groups-posts')
export class GroupsPostsController {
  constructor(
    private groupsPosts: GroupsPostsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @UseGuards(new AuthGuard())
  async relations(
    @Query('queryData') queryData: QueryDto,
    @Session() session: SessionContainer,
  ) {
    const userId = session.getUserId();

    const getCache: GroupsPosts[] = await this.cacheManager.get('groups-posts');

    const { orderBy, limit, where, cursor } = queryData;

    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortType = await queriesTransformation(
        true,
        orderBy,
        where,
      );

      const firstResults = await this.groupsPosts.findRelations({
        take: parseInt(limit) || undefined,
        orderBy: order || undefined,
        where: whereElements || undefined,
        userId,
      });

      if (!!cursor) {
        const nextResults = await this.groupsPosts.findRelations({
          take: parseInt(limit),
          orderBy: order,
          skip: 1,
          cursor: {
            postId: cursor,
          },
          where: whereElements,
          userId,
        });

        if (nextResults.length > 0) {
          await this.cacheManager.set('groups-posts', nextResults);
          return nextResults;
        } else {
          return 'No more posts';
        }
      } else {
        await this.cacheManager.set('groups-posts', firstResults);
        return firstResults;
      }
    }
  }

  @Get(':postId')
  @UseGuards(new AuthGuard())
  async relation(@Param('postId') postId: string) {
    return this.groupsPosts.findRegulation(postId);
  }

  @Post()
  @UseGuards(new AuthGuard())
  async newRelation(
    @Session() session: SessionContainer,
    @Body('data')
    data: Prisma.GroupsPostsUncheckedCreateInput & Prisma.PostsCreateInput,
  ) {
    const userId = session.getUserId();
    return this.groupsPosts.createRelation(data, userId);
  }

  @Patch(':groupsPostsId')
  @UseGuards(new AuthGuard())
  async update(
    @Body('data') data: Prisma.GroupsPostsUpdateInput,
    @Param('groupsPostsId') groupsPostsId: string,
  ) {
    return this.groupsPosts.updateRelation(data, { groupsPostsId });
  }

  @Delete(':postId')
  @UseGuards(new AuthGuard())
  async delete(@Param('postId') postId: string) {
    return this.groupsPosts.deleteRelation({ postId });
  }
}
