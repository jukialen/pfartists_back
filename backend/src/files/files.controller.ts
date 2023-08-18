import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';

import { FilesService } from './files.service';

import { FilesPipe } from '../Pipes/FilesPipe';

import { allContent } from '../constants/allCustomsHttpMessages';
import { queriesTransformation } from '../constants/queriesTransformation';
import { QueryDto } from '../DTOs/query.dto';
import { FilesDto, SortType } from '../DTOs/file.dto';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';

@Controller('files')
export class FilesController {
  constructor(
    private filesService: FilesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async getFiles(@Query('queryData') queryData: QueryDto) {
    const getCache: FilesDto[] = await this.cacheManager.get('files');

    const { orderBy, limit, where, cursor } = queryData;

    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortType = await queriesTransformation(
        true,
        orderBy,
        where,
      );

      const firstResults = await this.filesService.findFiles({
        take: parseInt(limit) || undefined,
        orderBy: order || undefined,
        where: whereElements || undefined,
      });

      if (!!cursor) {
        const nextResults = await this.filesService.findFiles({
          take: parseInt(limit),
          orderBy: order,
          skip: 1,
          cursor: {
            fileId: cursor,
          },
          where: whereElements,
        });

        if (nextResults.length > 0) {
          await this.cacheManager.set('files', nextResults);
          return nextResults;
        } else {
          return allContent;
        }
      }

      await this.cacheManager.set('files', firstResults);
      return firstResults;
    }
  }

  @Get(':name')
  @UseGuards(new AuthGuard())
  async oneFile(@Param('name') name: string) {
    return this.filesService.findFile({ name });
  }

  @Post()
  @UseGuards(new AuthGuard())
  @UseInterceptors(FilesPipe)
  async uploadFile(
    @Session() session: SessionContainer,
    @UploadedFile() file: Express.Multer.File,
    @Body('data') data: Prisma.FilesUncheckedCreateInput,
  ) {
    const userId = await session?.getUserId();

    return this.filesService.uploadFile(data, userId, file);
  }

  @Delete(':name')
  @UseGuards(new AuthGuard())
  async deleteFile(@Param('name') name: string) {
    return await this.filesService.removeFile(name);
  }
}
