import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Comments, Role } from '@prisma/client';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';

import { AuthGuard } from '../auth/auth.guard';

import { CommentsService } from './comments.service';
import { RolesService } from '../roles/rolesService';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private rolesService: RolesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('/all')
  @UseGuards(new AuthGuard())
  async allComments(@Query('queryData') queryData: string) {
    const getCache: Comments[] = await this.cacheManager.get('comments');

    const { orderBy, limit, where, cursor } = JSON.parse(queryData);
    if (!!getCache) {
      return getCache;
    } else {
      const firstResults = await this.commentsService.findAllComments({
        take: parseInt(limit),
        orderBy,
        where,
      });

      if (!!cursor) {
        const nextResults = await this.commentsService.findAllComments({
          take: parseInt(limit),
          orderBy,
          skip: 1,
          cursor: {
            commentId: cursor,
          },
          where,
        });

        if (nextResults.length > 0) {
          await this.cacheManager.set('comments', nextResults);
          return nextResults;
        } else {
          return 'No more comments';
        }
      } else {
        await this.cacheManager.set('comments', firstResults);
        return firstResults;
      }
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  async newComment(
    @Session() session: SessionContainer,
    @Body('data')
    data: { comment: string; roleId: string },
  ) {
    const { roleId } = data;
    const userId = session.getUserId();

    const {
      groupId,
      postId,
      role,
      userId: authorId,
    } = await this.rolesService.getRole(roleId);

    let newRole: { id: string };

    if (authorId !== userId) {
      newRole = await this.rolesService.addRole({
        groupId,
        userId,
        role: Role.USER,
        postId,
      });
    }

    const { id: adModRoleId } = await this.rolesService.getGroupRoleId(
      groupId,
      userId,
    );

    return this.commentsService.addComment({
      ...data,
      authorId: userId,
      postId,
      roleId: role === Role.AUTHOR ? roleId : newRole.id,
      adModRoleId,
    });
  }

  @Delete(':commentId/:roleId/:groupRole')
  @UseGuards(new AuthGuard())
  async delete(
    @Param('commentId') commentId: string,
    @Param('roleId') roleId: string,
    @Param('groupRole') groupRole: Role,
  ) {
    await this.cacheManager.del('comments');
    return this.commentsService.deleteComment(commentId, roleId, groupRole);
  }
}
