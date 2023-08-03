import { Prisma } from '@prisma/client';

export class UsersGroupsDto {
  groups: {
    name: string;
    logo?: string;
  };
}

export class SortType {
  order: Prisma.UsersGroupsOrderByWithRelationInput;
}
