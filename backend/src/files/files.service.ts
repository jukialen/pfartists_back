import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Files } from '@prisma/client';
import { DeleteObjectCommand, PutObjectAclCommand } from '@aws-sdk/client-s3';
import { Cache } from 'cache-manager';

import { s3Client } from '../config/aws';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getFiles(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FilesWhereUniqueInput;
    where?: Prisma.FilesWhereInput;
    orderBy?: Prisma.FilesOrderByWithRelationInput[];
  }): Promise<Files[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.files.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async uploadFile(file: Express.Multer.File) {
    if (
      file.mimetype ===
      ('image/png' ||
        'image/jpg' ||
        'image/jpeg' ||
        'image/avif' ||
        'image/webp' ||
        'image/gif')
    ) {
      const awsData = await s3Client.send(
        new PutObjectAclCommand({
          Bucket: process.env.AMAZON_BUCKET,
          Key: file.originalname,
          // Body: file,
        }),
      );
    } else if (file.mimetype === ('video/webm' || 'video/mp4')) {
      // upload multipart
    }
  }

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    return this.prisma.users.update({
      data: file,
      where: {
        id: userId,
      },
    });
  }
  async removeFile(
    filename: string,
    where: Prisma.FilesWhereUniqueInput,
  ): Promise<Files> {
    try {
      await this.cacheManager.del('files');
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AMAZON_BUCKET,
          Key: filename,
        }),
      );
      return this.prisma.files.delete({ where });
    } catch (e) {
      console.error(e);
    }
  }
}
