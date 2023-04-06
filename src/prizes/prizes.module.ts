import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Prizes, PrizesSchema } from 'src/schemas/prizes.schema';
import { PrizesController } from './prizes.controller';
import { PrizesService } from './prizes.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prizes.name, schema: PrizesSchema }]),
  ],
  providers: [PrizesService],
  controllers: [PrizesController],
  exports: [PrizesService],
})
export class PrizesModule {}
