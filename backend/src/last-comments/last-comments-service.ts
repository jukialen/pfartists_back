import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { LastCommentsDto } from '../DTOs/comments.dto';
import { RolesService } from '../roles/rolesService';

@Injectable()
export class LastCommentsService {
  constructor(
    private prisma: PrismaService,
    private rolesService: RolesService,
  ) {}

  async findAllLastComments(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.LastCommentsWhereUniqueInput;
    where?: Prisma.LastCommentsWhereInput;
    orderBy?: Prisma.LastCommentsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    const comments: LastCommentsDto[] = [];

    const _comments = await this.prisma.lastComments.findMany({
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
        lastCommentId: _com.lastCommentId,
        subCommentId: _com.subCommentId,
        lastComment: _com.lastComment,
        authorId: _com.authorId,
        role,
        roleId: _com.roleId,
        pseudonym: _com.users.pseudonym,
        profilePhoto: _com.users.profilePhoto,
        createdAt: _com.createdAt,
        updatedAt: _com.updatedAt,
      });
    }

    return comments;
  }

  async addLastComment(data: Prisma.LastCommentsUncheckedCreateInput) {
    return this.prisma.lastComments.create({ data });
  }

  async deleteLastComment(lastCommentId: string, roleId: string) {
    const role = await this.rolesService.deletePostAndComment(roleId);

    if (role) {
      return this.prisma.lastComments.delete({ where: { lastCommentId } });
    } else {
      throw new UnauthorizedException("You aren't author.");
    }
  }

  async deleteAllLastComments(subCommentId: string) {
    return this.prisma.lastComments.deleteMany({ where: { subCommentId } });
  }
}
