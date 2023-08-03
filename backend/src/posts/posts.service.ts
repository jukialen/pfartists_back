import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findPost(postId: string) {
    return this.prisma.posts.findUnique({ where: { postId } });
  }

  async createPost(data: Prisma.PostsCreateInput) {
    return this.prisma.posts.create({ data });
  }

  async updatePost(
    data: Prisma.PostsUpdateInput,
    where: Prisma.PostsWhereUniqueInput,
  ) {
    return this.prisma.posts.update({ data, where });
  }

  async deletePost(where: Prisma.PostsWhereUniqueInput) {
    await this.cacheManager.del('groups-posts');
    await this.cacheManager.del('groups-posts-one');

    return this.prisma.posts.delete({ where });
  }

  async deleteAllPosts(where: Prisma.PostsWhereUniqueInput) {
    return this.prisma.posts.deleteMany({ where });
  }
}
