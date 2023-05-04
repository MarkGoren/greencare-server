import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Date, HydratedDocument } from 'mongoose';

export type GatheringsDocument = HydratedDocument<Gatherings>;

@Schema()
export class Gatherings {
  @Prop({ required: true })
  imgsBefore: string[];

  @Prop({ default: [] })
  imgsAfter: string[];

  @Prop({ default: [] })
  usersIds: string[];

  @Prop({ default: [] })
  users: {
    hashedId: string;
    fullName: string;
    profileImg: string;
    isLocApproved: boolean;
  }[];

  @Prop({ default: '' })
  info: string;

  @Prop({ type: Object })
  loc: { lat: number; lng: number };

  @Prop()
  locName: string;

  @Prop()
  time: string;

  @Prop({ default: '' })
  status: string;
  // status: location found/ gathering initiated, pending approval, denied/approved
}

export const GatheringsSchema = SchemaFactory.createForClass(Gatherings);
