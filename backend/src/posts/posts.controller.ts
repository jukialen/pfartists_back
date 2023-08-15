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
import { Posts, Prisma } from '@prisma/client';

import { AuthGuard } from '../auth/auth.guard';
import { PostsService } from './posts.service';
import { Cache } from 'cache-manager';
import { QueryDto } from '../DTOs/query.dto';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { SortType } from '../DTOs/posts.dto';
import { queriesTransformation } from '../constants/queriesTransformation';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('/all')
  @UseGuards(new AuthGuard())
  async relations(
    @Query('queryData') queryData: QueryDto,
    @Session() session: SessionContainer,
  ) {
    const userId = session.getUserId();

    const getCache: Posts[] = await this.cacheManager.get('groups-posts');

    const { orderBy, limit, where, cursor } = queryData;

    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortType = await queriesTransformation(
        false,
        orderBy,
        where,
      );

      const firstResults = await this.postsService.findAllPosts({
        take: parseInt(limit),
        orderBy: order,
        where: whereElements,
        userId,
      });

      if (!!cursor) {
        const nextResults = await this.postsService.findAllPosts({
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
          await this.cacheManager.set('posts', nextResults);
          return nextResults;
        } else {
          return 'No more posts';
        }
      } else {
        await this.cacheManager.set('posts', firstResults);
        return firstResults;
      }
    }
  }

  @Get(':postId')
  @UseGuards(new AuthGuard())
  async relation(@Param('postId') postId: string) {
    return this.postsService.findPost(postId);
  }

  @Post()
  @UseGuards(new AuthGuard())
  async newPost(
    @Session() session: SessionContainer,
    @Body('data')
    data: Prisma.PostsUncheckedCreateInput,
  ) {
    const userId = session.getUserId();
    return this.postsService.createPost({ ...data, authorId: userId });
  }

  @Patch(':title')
  @UseGuards(new AuthGuard())
  async update(
    @Body('data') data: Prisma.PostsUpdateInput,
    @Param('title') title: string,
  ) {
    return this.postsService.updatePost(data, { title });
  }

  @Delete('all')
  @UseGuards(new AuthGuard())
  async deletes(@Body('groupId') groupId: string) {
    return this.postsService.deletePosts(groupId);
  }

  @Delete(':postId')
  @UseGuards(new AuthGuard())
  async delete(@Param('postId') postId: string) {
    return this.postsService.deletePost({ postId });
  }
}
