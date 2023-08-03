import { Test, TestingModule } from '@nestjs/testing';
import { GroupsPostsController } from './groups-posts.controller';

describe('GroupsPostsController', () => {
  let controller: GroupsPostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsPostsController],
    }).compile();

    controller = module.get<GroupsPostsController>(GroupsPostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
