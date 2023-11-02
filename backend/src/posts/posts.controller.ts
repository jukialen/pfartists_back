import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuthGuard } from '../auth/auth.guard';
import { PostsService } from './posts.service';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get('/all')
  @UseGuards(new AuthGuard())
  async relations(
    @Query('queryData') queryData: string,
    @Session() session: SessionContainer,
  ) {
    const userId = session.getUserId();

    const { orderBy, limit, where, cursor } = JSON.parse(queryData);

    const firstResults = await this.postsService.findAllPosts({
      take: parseInt(limit),
      orderBy,
      where,
      userId,
    });

    if (!!cursor) {
      const nextResults = await this.postsService.findAllPosts({
        take: parseInt(limit),
        orderBy,
        skip: 1,
        cursor: {
          postId: cursor,
        },
        where,
        userId,
      });

      if (nextResults.length > 0) {
        return nextResults;
      } else {
        return 'No more posts';
      }
    } else {
      return firstResults;
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
    data: Prisma.PostsCreateInput & { groupId: string },
  ) {
    const userId = session.getUserId();
    return this.postsService.createPost({ ...data, authorId: userId });
  }

  @Patch(':title')
  @UseGuards(new AuthGuard())
  async update(
    @Body('data') data: Prisma.PostsUpdateInput,
    @Param('title') title: string,
    @Session() session: SessionContainer,
  ) {
    const userId = session.getUserId();

    return this.postsService.updatePost(
      { ...data, authorId: userId },
      { title },
    );
  }

  @Delete('all')
  @UseGuards(new AuthGuard())
  async deletes(@Body('groupId') groupId: string) {
    return this.postsService.deletePosts(groupId);
  }

  @Delete(':postId/:groupId')
  @UseGuards(new AuthGuard())
  async delete(
    @Param('postId') postId: string,
    @Param('groupId') groupId: string,
    @Session() session: SessionContainer,
  ) {
    const userId = session.getUserId();
    return this.postsService.deletePost({ postId }, groupId, userId);
  }
}
