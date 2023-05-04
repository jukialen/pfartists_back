import { Prisma } from '@prisma/client';

export class FileDto {
  name: string;
  ownerFile: string;
}
export class SortType {
  order: Prisma.FilesOrderByWithRelationInput;
  whereElements?: Prisma.FilesWhereInput;
}
