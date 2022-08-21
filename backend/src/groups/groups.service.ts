import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Groups } from './groups.entity';

@Injectable()
export class GroupsService {
  constructor( @InjectRepository(Groups)
  private usersRepository: Repository<Groups> ) {}

  getAll() {
   return this.usersRepository.find({
    order: {
      NAME: "ASC",
      ADMIN_ID: "ASC"
  },
   });
  };
}
