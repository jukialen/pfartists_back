import { Prisma, Tags } from '@prisma/client';

export class FileDto {
  name: string;
  profileType: boolean;
  tags: Tags;
}

export class FilesDto {
  fileId?: string;
  userId: string;
  name: string;
  tags: Tags;
  pseudonym: string;
  profilePhoto: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SortType {
  order: Prisma.FilesOrderByWithRelationInput;
  whereElements?: Prisma.FilesWhereInput;
}
