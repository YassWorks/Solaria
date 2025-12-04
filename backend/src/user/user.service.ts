import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginate } from 'src/config/pagination/pagination.util';
import { PaginationQuery } from 'src/config/pagination/pagination.interface';
import { encrypt, decrypt } from 'src/shared/utils/encryption';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const emailExists = await this.userModel.findOne({ email: createUserDto.email });
    if (emailExists) throw new ConflictException('User already exists!');

    const cinExists = await this.userModel.findOne({ cin: createUserDto.cin });
    if (cinExists) throw new ConflictException('CIN already in use!');

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(createUserDto.password, salt);

    // encrypt wallet fields only if they are provided
    const walletAddress = createUserDto.walletAddress ? encrypt(createUserDto.walletAddress) : undefined;
    const encryptedWallet = createUserDto.encryptedWallet ? encrypt(createUserDto.encryptedWallet) : undefined;

    const user = new this.userModel({ ...createUserDto, password, walletAddress, encryptedWallet });
    return user.save();
  }


  async findAll(paginationQuery?: PaginationQuery) {
    return paginate(this.userModel, { deletedAt: null }, paginationQuery || { page: 1, limit: 10 });
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel.findOne({ email, deletedAt: null });
    if (!user) throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findOneById(id: string) {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const updatePayload: Partial<UpdateUserDto> = {
      ...updateUserDto,
      ...(updateUserDto.walletAddress && { walletAddress: encrypt(updateUserDto.walletAddress) }),
      ...(updateUserDto.encryptedWallet && { encryptedWallet: encrypt(updateUserDto.encryptedWallet) }),
    };

    const updated = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updatePayload,
      { new: true, runValidators: true },
    );

    if (!updated) throw new NotFoundException(`User with id ${id} not found`);
    return updated;
  }

  async softDelete(id: string) {
    const deleted = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );
    if (!deleted) throw new NotFoundException(`User with id ${id} not found or already deleted`);
    return deleted;
  }
}
