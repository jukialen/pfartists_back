import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikedService {
  constructor(private prisma: PrismaService) {}

  async liked(userId: string, postId: string) {
    const like = await this.prisma.liked.findFirst({
      where: { AND: [{ postId }, { userId }] },
    });

    return !!like;
  }
}
