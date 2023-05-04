import { Prisma } from '@prisma/client';

export class FriendDto {
  id: string;
  usernameId: string;
  friendId: string;
  favorite: boolean;
}

export class SortType {
  order: Prisma.FriendsOrderByWithRelationInput;
  whereElements?: Prisma.FriendsWhereInput;
}
