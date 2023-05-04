import { Test, TestingModule } from '@nestjs/testing';
import { UsersGroupsController } from './users-groups.controller';

describe('UsersGroupsController', () => {
  let controller: UsersGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersGroupsController],
    }).compile();

    controller = module.get<UsersGroupsController>(UsersGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
