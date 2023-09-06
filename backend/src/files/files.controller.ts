import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
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
import { Plan, Prisma } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';

import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';

import { FilesService } from './files.service';

import { FilesPipe } from '../Pipes/FilesPipe';

import { allContent } from '../constants/allCustomsHttpMessages';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get('all')
  @UseGuards(new AuthGuard())
  async getFiles(@Query('queryData') queryData: string) {
    try {
      const { orderBy, limit, where, cursor } = JSON.parse(queryData);

      const firstResults = await this.filesService.findFiles({
        take: parseInt(limit),
        orderBy,
        where,
      });

      if (!!cursor) {
        const nextResults = await this.filesService.findFiles({
          take: parseInt(limit),
          orderBy,
          skip: 1,
          cursor: {
            fileId: cursor,
          },
          where,
        });

        if (nextResults.length > 0) {
          return nextResults;
        } else {
          return allContent;
        }
      }

      return firstResults;
    } catch (e) {
      console.error(e);
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
    @Body('data')
    data: Prisma.FilesUncheckedCreateInput & { groupId?: string; plan: Plan },
  ) {
    const userId = session?.getUserId();

    return this.filesService.uploadFile(
      { ...data, name: file.originalname },
      file,
      data.groupId,
      userId,
    );
  }

  @Patch(':oldName/:groupId')
  async newGroupLogo(
    @Param('oldName') oldName: string,
    @Param('groupId') groupId: string,
    @Body('data')
    data: Prisma.FilesUncheckedCreateInput & {
      file: Express.Multer.File;
      plan: Plan;
    },
  ) {
    return this.filesService.updateGroupLogo({
      ...data,
      name: data.file.originalname,
      oldName,
      groupId,
    });
  }

  @Delete(':name')
  @UseGuards(new AuthGuard())
  async deleteFile(@Param('name') name: string) {
    return await this.filesService.removeFile(name);
  }
}
