import {
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Files as FilesModel } from '.prisma/client';

import { FileTypePipe } from '../Pipes/FilesPipe';
import { FilesService } from './files.service';
import { stringToJsonForGet } from '../utilities/convertValues';
import { Cache } from 'cache-manager';
import { allContent } from '../constants/allCustomsHttpMessages';
import { FileDto } from '../DTOs/file.dto';
import { Prisma } from '@prisma/client';

@Controller('files')
export class FilesController {
  constructor(
    private filesService: FilesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async getFiles(
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('where') where?: string,
    @Query('cursor') cursor?: string,
  ): Promise<FileDto[] | { message: string; statusCode: HttpStatus }> {
    const getCache: FileDto[] = await this.cacheManager.get('files');

    if (!!getCache) {
      return getCache;
    } else {
      let order;

      if (typeof orderBy === 'string') {
        try {
          const { orderArray } = await stringToJsonForGet(orderBy);
          order = orderArray;
        } catch (e) {
          console.error(e);
        }
      }

      let whereElements;

      if (typeof where === 'string') {
        try {
          const { whereObj } = await stringToJsonForGet(where);
          whereElements = whereObj;
        } catch (e) {
          console.error(e);
        }
      }

      const firstResults = await this.filesService.files({
        take: parseInt(limit) || undefined,
        orderBy: order || undefined,
        where: whereElements || undefined,
      });

      const firstNextData: FileDto[] = [];
      const nextData: FileDto[] = [];

      if (!!cursor) {
        const nextResults = await this.filesService.files({
          take: parseInt(limit) || undefined,
          orderBy: order || undefined,
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
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    data: Prisma.FilesUncheckedCreateInput,
  ) {
    return this.filesService.uploadFile(file, data);
  }

  @Patch()
  @UseInterceptors(FileInterceptor('file'))
  updateProfilePhoto(
    @Param('userId') userId: string,
    @UploadedFile('file', FileTypePipe)
    file: Express.Multer.File,
  ) {
    return this.filesService.updateProfilePhoto(userId, file);
  }

  @Delete(':name')
  async deleteFile(
    @Param('filename') filename: string,
    @Param('name') name: FilesModel,
  ): Promise<HttpException> {
    return await this.filesService.removeFile(filename, name);
  }
}
