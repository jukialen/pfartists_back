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
import { LastComments, Prisma } from '@prisma/client';

import { queriesTransformation } from '../constants/queriesTransformation';
import { AuthGuard } from '../auth/auth.guard';
import { SortLastCommentsType } from '../DTOs/comments.dto';
import { QueryDto } from '../DTOs/query.dto';

import { LastCommentsService } from './last-comments-service';

@Controller('last-comments')
export class LastCommentsController {
  constructor(
    private readonly lastCommentsService: LastCommentsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async allComments(@Query('queryData') queryData: QueryDto) {
    const getCache: LastComments[] = await this.cacheManager.get(
      'lastComments',
    );

    const { orderBy, limit, where, cursor } = queryData;
    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortLastCommentsType =
        await queriesTransformation(true, orderBy, where);

      const firstResults = await this.lastCommentsService.findAllLastComments({
        take: parseInt(limit),
        orderBy: order,
        where: whereElements,
      });

      if (!!cursor) {
        const nextResults = await this.lastCommentsService.findAllLastComments({
          take: parseInt(limit),
          orderBy: order,
          where: whereElements,
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
  async newSubComments(@Body('data') data: Prisma.LastCommentsCreateInput) {
    return this.lastCommentsService.addLastComment(data);
  }

  @Delete(':lastCommentId')
  @UseGuards(new AuthGuard())
  async delete(@Param('lastCommentId') lastCommentId: string) {
    await this.cacheManager.del('lastComments');
    return this.lastCommentsService.removeLastComment(lastCommentId);
  }
}
