import { Prisma } from '@prisma/client';

export class FriendDto {
  id: string;
  usernameId: string;
  favorite: boolean;
  pseudonym: string;
  profilePhoto: string;
  createdAt: Date;
  updatedAt: Date;
}
