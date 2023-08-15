import { Test, TestingModule } from '@nestjs/testing';
import { FilesCommentsController } from './files-comments.controller';

describe('FilesCommentsController', () => {
  let controller: FilesCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesCommentsController],
    }).compile();

    controller = module.get<FilesCommentsController>(FilesCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
