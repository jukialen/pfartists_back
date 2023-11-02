import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma, Role, SubComments } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';

import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';

import { SubCommentsService } from './sub-comments-service';
import { RolesService } from '../roles/rolesService';

@Controller('sub-comments')
export class SubCommentsController {
  constructor(
    private subCommentsService: SubCommentsService,
    private rolesService: RolesService,
  ) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async allComments(@Query('queryData') queryData: string) {
    const { orderBy, limit, where, cursor } = JSON.parse(queryData);

    const firstResults = await this.subCommentsService.findAllSubComments({
      take: parseInt(limit),
      orderBy,
      where,
    });

    if (!!cursor) {
      const nextResults = await this.subCommentsService.findAllSubComments({
        take: parseInt(limit),
        orderBy,
        where,
        cursor: {
          subCommentId: cursor,
        },
      });

      if (nextResults.length > 0) {
        return nextResults;
      } else {
        return 'No more comments';
      }
    } else {
      return firstResults;
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
    return this.subCommentsService.deleteSubComment(
      subCommentId,
      roleId,
      groupRole,
    );
  }
}
