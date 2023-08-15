import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { FilesCommentsDto } from '../DTOs/comments.dto';
import { FilesService } from '../files/files.service';
import { RolesService } from '../roles/rolesService';
import { SubCommentsService } from '../sub-comments/sub-comments-service';

@Injectable()
export class FilesCommentsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private subCommentsService: SubCommentsService,
    private rolesService: RolesService,
  ) {}

  async findAllComments(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FilesCommentsWhereUniqueInput;
    where?: Prisma.FilesCommentsWhereInput;
    orderBy?: Prisma.FilesCommentsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    const filesComments: FilesCommentsDto[] = [];

    const _filesComments = await this.prisma.filesComments.findMany({
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
        files: {
          select: {
            authorId: true,
          },
        },
      },
    });

    for (const _file of _filesComments) {
      const { role } = await this.rolesService.getRole(_file.roleId);

      filesComments.push({
        id: _file.id,
        fileId: _file.fileId,
        authorId: _file.authorId,
        comment: _file.comment,
        role,
        roleId: _file.roleId,
        pseudonym: _file.users.pseudonym,
        profilePhoto: _file.users.profilePhoto,
        createdAt: _file.createdAt,
        updatedAt: _file.updatedAt,
      });
    }

    return filesComments;
  }

  async addComment(
    data: Prisma.FilesCommentsUncheckedCreateInput,
    userId: string,
  ) {
    const { authorId } = await this.filesService.findAuthorFile(data.fileId);
    const { id } = await this.rolesService.addRole({
      fileId: data.fileId,
      userId,
      role: userId === authorId ? Role.AUTHOR : Role.USER,
    });

    return this.prisma.filesComments.create({
      data: { ...data, roleId: id },
    });
  }

  async removeComment(id: string, roleId: string) {
    const role = await this.rolesService.deletePostAndComment(roleId);

    if (role) {
      const file = await this.findAllComments({ where: { id } });

      for (const _f of file) {
        await this.subCommentsService.deleteSubComments({
          fileCommentId: _f.fileId,
        });
      }
      return this.prisma.filesComments.delete({ where: { id } });
    } else {
      throw new UnauthorizedException("You aren't author.");
    }
  }
}
