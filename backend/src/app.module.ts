import { CacheInterceptor, CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import type { RedisClientOptions } from 'redis';

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
import { LikedModule } from './liked/liked.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register<RedisClientOptions>({
      isGlobal: true,
      ttl: 3600 * 24,
    }),
    UsersModule,
    GroupsModule,
    FriendsModule,
    PrismaModule,
    FilesModule,
    AuthModule.forRoot({
      connectionURI: process.env.SUPERTOKENS_DOMAIN,
      apiKey: process.env.DASHBOARD_KEY,
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
    LikedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
