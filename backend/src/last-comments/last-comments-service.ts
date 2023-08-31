import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { LastCommentsDto } from '../DTOs/comments.dto';

import { PrismaService } from '../prisma/prisma.service';
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
      const groupRole = await this.rolesService.getRole(_com.adModRoleId);
      const { role } = await this.rolesService.getRole(_com.roleId);

      comments.push({
        lastCommentId: _com.lastCommentId,
        subCommentId: _com.subCommentId,
        lastComment: _com.lastComment,
        authorId: _com.authorId,
        pseudonym: _com.users.pseudonym,
        profilePhoto: _com.users.profilePhoto,
        role,
        roleId: _com.roleId,
        groupRole: _com.adModRoleId !== null ? groupRole.role : null,
        createdAt: _com.createdAt,
        updatedAt: _com.updatedAt,
      });
    }

    return comments;
  }

  async addLastComment(data: Prisma.LastCommentsUncheckedCreateInput) {
    return this.prisma.lastComments.create({ data });
  }

  async deleteLastComment(
    lastCommentId: string,
    roleId: string,
    groupRole?: Role | null,
  ) {
    const role = await this.rolesService.deleteAuthorPostAndComment(roleId);

    if (role || groupRole === Role.ADMIN || Role.MODERATOR) {
      return this.prisma.lastComments.delete({ where: { lastCommentId } });
    } else {
      throw new UnauthorizedException(
        'You are neither author, admin nor moderator.',
      );
    }
  }

  async deleteAllLastComments(subCommentId: string) {
    return this.prisma.lastComments.deleteMany({ where: { subCommentId } });
  }
}
