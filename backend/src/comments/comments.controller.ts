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
import { Comments, Prisma, Role } from '@prisma/client';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';

import { queriesTransformation } from '../constants/queriesTransformation';
import { SortCommentsType } from '../DTOs/comments.dto';
import { QueryDto } from '../DTOs/query.dto';

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
  async allComments(@Query('queryData') queryData: QueryDto) {
    const getCache: Comments[] = await this.cacheManager.get('comments');

    const { orderBy, limit, where, cursor } = queryData;
    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortCommentsType =
        await queriesTransformation(true, orderBy, where);

      const firstResults = await this.commentsService.findAllComments({
        take: parseInt(limit),
        orderBy: order,
        where: whereElements,
      });

      if (!!cursor) {
        const nextResults = await this.commentsService.findAllComments({
          take: parseInt(limit),
          orderBy: order,
          skip: 1,
          cursor: {
            commentId: cursor,
          },
          where: whereElements,
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
    data: Prisma.CommentsCreateInput & { postId: string },
  ) {
    const userId = session.getUserId();
    const { id, groupId } = await this.rolesService.getPostRoleId(
      Role.AUTHOR,
      data.postId,
    );

    return this.commentsService.addComment(
      { ...data, authorId: userId, roleId: id },
      groupId,
    );
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
