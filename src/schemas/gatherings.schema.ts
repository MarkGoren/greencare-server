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
  usersIds: {
    id: string;
    isLocApproved: boolean;
  }[];

  @Prop({ default: [] })
  users: {
    //hashedId: string;
    fullName: string;
    profileImg: string;
  }[];

  @Prop({ default: '' })
  info: string;

  @Prop({ type: Object })
  loc: { lat: number; lng: number };

  @Prop()
  locName: string;

  @Prop()
  time: number;

  @Prop()
  capacity: number;

  @Prop({ default: '' })
  status: string;
  // status: location found/ gathering initiated, pending approval, denied/approved
}

export const GatheringsSchema = SchemaFactory.createForClass(Gatherings);
