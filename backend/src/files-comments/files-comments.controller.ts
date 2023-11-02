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
import { Prisma, Role } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';

import { FilesCommentsService } from './files-comments.service';
import { FilesService } from '../files/files.service';
import { RolesService } from '../roles/rolesService';

@Controller('files-comments')
export class FilesCommentsController {
  constructor(
    private readonly fileCommentsService: FilesCommentsService,
    private filesService: FilesService,
    private rolesService: RolesService,
  ) {}

  @Get('/all')
  @UseGuards(new AuthGuard())
  async allComments(@Query('queryData') queryData: string) {
    const { orderBy, limit, where, cursor } = JSON.parse(queryData);

    const firstResults = await this.fileCommentsService.findAllComments({
      take: parseInt(limit),
      orderBy,
      where,
    });

    if (!!cursor) {
      const nextResults = await this.fileCommentsService.findAllComments({
        take: parseInt(limit),
        orderBy,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where,
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
  async newComment(
    @Body('data') data: Prisma.FilesCommentsCreateInput & { fileId: string },
    @Session() session: SessionContainer,
  ) {
    const userId = session.getUserId();

    const { authorId } = await this.filesService.findAuthorFile(data.fileId);
    const { id } = await this.rolesService.addRole({
      fileId: data.fileId,
      userId,
      role: userId === authorId ? Role.AUTHOR : Role.USER,
    });

    return this.fileCommentsService.addComment({
      ...data,
      roleId: id,
      authorId: userId,
    });
  }

  @Delete(':fileId/:roleId')
  @UseGuards(new AuthGuard())
  async delete(
    @Param('fileId') fileId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.fileCommentsService.removeComment(fileId, roleId);
  }
}
