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
import { Prisma, Role, SubComments } from '@prisma/client';

import { queriesTransformation } from '../constants/queriesTransformation';
import { SortSubCommentsType } from '../DTOs/comments.dto';
import { QueryDto } from '../DTOs/query.dto';

import { AuthGuard } from '../auth/auth.guard';

import { SubCommentsService } from './sub-comments-service';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { RolesService } from '../roles/rolesService';

@Controller('sub-comments')
export class SubCommentsController {
  constructor(
    private subCommentsService: SubCommentsService,
    private rolesService: RolesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async allComments(@Query('queryData') queryData: QueryDto) {
    const getCache: SubComments[] = await this.cacheManager.get('subComments');

    const { orderBy, limit, where, cursor } = queryData;
    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortSubCommentsType =
        await queriesTransformation(true, orderBy, where);

      const firstResults = await this.subCommentsService.findAllSubComments({
        take: parseInt(limit),
        orderBy: order,
        where: whereElements,
      });

      if (!!cursor) {
        const nextResults = await this.subCommentsService.findAllSubComments({
          take: parseInt(limit),
          orderBy: order,
          where: whereElements,
          cursor: {
            subCommentId: cursor,
          },
        });

        if (nextResults.length > 0) {
          await this.cacheManager.set('subComments', nextResults);
          return nextResults;
        } else {
          return 'No more comments';
        }
      } else {
        await this.cacheManager.set('subComments', firstResults);
        return firstResults;
      }
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  async newSubComments(
    @Session() session: SessionContainer,
    @Body('data')
    data: Prisma.SubCommentsCreateInput & {
      commentId?: string;
      fileCommentId?: string;
      fileId?: string;
      postId?: string;
    },
  ) {
    const { commentId, fileCommentId, fileId, postId } = data;
    const authorId = session.getUserId();

    const { id, groupId } = await this.rolesService.getCommentsRoleId(
      authorId,
      fileId,
      postId,
    );

    if (!!postId) {
      const { id: adModRoleId } = await this.rolesService.getGroupRoleId(
        groupId,
        authorId,
      );

      return this.subCommentsService.addSubComment({
        ...data,
        commentId,
        authorId,
        roleId: id,
        adModRoleId,
      });
    }

    return this.subCommentsService.addSubComment({
      ...data,
      commentId,
      authorId,
      fileCommentId,
      roleId: id,
    });
  }

  @Delete(':subCommentId/:roleId/:groupRole')
  @UseGuards(new AuthGuard())
  async delete(
    @Param('subCommentId') subCommentId: string,
    @Param('roleId') roleId: string,
    @Param('groupRole') groupRole: Role | null,
  ) {
    await this.cacheManager.del('subComments');
    return this.subCommentsService.deleteSubComment(
      subCommentId,
      roleId,
      groupRole,
    );
  }
}
