import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gatherings, GatheringsDocument } from 'src/schemas/gatherings.schema';

@Injectable()
export class GatheringsService {
  constructor(
    @InjectModel(Gatherings.name)
    private readonly gatheringsModel: Model<GatheringsDocument>,
  ) {}
}
