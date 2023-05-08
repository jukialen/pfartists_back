import { Prisma, Role } from '@prisma/client';

export class GroupDto {
  groupId?: string;
  name?: string;
  description: string;
  logo: string | null;
  usersGroups?: {
    usersGroupsId: string;
    roleId?: string;
    roles?: {
      type: Role;
    }[];
  }[];
}

export class SortType {
  order: Prisma.GroupsOrderByWithRelationInput;
  whereElements?: Prisma.GroupsWhereInput;
}
