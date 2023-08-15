import { Prisma, Role } from '@prisma/client';

export class GroupDto {
  groupId?: string;
  name?: string;
  description: string;
  regulation?: string;
  logo?: string;
  usersGroupsId: string;
}

export class SortType {
  order: Prisma.GroupsOrderByWithRelationInput;
  whereElements?: Prisma.GroupsWhereInput;
}
