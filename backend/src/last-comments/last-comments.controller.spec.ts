import { Test, TestingModule } from '@nestjs/testing';
import { LastCommentsController } from './last-comments.controller';

describe('LastCommentsController', () => {
  let controller: LastCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LastCommentsController],
    }).compile();

    controller = module.get<LastCommentsController>(LastCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
