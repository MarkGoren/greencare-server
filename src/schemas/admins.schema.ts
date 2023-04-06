import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminsDocument = HydratedDocument<Admins>;

@Schema()
export class Admins {
  @Prop()
  fullName: string;

  @Prop()
  email: string;

  @Prop()
  passwordHash: string;

  @Prop({ default: 'admin', immutable: true })
  role: string;
}

export const AdminsSchema = SchemaFactory.createForClass(Admins);
