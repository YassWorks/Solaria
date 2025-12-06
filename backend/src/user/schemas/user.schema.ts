import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/shared/Enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  discriminatorKey: 'role',
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  cin: string;

  @Prop({ required: true })
  password: string;
  
  @Prop()
  salt: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true, enum: Object.values(Role), default: Role.USER })
  role: Role;

  @Prop({ required: false })
  photoUrl: string;

  @Prop({ required: false })
  walletAddress: string;


  @Prop({ required: false })
  encryptedWallet: string;

  @Prop({ default: null })
  deletedAt?: Date;
  
}

export const UserSchema = SchemaFactory.createForClass(User);
