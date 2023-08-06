import { Test, TestingModule } from '@nestjs/testing';
import { SubCommentsController } from './sub-comments.controller';

describe('SubCommentsController', () => {
  let controller: SubCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubCommentsController],
    }).compile();

    controller = module.get<SubCommentsController>(SubCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
