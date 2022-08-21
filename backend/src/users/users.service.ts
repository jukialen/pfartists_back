import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';

@Injectable()
export class UsersService {
  constructor( @InjectRepository(Users)
  private usersRepository: Repository<Users> ) {}

  async getAll() {
   return await this.usersRepository.find({
    order: {
      PSEUDONYM: "ASC"
  },
   });
  };

  async getOne(ID: string) {
    return await this.usersRepository.findOne({
      where: {
          ID: ID,
      },
  })
  } 

  async createUser(user: Users) {        
    return await this.usersRepository.save({
      id: user.ID,
      USERNAME: user.USERNAME,
      PSEUDONYM: user.PSEUDONYM,
      EMAIL: user.EMAIL,
      PASSWORD: user.PASSWORD,
      DESCRIPTION: user.DESCRIPTION,
      PROFILE_PHOTO: user.PROFILE_PHOTO
    })
   }

   async updateUser(user: Users) {
    return this.usersRepository.update(user.ID, user);
   }

   async deleteUser(ID: string) {
    return this.usersRepository.delete(ID)
   }
}
