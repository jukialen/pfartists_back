import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'oracle',
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE__PASSWORD,
      database: process.env.DATABASE__NAME,
      connectString: process.env.DATABASE__TNS,
      entities: [],
      autoLoadEntities: true,
      verboseRetryLog: true
    }),
    UsersModule,
    GroupsModule,
    FriendsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
