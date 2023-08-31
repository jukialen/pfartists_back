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
import { SessionContainer } from 'supertokens-node/recipe/session';
import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';

import { queriesTransformation } from '../constants/queriesTransformation';
import { SortFilesCommentsType } from '../DTOs/comments.dto';
import { QueryDto } from '../DTOs/query.dto';

import { FilesCommentsService } from './files-comments.service';
import { FilesService } from '../files/files.service';
import { RolesService } from '../roles/rolesService';

@Controller('files-comments')
export class FilesCommentsController {
  constructor(
    private readonly fileCommentsService: FilesCommentsService,
    private filesService: FilesService,
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
      const { order, whereElements }: SortFilesCommentsType =
        await queriesTransformation(true, orderBy, where);

      const firstResults = await this.fileCommentsService.findAllComments({
        take: parseInt(limit),
        orderBy: order,
        where: whereElements,
      });

      if (!!cursor) {
        const nextResults = await this.fileCommentsService.findAllComments({
          take: parseInt(limit),
          orderBy: order,
          skip: 1,
          cursor: {
            id: cursor,
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
    await this.cacheManager.del('files-comments');
    return this.fileCommentsService.removeComment(fileId, roleId);
  }
}
