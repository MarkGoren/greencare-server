import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsersDocument = HydratedDocument<Users>;

@Schema()
export class Users {
  @Prop({ required: true })
  email: string;

  @Prop({ default: false })
  emailApproved: boolean;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 0 })
  coins: number;

  @Prop({ default: 0 })
  xp: number;

  @Prop([Number])
  gatheringIds: number[];

  @Prop()
  actions: object[];

  @Prop({ default: process.env.DEFAULT_PROFILE_IMAGE })
  profileImg: string;

  @Prop({ default: 'user', immutable: true })
  role: string;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
