import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Gatherings, GatheringsSchema } from 'src/schemas/gatherings.schema';
import { GatheringsController } from './gatherings.controller';
import { GatheringsService } from './gatherings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gatherings.name, schema: GatheringsSchema },
    ]),
  ],
  providers: [GatheringsService],
  controllers: [GatheringsController],
  exports: [GatheringsService],
})
export class GatheringsModule {}
