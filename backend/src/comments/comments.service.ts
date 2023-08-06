import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findAllComments(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CommentsWhereUniqueInput;
    where?: Prisma.CommentsWhereInput;
    orderBy?: Prisma.CommentsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.comments.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async addComment(data: Prisma.CommentsCreateInput) {
    return this.prisma.comments.create({ data });
  }

  async removeComment(commentId: string) {
    return this.prisma.comments.delete({ where: { commentId } });
  }
}
