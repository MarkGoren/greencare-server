import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PrizesDocument = HydratedDocument<Prizes>;

@Schema()
export class Prizes {
  @Prop({ required: true })
  storeName: string;

  @Prop({ required: true })
  discountName: string;

  @Prop({ required: true })
  img: string;

  @Prop({ required: true })
  amountAvailable: number;

  @Prop({ required: true })
  cost: number;
}

export const PrizesSchema = SchemaFactory.createForClass(Prizes);
