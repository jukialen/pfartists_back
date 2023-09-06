import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan, Prisma, Tags } from '@prisma/client';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Cache } from 'cache-manager';

import { s3Client } from '../config/aws';
import { deleted } from '../constants/allCustomsHttpMessages';
import { parallelUploads3 } from '../helpers/files';
import { FilesDto } from '../DTOs/file.dto';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService, // @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
        authorId: file.authorId,
        name: file.name,
        pseudonym: file.users.pseudonym,
        tags: file.tags,
        shortDescription: file.shortDescription,
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

  async findAuthorFile(fileId: string) {
    return this.prisma.files.findUnique({
      where: { fileId },
      select: { authorId: true },
    });
  }

  async findProfilePhoto(where: Prisma.FilesWhereInput) {
    return this.prisma.files.findFirst({
      where,
      select: { fileId: true, shortDescription: true, name: true },
    });
  }

  async uploadFile(
    data: Prisma.FilesUncheckedCreateInput & { plan: Plan },
    file: Express.Multer.File,
    groupId?: string,
    authorId?: string,
  ) {
    const { name, shortDescription, tags, plan } = data;

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
      const upload = async (imageSize: number, videoSize: number) => {
        if (
          ((file.mimetype === 'image/png' ||
            'image/jpg' ||
            'image/jpeg' ||
            'image/avif' ||
            'image/webp' ||
            'image/gif') &&
            file.size < imageSize) ||
          ((file.mimetype === 'video/webm' || 'video/mp4') &&
            file.size < videoSize)
        ) {
          const parallelUploads = parallelUploads3(
            s3Client,
            process.env.AMAZON_BUCKET,
            file,
          );

          let progressCount: number;
          parallelUploads.on('httpUploadProgress', async (progress) => {
            console.log(progress);
            progressCount = (progress.loaded / progress.total) * 100;
            console.log(progressCount);

            // this.progressBar.emitProps(authorId, progressCount);
            if (progressCount === 100) {
              await this.prisma.files.create({
                data: {
                  name,
                  authorId,
                  groupId,
                  shortDescription,
                  tags,
                },
              });
            }
          });

          await parallelUploads.done();
          return progressCount;
          // return {
          //   statusCode: 200,
          //   message: 'File was uploaded',
          // };
          //  } else {
          //   throw new UnsupportedMediaTypeException(
          //     `${file.mimetype} isn't supported.`,
          //   );
          // }
        } else {
          throw new Error('too big file for your plan');
        }
      };
      switch (plan) {
        case 'FREE':
          return upload(1000000, 15000000);
        case 'PREMIUM':
          return upload(3000000, 50000000);
        case 'GOLD':
          return upload(5000000, 200000000);
        default:
          throw new Error('unknown error');
      }
    }
  }

  async updateProfilePhoto(
    file: Express.Multer.File,
    authorId: string,
    oldName: string,
    plan: Plan,
    shortDescription?: string,
  ) {
    await this.removeFile(oldName);
    return this.uploadFile(
      {
        name: file.originalname,
        profileType: true,
        tags: Tags.profile,
        authorId,
        shortDescription,
        plan,
      },
      file,
      null,
      authorId,
    );
  }

  async updateGroupLogo(
    data: Prisma.FilesUncheckedCreateInput & {
      file: Express.Multer.File;
      oldName: string;
      groupId: string;
      name: string;
      plan: Plan;
      // clientId: string;
    },
  ) {
    await this.removeFile(data.oldName);

    return this.uploadFile(
      { ...data, name: data.file.originalname, plan: data.plan },
      data.file,
      data.groupId,
      null,
    );
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
      // await this.cacheManager.del('files');
      return deleted(name);
    } catch (e) {
      console.error(e);
    }
  }
}
