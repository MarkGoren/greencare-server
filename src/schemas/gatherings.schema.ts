import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { BSONTypeAlias } from 'mongodb';
import { Date, HydratedDocument } from 'mongoose';
import { isDate } from 'util/types';

export type GatheringsDocument = HydratedDocument<Gatherings>;

@Schema()
export class Gatherings {
  @Prop({ required: true })
  imgsBefore: string[];

  @Prop([String])
  imgsAfter: string[];

  @Prop([{ String, Boolean }])
  usersIds: { id: string; locationApproved: boolean }[];

  @Prop()
  info: string;

  @Prop({ type: Object })
  location: { lat: number; lng: number };

  @Prop()
  locName: string;

  @Prop()
  time: number;

  @Prop({ default: '' })
  status: string;
  // status: pending, denied/approved
}

export const GatheringsSchema = SchemaFactory.createForClass(Gatherings);
