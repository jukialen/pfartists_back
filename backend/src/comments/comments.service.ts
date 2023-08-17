import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CommentsDto } from '../DTOs/comments.dto';

import { RolesService } from '../roles/rolesService';
import { SubCommentsService } from '../sub-comments/sub-comments-service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private subCommentsService: SubCommentsService,
    private rolesService: RolesService,
  ) {}

  async findAllComments(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CommentsWhereUniqueInput;
    where?: Prisma.CommentsWhereInput;
    orderBy?: Prisma.CommentsOrderByWithRelationInput;
  }) {
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
      const {
        commentId,
        postId,
        authorId,
        comment,
        users,
        roleId,
        adModRoleId,
        createdAt,
        updatedAt,
      } = _com;
      const { role } = await this.rolesService.getRole(_com.roleId);

      const { role: groupRole } = await this.rolesService.getRole(
        _com.adModRoleId,
      );

      comments.push({
        commentId,
        postId,
        authorId,
        comment,
        pseudonym: users.pseudonym,
        profilePhoto: users.profilePhoto,
        role,
        roleId,
        adModRoleId,
        groupRole,
        createdAt,
        updatedAt,
      });
    }

    return comments;
  }

  async addComment(data: Prisma.CommentsUncheckedCreateInput) {
    const { id, groupId } = await this.rolesService.getPostRoleId(
      Role.AUTHOR,
      data.postId,
    );

    const adModRoleId = await this.rolesService.getGroupRoleId(
      groupId,
      data.authorId,
    );

    return this.prisma.comments.create({
      data: { ...data, roleId: id, adModRoleId: adModRoleId.id },
    });
  }

  async deleteComment(commentId: string, roleId: string, groupRole: Role) {
    const role = await this.rolesService.deleteAuthorPostAndComment(roleId);

    if (role || groupRole === Role.ADMIN || Role.MODERATOR) {
      await this.subCommentsService.deleteSubComments({ commentId });

      return this.prisma.comments.delete({ where: { commentId } });
    } else {
      throw new UnauthorizedException(
        'You are neither author, admin nor moderator.',
      );
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
