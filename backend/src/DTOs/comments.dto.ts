import { Prisma } from '@prisma/client';

export class SortCommentsType {
  order: Prisma.CommentsOrderByWithRelationInput;
  whereElements?: Prisma.CommentsWhereInput;
}

export class SortSubCommentsType {
  order: Prisma.SubCommentsOrderByWithRelationInput;
  whereElements?: Prisma.SubCommentsWhereInput;
}

export class SortLastCommentsType {
  order: Prisma.LastCommentsOrderByWithRelationInput;
  whereElements?: Prisma.LastCommentsWhereInput;
}
