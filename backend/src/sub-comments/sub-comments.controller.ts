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
import { Prisma, SubComments } from '@prisma/client';

import { queriesTransformation } from '../constants/queriesTransformation';
import { AuthGuard } from '../auth/auth.guard';
import { SortSubCommentsType } from '../DTOs/comments.dto';
import { QueryDto } from '../DTOs/query.dto';

import { SubCommentsService } from './sub-comments-service';

@Controller('sub-comments')
export class SubCommentsController {
  constructor(
    private subCommentsService: SubCommentsService,
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
  async newSubComments(@Body('data') data: Prisma.SubCommentsCreateInput) {
    return this.subCommentsService.addSubComment(data);
  }

  @Delete(':subCommentId')
  @UseGuards(new AuthGuard())
  async delete(@Param('subCommentId') subCommentId: string) {
    await this.cacheManager.del('subComments');
    return this.subCommentsService.removeSubComment(subCommentId);
  }
}
