import { Prisma } from '@prisma/client';

export class UserDto {
  username?: string;
  pseudonym: string;
  email?: string;
  description?: string;
  profilePhoto?: string;
  plan?: string;
}

export class SortType {
  order: Prisma.UsersOrderByWithRelationInput;
  whereElements?: Prisma.UsersWhereInput;
}
