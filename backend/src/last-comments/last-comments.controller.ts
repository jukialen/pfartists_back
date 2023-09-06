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
import { LastComments, Prisma, Role } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';

import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';

import { LastCommentsService } from './last-comments-service';
import { RolesService } from '../roles/rolesService';

@Controller('last-comments')
export class LastCommentsController {
  constructor(
    private readonly lastCommentsService: LastCommentsService,
    private rolesService: RolesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async allComments(@Query('queryData') queryData: string) {
    const getCache: LastComments[] = await this.cacheManager.get(
      'lastComments',
    );

    const { orderBy, limit, where, cursor } = JSON.parse(queryData);
    if (!!getCache) {
      return getCache;
    } else {
      const firstResults = await this.lastCommentsService.findAllLastComments({
        take: parseInt(limit),
        orderBy,
        where,
      });

      if (!!cursor) {
        const nextResults = await this.lastCommentsService.findAllLastComments({
          take: parseInt(limit),
          orderBy,
          where,
          cursor: {
            lastCommentId: cursor,
          },
        });

        if (nextResults.length > 0) {
          await this.cacheManager.set('lastComments', nextResults);
          return nextResults;
        } else {
          return 'No more comments';
        }
      } else {
        await this.cacheManager.set('lastComments', firstResults);
        return firstResults;
      }
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  async newSubComments(
    @Session() session: SessionContainer,
    @Body('data')
    data: Prisma.LastCommentsUncheckedCreateInput & {
      fileId?: string;
      postId?: string;
    },
  ) {
    const { fileId, postId } = data;
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

      return this.lastCommentsService.addLastComment({
        ...data,
        authorId,
        roleId: id,
        adModRoleId,
      });
    }

    return this.lastCommentsService.addLastComment({
      ...data,
      authorId,
      roleId: id,
    });
  }

  @Delete(':lastCommentId/:roleId/:groupRole')
  @UseGuards(new AuthGuard())
  async delete(
    @Param('lastCommentId') lastCommentId: string,
    @Param('roleId') roleId: string,
    @Param('groupRole') groupRole: Role | null,
  ) {
    await this.cacheManager.del('lastComments');
    return this.lastCommentsService.deleteLastComment(
      lastCommentId,
      roleId,
      groupRole,
    );
  }
}
