import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { SubCommentsDto } from '../DTOs/comments.dto';
import { RolesService } from '../roles/rolesService';
import { LastCommentsService } from '../last-comments/last-comments-service';

@Injectable()
export class SubCommentsService {
  constructor(
    private prisma: PrismaService,
    private lastCommentsService: LastCommentsService,
    private rolesService: RolesService,
  ) {}

  async findAllSubComments(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SubCommentsWhereUniqueInput;
    where?: Prisma.SubCommentsWhereInput;
    orderBy?: Prisma.SubCommentsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    const comments: SubCommentsDto[] = [];

    const _comments = await this.prisma.subComments.findMany({
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

      comments.push({
        subCommentId: _com.subCommentId,
        commentId: _com.commentId,
        authorId: _com.authorId,
        subComment: _com.subComment,
        role,
        roleId: _com.roleId,
        fileCommentId: _com.fileCommentId,
        pseudonym: _com.users.pseudonym,
        profilePhoto: _com.users.profilePhoto,
        createdAt: _com.createdAt,
        updatedAt: _com.updatedAt,
      });
    }

    return comments;
  }

  async addSubComment(data: Prisma.SubCommentsCreateInput) {
    return this.prisma.subComments.create({ data });
  }

  async deleteSubComment(subCommentId: string, roleId: string) {
    const role = await this.rolesService.deletePostAndComment(roleId);

    if (role) {
      await this.lastCommentsService.deleteAllLastComments(subCommentId);

      return this.prisma.subComments.delete({ where: { subCommentId } });
    } else {
      throw new UnauthorizedException("You aren't author.");
    }
  }

  async deleteSubComments(id: { commentId?: string; fileCommentId?: string }) {
    const subComments = await this.findAllSubComments({
      where: {
        OR: [{ commentId: id.commentId }, { fileCommentId: id.fileCommentId }],
      },
    });

    for (const _suC of subComments) {
      await this.lastCommentsService.deleteAllLastComments(_suC.subCommentId);
    }

    return this.prisma.subComments.deleteMany({
      where: {
        OR: [{ commentId: id.commentId }, { fileCommentId: id.fileCommentId }],
      },
    });
  }
}
