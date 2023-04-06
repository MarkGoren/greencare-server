import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prizes, PrizesDocument } from 'src/schemas/prizes.schema';

@Injectable()
export class PrizesService {
  constructor(
    @InjectModel(Prizes.name)
    private readonly prizesModel: Model<PrizesDocument>,
  ) {}
}
