import {
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnsupportedMediaTypeException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { FilesService } from '../files/files.service';
import { Session } from '../auth/session.decorator';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { Plan, Prisma } from '@prisma/client';
import { GroupsService } from '../groups/groups.service';
import { PrismaService } from '../prisma/prisma.service';

import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
@WebSocketGateway({
  namespace: '/progressbar',
  cors: true,
})
export class ProgressBarGateway {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private groupsService: GroupsService,
  ) {}

  @WebSocketServer() server: Server;

  @UseGuards(new AuthGuard())
  @SubscribeMessage('updateGroupLogo')
  async updateGroupLogo(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    progressCount: Prisma.FilesUncheckedCreateInput & {
      file: Express.Multer.File;
      oldName: string;
      groupId: string;
      name: string;
      plan: Plan;
    },
  ) {
    console.log(progressCount);
    const progress = await this.filesService.updateGroupLogo(progressCount);
    console.log(progress);

    try {
      // functions to fetch jwks
      const _client = jwksClient({
        jwksUri: 'http://localhost/auth/jwt/jwks.json',
      });

      function getKey(header: JwtHeader, callback: SigningKeyCallback) {
        _client.getSigningKey(header.kid, function (err, key) {
          const signingKey = key!.getPublicKey();
          callback(err, signingKey);
        });
      }

      // socket io connection
      this.server
        .use(function (socket: any, next: any) {
          // we first try and verify the jwt from the token param.
          if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(
              socket.handshake.query.token,
              getKey,
              {},
              function (err, decoded) {
                if (err) return next(new Error('Authentication error'));
                socket.decoded = decoded;
                next();
              },
            );
          } else {
            next(new Error('Authentication error'));
          }
        })
        .on('connection', function (server: any) {
          // Connection now authenticated to receive further events

          server.to(client.id).emit('updateGroupLogo', progress);

          progress === 100 && server.close();
        });

      // progress === 100 && this.server.close();
    } catch (e) {
      throw new UnsupportedMediaTypeException(
        `${progressCount.file.mimetype} isn't supported.`,
      );
    }
  }

  @SubscribeMessage('test')
  async test(@MessageBody('test') test: string) {
    console.log(test);
    return this.server.emit(test);
  }

  @UseGuards(new AuthGuard())
  @SubscribeMessage('createGroup')
  async createGroup(
    @Session() session: SessionContainer,
    @ConnectedSocket() client: Socket,
    @MessageBody()
    progressCount: {
      data: Prisma.FilesUncheckedCreateInput & {
        description?: string;
        plan: Plan;
      };
      file: Express.Multer.File;
      // clientId: string;
    },
  ) {
    const userId = session?.getUserId();

    const { data, file } = progressCount;

    console.log(userId);
    console.log(progressCount);

    const _client = jwksClient({
      jwksUri: 'http://localhost/auth/jwt/jwks.json',
    });

    function getKey(header: JwtHeader, callback: SigningKeyCallback) {
      _client.getSigningKey(header.kid, function (err, key) {
        const signingKey = key!.getPublicKey();
        callback(err, signingKey);
      });
    }

    try {
      // socket io connection
      this.server
        .use(function (socket: any, next: any) {
          // we first try and verify the jwt from the token param.
          if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(
              socket.handshake.query.token,
              getKey,
              {},
              function (e, decoded) {
                if (e) return next(new Error('Authentication error'));
                socket.decoded = decoded;
                next();
              },
            );
          } else {
            next(new Error('Authentication error'));
          }
        })
        .on('connection', async function (server: any) {
          // Connection now authenticated to receive further events
          const progress = await this.filesService.uploadFile(
            {
              name: file.originalname,
              shortDescription: data.shortDescription,
              tags: data.tags,
              plan: data.plan,
            },
            file,
            null,
            userId,
          );

          console.log(progress);
          server.to(client.id).emit('createGroup', progress);

          if (progress === 100) {
            await this.groupsService.createGroup({
              name: data.name,
              description: data.description,
              logo: file.originalname,
              adminId: userId,
            });

            const group = await this.prisma.groups.findUnique({
              where: { name: data.name },
              select: { groupId: true },
            });

            await this.prisma.files.update({
              where: { name: file.originalname },
              data: { groupId: group.groupId },
            });
          }

          progress === 100 && server.close();
        });

      // progress === 100 && this.server.close();
    } catch (e) {
      throw new UnsupportedMediaTypeException(
        `${progressCount.file.mimetype} isn't supported.`,
      );
    }
  }
}
