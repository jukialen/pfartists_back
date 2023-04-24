import {
  CACHE_MANAGER,
  HttpException,
  Inject,
  Injectable,
  NotAcceptableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Cache } from 'cache-manager';

import { s3Client } from '../config/aws';
import { deleted } from '../constants/allCustomsHttpMessages';
import { FileDto } from '../DTOs/file.dto';
import { parallelUploads3 } from '../helpers/files';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async files(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FilesWhereUniqueInput;
    where?: Prisma.FilesWhereInput;
    orderBy?: Prisma.FilesOrderByWithRelationInput[];
  }): Promise<FileDto[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const filesArray: FileDto[] = [];

    const _files = await this.prisma.files.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });

    for (const _f of _files) {
      filesArray.push({
        name: _f.name,
        ownerFile: _f.ownerFile,
      });
    }

    return filesArray;
  }

  async uploadFile(
    file: Express.Multer.File,
    data: Prisma.FilesUncheckedCreateInput,
  ): Promise<
    | { statusCode: number; message: string }
    | NotAcceptableException
    | UnsupportedMediaTypeException
  > {
    const { ownerFile, profileType, tags } = data;
    const _file = await this.files({
      where: {
        AND: [{ ownerFile }, { name: file.originalname }],
      },
    });

    if (_file.length > 0) {
      throw new NotAcceptableException('You have already uploaded the file.');
    }

    const name = file.originalname;
    const filesData: Prisma.FilesUncheckedCreateInput = {
      name,
      ownerFile,
      profileType,
      tags,
    };

    if (
      file.mimetype === 'video/webm' ||
      'video/mp4' ||
      'image/png' ||
      'image/jpg' ||
      'image/jpeg' ||
      'image/avif' ||
      'image/webp' ||
      'image/gif'
    ) {
      const parallelUploads = await parallelUploads3(
        s3Client,
        process.env.AMAZON_BUCKET,
        file,
      );

      await parallelUploads.on('httpUploadProgress', async (progress) => {
        console.log(progress);
        console.log(`${(progress.loaded - progress.total) * 100}%`);

        const progressCount = (progress.loaded / progress.total) * 100;

        progressCount === 100 &&
          (await this.prisma.files.create({ data: filesData }));
      });

      await parallelUploads.done();
      return {
        statusCode: 200,
        message: 'File was uploaded',
      };
    } else {
      throw new UnsupportedMediaTypeException(
        `${file.mimetype} isn't supported.`,
      );
    }
  }

  async updateProfilePhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ statusCode: number; message: string }> {
    const _file = await this.files({
      where: {
        AND: [{ ownerFile: userId }, { name: file.originalname }],
      },
    });

    _file.length > 0 &&
      new NotAcceptableException('You have already uploaded the file.');

    if (
      file.mimetype === 'video/webm' ||
      'video/mp4' ||
      'image/png' ||
      'image/jpg' ||
      'image/jpeg' ||
      'image/avif' ||
      'image/webp' ||
      'image/gif'
    ) {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });

      let progressEnd: number;
      const parallelUploads = await parallelUploads3(
        s3Client,
        process.env.AMAZON_BUCKET,
        file,
      );

      parallelUploads.on('httpUploadProgress', async (progress) => {
        console.log(progress);
        console.log(`${(progress.loaded - progress.total) * 100}%`);

        const progressCount = (progress.loaded / progress.total) * 100;

        progressCount === 100 && (progressEnd = progressCount);
      });

      await parallelUploads.done();

      if (progressEnd === 100 && !!user) {
        await this.prisma.files.delete({
          where: { name: user.profilePhoto, ownerFile: userId },
        });

        await this.prisma.users.update({
          data: { profilePhoto: file.originalname },
          where: { id: userId },
        });
      }
      return {
        statusCode: 200,
        message: 'Profile photo was updated.',
      };
    } else {
      throw new UnsupportedMediaTypeException(
        `${file.mimetype} isn't supported.`,
      );
    }
  }
  async removeFile(name: string): Promise<HttpException> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AMAZON_BUCKET,
          Key: name,
        }),
      );
      await this.prisma.files.delete({ where: { name } });
      await this.cacheManager.del('files');
      return deleted(name);
    } catch (e) {
      console.error(e);
    }
  }
}
