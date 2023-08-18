import { Prisma, Tags } from '@prisma/client';

export class FilesDto {
  fileId?: string;
  authorId: string;
  name: string;
  shortDescription: string;
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
