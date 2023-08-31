import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cache } from 'cache-manager';
import { Prisma, Role } from '@prisma/client';

import { PostsDto } from '../DTOs/posts.dto';

import { LikedService } from '../liked/liked.service';
import { CommentsService } from '../comments/comments.service';
import { RolesService } from '../roles/rolesService';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private commentsService: CommentsService,
    private likedService: LikedService,
    private rolesService: RolesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findPost(postId: string) {
    return this.prisma.posts.findUnique({ where: { postId } });
  }

  async findAllPosts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostsWhereUniqueInput;
    where?: Prisma.PostsWhereInput;
    orderBy?: Prisma.PostsOrderByWithRelationInput;
    userId: string;
  }) {
    const { skip, take, cursor, where, orderBy, userId } = params;

    const relationsArray: PostsDto[] = [];
    const rels = await this.prisma.posts.findMany({
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

    for (const rel of rels) {
      relationsArray.push({
        title: rel.title,
        content: rel.content,
        pseudonym: rel.users.pseudonym,
        profilePhoto: rel.users.profilePhoto,
        likes: rel.likes,
        liked: await this.likedService.liked(userId, rel.postId),
        shared: rel.shared,
        commented: rel.commented,
        groupId: rel.groupId,
        authorId: rel.authorId,
        postId: rel.postId,
        roleId: rel.roleId,
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt,
      });
    }

    return relationsArray;
  }

  async createPost(data: Prisma.PostsUncheckedCreateInput) {
    const { postId } = await this.prisma.posts.create({
      data,
      select: { postId: true },
    });

    const role = await this.rolesService.addRole({
      groupId: data.groupId,
      postId,
      role: Role.AUTHOR,
      userId: data.authorId,
    });

    return this.updatePost({ roleId: role.id }, { postId });
  }

  async updatePost(
    data: Prisma.PostsUncheckedUpdateInput,
    where: Prisma.PostsWhereUniqueInput,
  ) {
    if (!!data.roleId) {
      throw new ForbiddenException('You cannot change role for the post.');
    }

    if (!!data.title || !!data.content || !!(data.title && data.content)) {
      const role = await this.rolesService.isAuthor(where.roleId.toString());

      if (role) {
        return this.prisma.posts.update({ data, where });
      } else {
        throw new UnauthorizedException("You're not author.");
      }
    } else {
      return this.prisma.posts.update({ data, where });
    }
  }

  async deletePosts(groupId: string) {
    await this.cacheManager.del('posts');

    const posts = await this.prisma.posts.findMany({ where: { groupId } });

    for (const _p of posts) {
      await this.commentsService.deleteComments(_p.postId);
    }
    return this.prisma.posts.deleteMany({ where: { groupId } });
  }

  async deletePost(
    where: Prisma.PostsWhereUniqueInput,
    groupId: string,
    userId: string,
  ) {
    const role = await this.rolesService.canDeletePost(
      groupId,
      userId,
      where.postId,
    );

    if (role) {
      await this.cacheManager.del('posts-one');

      const posts = await this.prisma.posts.findMany({ where });

      for (const _p of posts) {
        await this.commentsService.deleteComments(_p.postId);
      }

      return this.prisma.posts.delete({ where });
    } else {
      throw new UnauthorizedException(
        'You are neither author, admin nor moderator.',
      );
    }
  }
}
