import { Prisma, Tags } from '@prisma/client';

export class FileDto {
  name: string;
  profileType: boolean;
  tags: Tags;
}
export class SortType {
  order: Prisma.FilesOrderByWithRelationInput;
  whereElements?: Prisma.FilesWhereInput;
}
