import { Prisma } from '@prisma/client';

export class UserDto {
  id?: string;
  username?: string;
  pseudonym: string;
  email?: string;
  description?: string;
  profilePhoto?: string;
  plan?: string;
}

export class MembersDto {
  usersGroupsId?: string;
  pseudonym: string;
  profilePhoto?: string;
}

export class SortType {
  order: Prisma.UsersOrderByWithRelationInput;
  whereElements?: Prisma.UsersWhereInput;
}
