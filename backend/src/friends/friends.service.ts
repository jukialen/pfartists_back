import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friends } from './friends.entity';

@Injectable()
export class FriendsService {
  constructor( @InjectRepository(Friends)
  private usersRepository: Repository<Friends> ) {}

  getAll() {
   return this.usersRepository.find({
    order: {
      USERNAME_ID: "ASC",
      FRIEND_ID: "ASC"
  },
   });
  };
}
