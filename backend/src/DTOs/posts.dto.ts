import { Prisma } from '@prisma/client';

export class PostsDto {
  title: string;
  content: string;
  pseudonym: string;
  profilePhoto: string;
  likes: number;
  liked: boolean;
  shared: number;
  commented: number;
  groupId: string;
  authorId: string;
  postId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SortType {
  order: Prisma.PostsOrderByWithRelationInput;
  whereElements?: Prisma.PostsWhereInput;
}
