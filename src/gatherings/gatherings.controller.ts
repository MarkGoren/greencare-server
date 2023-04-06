import { Controller } from '@nestjs/common';
import { GatheringsService } from './gatherings.service';

@Controller()
export class GatheringsController {
  constructor(private readonly gatheringsService: GatheringsService) {}
}
