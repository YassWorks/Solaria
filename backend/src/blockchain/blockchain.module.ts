import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { OracleService } from './oracle/oracle.service';

@Module({
  providers: [BlockchainService, OracleService],
  exports: [BlockchainService, OracleService],
})
export class BlockchainModule {}
