// src/users/schemas/admin.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';

@Schema({ timestamps: true, collection: 'users' })
export class Admin extends User {}

export const AdminSchema = SchemaFactory.createForClass(Admin);
