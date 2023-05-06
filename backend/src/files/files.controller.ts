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
import { FileDto, SortType } from '../DTOs/file.dto';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';

@Controller('files')
export class FilesController {
  constructor(
    private filesService: FilesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @UseGuards(new AuthGuard())
  async getFiles(@Query('queryData') queryData: QueryDto) {
    const getCache: FileDto[] = await this.cacheManager.get('files');

    const { orderBy, limit, where, cursor } = queryData;

    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortType = await queriesTransformation(
        true,
        orderBy,
        where,
      );

      const firstResults = await this.filesService.files({
        take: parseInt(limit) || undefined,
        orderBy: [order] || undefined,
        where: whereElements || undefined,
      });

      const firstNextData: FileDto[] = [];
      const nextData: FileDto[] = [];

      if (!!cursor) {
        const nextResults = await this.filesService.files({
          take: parseInt(limit) || undefined,
          orderBy: [order] || undefined,
          skip: 1,
          cursor: {
            id: cursor,
          },
          where: whereElements || undefined,
        });

        if (nextResults.length > 0) {
          if (firstNextData.length === 0) {
            firstNextData.concat(firstResults, nextResults);
            await this.cacheManager.set('files', firstNextData, 0);
            return firstNextData;
          }

          if (nextData.length === 0) {
            nextData.concat(firstNextData, nextResults);
            await this.cacheManager.set('files', nextData, 0);
            return nextData;
          }

          nextData.concat(nextResults);
          await this.cacheManager.set('files', nextData, 0);
          return nextData;
        } else {
          return allContent;
        }
      }

      await this.cacheManager.set('files', firstResults, 0);
      return firstResults;
    }
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

    return this.filesService.uploadFile(file, userId, data);
  }

  @Patch(':userId')
  @UseGuards(new AuthGuard())
  @UseInterceptors(FilesPipe)
  updateProfilePhoto(
    @Param('userId') userId: string,
    @UploadedFile('file')
    file: Express.Multer.File,
  ) {
    return this.filesService.updateProfilePhoto(userId, file);
  }

  @Delete(':name')
  @UseGuards(new AuthGuard())
  async deleteFile(@Param('name') name: string): Promise<HttpException> {
    return await this.filesService.removeFile(name);
  }
}
