import { Module, OnModuleInit } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { AdminSeeder } from './seed/admin.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema }
    ]),
  ],
  providers: [UserService, AdminSeeder],
  controllers: [UserController],
  exports: [MongooseModule, UserService],
})
export class UserModule implements OnModuleInit {
  constructor(private readonly adminSeeder: AdminSeeder) {}

  async onModuleInit() {
    await this.adminSeeder.seed();
  }
}
