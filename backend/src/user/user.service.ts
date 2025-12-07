import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginate } from 'src/config/pagination/pagination.util';
import { PaginationQuery } from 'src/config/pagination/pagination.interface';
import { encrypt, decrypt } from 'src/shared/utils/encryption';
import { WalletService } from '../shared/services/wallet.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private walletService: WalletService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const emailExists = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (emailExists) throw new ConflictException('User already exists!');

    const cinExists = await this.userModel.findOne({ cin: createUserDto.cin });
    if (cinExists) throw new ConflictException('CIN already in use!');

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(createUserDto.password, salt);

    // encrypt wallet fields only if they are provided
    const walletAddress = createUserDto.walletAddress
      ? encrypt(createUserDto.walletAddress)
      : undefined;
    const encryptedWallet = createUserDto.encryptedWallet
      ? encrypt(createUserDto.encryptedWallet)
      : undefined;

    const user = new this.userModel({
      ...createUserDto,
      password,
      salt,
      walletAddress,
      encryptedWallet,
    });
    return user.save();
  }

  async findAll(paginationQuery?: PaginationQuery) {
    return paginate(
      this.userModel,
      { deletedAt: null },
      paginationQuery || { page: 1, limit: 10 },
    );
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email, deletedAt: null })
      .lean();
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findOneById(id: string) {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    let hashedPassword: string | undefined;
    let salt: string | undefined;

    if (updateUserDto.password) {
      salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(updateUserDto.password, salt);
    }

    const updatePayload: Partial<UpdateUserDto> = {
      ...updateUserDto,
      ...(hashedPassword && { password: hashedPassword, salt }),
      ...(updateUserDto.walletAddress && {
        walletAddress: encrypt(updateUserDto.walletAddress),
      }),
      ...(updateUserDto.encryptedWallet && {
        encryptedWallet: encrypt(updateUserDto.encryptedWallet),
      }),
    };

    const updated = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updatePayload,
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return updated;
  }


  async softDelete(id: string) {
    const deleted = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );
    if (!deleted)
      throw new NotFoundException(
        `User with id ${id} not found or already deleted`,
      );
    return deleted;
  }

  /**
   * Create a new wallet for user
   */
  async createWallet(
    userId: string,
    password: string,
  ): Promise<{
    walletAddress: string;
    message: string;
  }> {
    const user = await this.findOneById(userId);

    if (user.walletAddress && user.encryptedWallet) {
      throw new BadRequestException('User already has a wallet');
    }

    // Create wallet using WalletService
    const { walletAddress, encryptedPrivateKey } =
      await this.walletService.createWallet(password);

    // Store encrypted wallet
    user.walletAddress = walletAddress;
    user.encryptedWallet = encryptedPrivateKey;
    await user.save();

    return {
      walletAddress,
      message: 'Wallet created successfully. Keep your password safe!',
    };
  }

  /**
   * Verify wallet password
   */
  async verifyWalletPassword(
    userId: string,
    password: string,
  ): Promise<boolean> {
    const user = await this.findOneById(userId);

    if (!user.encryptedWallet) {
      throw new BadRequestException('User does not have a wallet');
    }

    return this.walletService.verifyPassword(user.encryptedWallet, password);
  }

  /**
   * Get wallet info (address only, never expose private key)
   */
  async getWalletInfo(userId: string): Promise<{
    walletAddress: string | null;
    hasWallet: boolean;
  }> {
    const user = await this.findOneById(userId);

    return {
      walletAddress: user.walletAddress || null,
      hasWallet: !!(user.walletAddress && user.encryptedWallet),
    };
  }
}
