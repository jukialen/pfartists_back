import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotAcceptableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Tags } from '@prisma/client';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Cache } from 'cache-manager';

import { s3Client } from '../config/aws';
import { deleted } from '../constants/allCustomsHttpMessages';
import { parallelUploads3 } from '../helpers/files';
import { FilesDto } from '../DTOs/file.dto';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findFiles(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FilesWhereUniqueInput;
    where?: Prisma.FilesWhereInput;
    orderBy?: Prisma.FilesOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    const filesArray: FilesDto[] = [];
    const files = await this.prisma.files.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        users: {
          select: {
            pseudonym: true,
            profilePhoto: true,
          },
        },
      },
    });

    for (const file of files) {
      filesArray.push({
        fileId: file.fileId,
        userId: file.userId,
        name: file.name,
        pseudonym: file.users.pseudonym,
        tags: file.tags,
        profilePhoto: file.users.profilePhoto,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      });
    }

    return filesArray;
  }

  async findFile(where: Prisma.FilesWhereUniqueInput) {
    return this.prisma.files.findUnique({ where });
  }

  async findProfilePhoto(where: Prisma.FilesWhereInput) {
    return this.prisma.files.findFirst({ where, select: { fileId: true } });
  }

  async uploadFile(
    data: Prisma.FilesUncheckedCreateInput,
    userId: string,
    file: Express.Multer.File,
  ) {
    const name = file.originalname;

    const _file = await this.findFiles({
      where: { AND: [{ name }] },
    });

    if (_file.length > 0) {
      throw new NotAcceptableException('You have already uploaded the file.');
    } else if (
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

      parallelUploads.on('httpUploadProgress', async (progress) => {
        console.log(progress);
        console.log(`${(progress.loaded - progress.total) * 100}%`);

        const progressCount = (progress.loaded / progress.total) * 100;

        if (progressCount === 100) {
          await this.prisma.files.create({
            data: {
              name: file.originalname,
              userId,
              tags: data.tags,
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

  async updateProfilePhoto(
    fileId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    let progressEnd: number;

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

      parallelUploads.on('httpUploadProgress', async (progress) => {
        console.log(progress);
        console.log(`${(progress.loaded - progress.total) * 100}%`);

        const progressCount = (progress.loaded / progress.total) * 100;

        progressCount === 100 && (progressEnd = progressCount);
      });

      await parallelUploads.done();

      if (progressEnd === 100) {
        await this.prisma.users.update({
          where: { id: userId },
          data: { profilePhoto: file.originalname },
        });

        !!fileId
          ? await this.prisma.files.update({
              where: { fileId },
              data: { name: file.originalname },
            })
          : await this.prisma.files.create({
              data: {
                name: file.originalname,
                profileType: true,
                userId,
                tags: Tags.profile,
              },
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
