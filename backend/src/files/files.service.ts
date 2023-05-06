import {
  CACHE_MANAGER,
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
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.files.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      select: { name: true, profileType: true, tags: true },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    data: Prisma.FilesUncheckedCreateInput,
  ): Promise<
    | { statusCode: number; message: string }
    | NotAcceptableException
    | UnsupportedMediaTypeException
  > {
    const name = file.originalname;

    const _file = await this.files({
      where: { AND: [{ name }] },
    });

    if (_file.length > 0) {
      throw new NotAcceptableException('You have already uploaded the file.');
    }

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

        if (progressCount === 100) {
          const file = await this.prisma.files.create({
            data: { name, tags: data.tags },
          });

          await this.prisma.usersFiles.create({
            data: {
              userId,
              fileId: file.id,
            },
          });
        }
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

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    const _file = await this.prisma.files.findFirst({
      where: {
        AND: [
          { name: user.profilePhoto },
          { profileType: true },
          { usersFiles: { some: { userId } } },
        ],
      },
      select: { id: true },
    });

    let progressEnd: number;

    const progressUpload = async () => {
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
    };

    const goodReturn = {
      statusCode: 200,
      message: 'Profile photo was updated.',
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
      if (!!_file) {
        await progressUpload();

        if (progressEnd === 100) {
          await this.prisma.users.update({
            where: { id: userId },
            data: { profilePhoto: file.originalname },
          });

          await this.prisma.files.update({
            where: { id: _file.id },
            data: { name: file.originalname },
          });
        }

        return goodReturn;
      } else {
        await progressUpload();

        if (progressEnd === 100) {
          await this.prisma.users.update({
            where: { id: userId },
            data: { profilePhoto: file.originalname },
          });

          const newFile = await this.prisma.files.create({
            data: {
              name: file.originalname,
              tags: 'profile',
              profileType: true,
            },
            select: {
              id: true,
            },
          });

          //doing migration for tags
          await this.prisma.usersFiles.create({
            data: { userId, fileId: newFile.id },
          });
          return goodReturn;
        }
      }
    } else {
      throw new UnsupportedMediaTypeException(
        `${file.mimetype} isn't supported.`,
      );
    }
  }
  async removeFile(name: string) {
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
