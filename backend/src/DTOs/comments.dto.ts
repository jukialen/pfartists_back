import { Role } from '@prisma/client';

export class FilesCommentsDto {
  id: string;
  fileId: string;
  authorId: string;
  comment: string;
  role: string;
  roleId: string;
  pseudonym: string;
  profilePhoto: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentsDto {
  commentId: string;
  postId: string;
  authorId: string;
  comment: string;
  role: Role;
  roleId: string;
  groupRole: Role;
  pseudonym: string;
  profilePhoto: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SubCommentsDto {
  subCommentId: string;
  commentId?: string;
  subComment: string;
  authorId: string;
  fileCommentId?: string;
  role: Role;
  roleId: string;
  groupRole?: Role;
  pseudonym: string;
  profilePhoto: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LastCommentsDto {
  lastCommentId: string;
  subCommentId: string;
  lastComment: string;
  authorId: string;
  role: Role;
  roleId: string;
  groupRole?: Role;
  pseudonym: string;
  profilePhoto: string;
  createdAt: Date;
  updatedAt: Date;
}
