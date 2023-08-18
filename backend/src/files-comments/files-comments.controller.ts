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
import { Comments, Prisma } from '@prisma/client';

import { queriesTransformation } from '../constants/queriesTransformation';
import { AuthGuard } from '../auth/auth.guard';
import { SortFilesCommentsType } from '../DTOs/comments.dto';
import { QueryDto } from '../DTOs/query.dto';

import { FilesCommentsService } from './files-comments.service';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';

@Controller('files-comments')
export class FilesCommentsController {
  constructor(
    private readonly fileCommentsService: FilesCommentsService,
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
    @Body('data') data: Prisma.FilesCommentsUncheckedCreateInput,
    @Session() session: SessionContainer,
  ) {
    const userId = session.getUserId();
    return this.fileCommentsService.addComment(data, userId);
  }

  @Delete(':fileId/:roleId')
  @UseGuards(new AuthGuard())
  async delete(
    @Param('fileId') fileId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.cacheManager.del('comments');
    return this.fileCommentsService.removeComment(fileId, roleId);
  }
}
