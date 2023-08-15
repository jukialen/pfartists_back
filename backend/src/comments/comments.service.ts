import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CommentsDto } from '../DTOs/comments.dto';
import { RolesService } from '../roles/rolesService';
import { SubCommentsService } from '../sub-comments/sub-comments-service';
import { PostsService } from '../posts/posts.service';
import { UsersGroupsService } from '../users-groups/users-groups.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private subCommentsService: SubCommentsService,
    private postsService: PostsService,
    private usersGroupsService: UsersGroupsService,
    private rolesService: RolesService,
  ) {}

  async findAllComments(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.CommentsWhereUniqueInput;
      where?: Prisma.CommentsWhereInput;
      orderBy?: Prisma.CommentsOrderByWithRelationInput;
    },
    groupId: string,
  ) {
    const { skip, take, cursor, where, orderBy } = params;

    const comments: CommentsDto[] = [];

    const _comments = await this.prisma.comments.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        users: {
          select: {
            pseudonym: true,
            profilePhoto: true,
          },
        },
      },
    });

    for (const _com of _comments) {
      const { role } = await this.rolesService.getRole(_com.roleId);

      const { roleId, userId } = await this.usersGroupsService.findRoleIdUser(
        groupId,
        _com.authorId,
      );

      const { role: adModRole } = await this.rolesService.getRole(roleId);

      const groupRole: Role =
        adModRole === Role.ADMIN || Role.MODERATOR
          ? adModRole
          : userId === _com.authorId
          ? Role.AUTHOR
          : Role.USER;

      comments.push({
        commentId: _com.commentId,
        postId: _com.postId,
        authorId: _com.authorId,
        comment: _com.comment,
        role,
        roleId: _com.roleId,
        groupRole,
        pseudonym: _com.users.pseudonym,
        profilePhoto: _com.users.profilePhoto,
        createdAt: _com.createdAt,
        updatedAt: _com.updatedAt,
      });
    }

    return comments;
  }

  async addComment(data: Prisma.CommentsUncheckedCreateInput) {
    const { authorId, groupId } = await this.postsService.findPost(data.postId);

    const { id } = await this.rolesService.addRole({
      userId: data.authorId,
      groupId,
      postId: data.postId,
      role: authorId === data.authorId ? Role.AUTHOR : Role.USER,
    });

    return this.prisma.comments.create({ data: { ...data, roleId: id } });
  }

  async deleteComment(commentId: string, roleId: string) {
    const role = await this.rolesService.deletePostAndComment(roleId);

    if (role) {
      await this.subCommentsService.deleteSubComments({ commentId });

      return this.prisma.comments.delete({ where: { commentId } });
    } else {
      throw new UnauthorizedException("You aren't author.");
    }
  }

  async deleteComments(postId: string) {
    const comments = await this.prisma.comments.findMany({
      where: { postId },
      select: { commentId: true },
    });

    for (const _c of comments) {
      await this.subCommentsService.deleteSubComments({
        commentId: _c.commentId,
      });
    }
    return this.prisma.comments.deleteMany({ where: { postId } });
  }
}
