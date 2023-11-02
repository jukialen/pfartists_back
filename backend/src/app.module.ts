import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { FriendsModule } from './friends/friends.module';
import { PrismaModule } from './prisma/prisma.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { UsersGroupsModule } from './users-groups/users-groups.module';
import { PostsModule } from './posts/posts.module';
import { LikedModule } from './liked/liked.module';
import { CommentsModule } from './comments/comments.module';
import { SubCommentsModule } from './sub-comments/sub-comments.module';
import { LastCommentsModule } from './last-comments/last-comments.module';
import { FilesCommentsModule } from './files-comments/files-comments.module';
import { ProgressBarModule } from './progress-bar/progress-bar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    GroupsModule,
    FriendsModule,
    PrismaModule,
    FilesModule,
    AuthModule.forRoot({
      connectionURI: process.env.SUPERTOKENS_DOMAIN,
      appInfo: {
        appName: process.env.APP_NAME,
        apiDomain: process.env.API_DOMAIN,
        websiteDomain: process.env.WEB_DOMAIN,
        apiBasePath: '/auth',
        websiteBasePath: '',
      },
    }),
    RolesModule,
    UsersGroupsModule,
    PostsModule,
    LikedModule,
    CommentsModule,
    SubCommentsModule,
    LastCommentsModule,
    FilesCommentsModule,
    ProgressBarModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
