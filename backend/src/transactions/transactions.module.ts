import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { WalletService } from '../shared/services/wallet.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BlockchainModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, WalletService],
  exports: [TransactionsService, WalletService],
})
export class TransactionsModule {}
