import { Test, TestingModule } from '@nestjs/testing';
import { ProgressBarGateway } from './progress-bar.gateway';

describe('ProgressBarGateway', () => {
  let gateway: ProgressBarGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressBarGateway],
    }).compile();

    gateway = module.get<ProgressBarGateway>(ProgressBarGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
