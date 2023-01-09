import {
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
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
import { allContent } from '../constants/allContent';

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
  ): Promise<unknown | FilesModel[] | NotFoundException> {
    const getCache = await this.cacheManager.get('files');

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

      let firstFiles = await this.filesService.getFiles({
        take: parseInt(limit) || undefined,
        orderBy: order || undefined,
        where: whereElements || undefined,
      });

      if (!!cursor) {
        const nextResults = await this.filesService.getFiles({
          take: parseInt(limit) || undefined,
          orderBy: order || undefined,
          skip: 1,
          cursor: {
            id: cursor,
          },
          where: whereElements || undefined,
        });

        const nextData = [];
        nextData.concat(...firstFiles, nextResults);
        firstFiles = null;
        await this.cacheManager.set('files', nextData, 0);

        return nextData;
      } else if (!!firstFiles) {
        await this.cacheManager.set('files', firstFiles, 0);

        return firstFiles;
      } else {
        return allContent;
      }
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadFile(file);
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
  ): Promise<FilesModel> {
    return this.filesService.removeFile(filename, name);
  }
}
