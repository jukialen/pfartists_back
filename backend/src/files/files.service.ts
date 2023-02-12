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
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Cache } from 'cache-manager';
import { Upload } from '@aws-sdk/lib-storage';

import { s3Client } from '../config/aws';
import { deleted } from '../constants/allCustomsHttpMessages';
import { FileDto } from '../DTOs/file.dto';

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
  ): Promise<string | NotAcceptableException | UnsupportedMediaTypeException> {
    try {
      const { ownerFile, profileType } = data;
      const _file = await this.files({
        where: {
          AND: [{ ownerFile }, { name: file.originalname }],
        },
      });

      const uploadToDB = async (): Promise<string> => {
        await this.prisma.files.create({
          data: { name: file.originalname, ownerFile, profileType },
        });

        return 'File was uploaded.';
      };

      _file.length > 0 &&
        new NotAcceptableException('You have already uploaded the file.');

      if (
        file.mimetype === 'image/png' ||
        'image/jpg' ||
        'image/jpeg' ||
        'image/avif' ||
        'image/webp' ||
        'image/gif'
      ) {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.AMAZON_BUCKET,
            Key: file.originalname,
            Body: file.buffer,
          }),
        );

        return await uploadToDB();
      }

      if (file.mimetype === 'video/webm' || 'video/mp4') {
        const parallelUploads3 = new Upload({
          client: s3Client,
          params: {
            Bucket: process.env.AMAZON_BUCKET,
            Key: file.originalname,
            Body: file.buffer,
          },
        });

        parallelUploads3.on('httpUploadProgress', (progress) => {
          console.log(progress);
        });

        return await uploadToDB();
      }

      throw new UnsupportedMediaTypeException(
        `${file.mimetype} isn't supported.`,
      );
    } catch (e) {
      console.error(e);
    }
  }

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    try {
      const _file = await this.files({
        where: {
          AND: [{ ownerFile: userId }, { name: file.originalname }],
        },
      });

      _file.length > 0 &&
        new NotAcceptableException('You have already uploaded the file.');

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AMAZON_BUCKET,
          Key: file.originalname,
          Body: file.buffer,
        }),
      );

      return this.prisma.users.update({
        data: { profilePhoto: file.originalname },
        where: { id: userId },
      });
    } catch (e) {
      console.error(e);
    }
  }
  async removeFile(
    filename: string,
    where: Prisma.FilesWhereUniqueInput,
  ): Promise<HttpException> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AMAZON_BUCKET,
          Key: filename,
        }),
      );
      await this.prisma.files.delete({ where });
      await this.cacheManager.del('files');
      return deleted(where.name);
    } catch (e) {
      console.error(e);
    }
  }
}
