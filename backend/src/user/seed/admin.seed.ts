import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin } from '../schemas/admin.schema';
import { Role } from 'src/shared/Enums/role.enum';

@Injectable()
export class AdminSeeder {

  constructor(@InjectModel(Admin.name) private adminModel: Model<Admin>) {}

  async seed() {
    const adminExists = await this.adminModel.findOne({ email: 'admin@solaria.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('Admin@123', salt);

      await this.adminModel.create({
        email: 'admin@solaria.com',
        cin: 'ADMIN001',
        phone: '98765432',
        fullname: 'Solaria Admin',
        password,
        salt,
        photoUrl: "uploads/defaults/defaultUserImage.jpeg",
        role: Role.ADMIN,
        walletAddress: '0xAdminWallet',
        encryptedWallet: 'encryptedAdminWallet',
      });
    }
  }
}
