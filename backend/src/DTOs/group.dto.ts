import { Prisma } from '@prisma/client';

export class GroupDto {
  name: string;
  description: string;
  logo: string | null;
}

export class SortType {
  order: Prisma.GroupsOrderByWithRelationInput;
  whereElements?: Prisma.GroupsWhereInput;
}
