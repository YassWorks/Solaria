import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { OracleService } from './oracle/oracle.service';
import { OracleController } from './oracle/oracle.controller';
import { BlockchainController } from './blockchain.controller';

@Module({
  providers: [BlockchainService, OracleService],
  controllers: [OracleController, BlockchainController],
  exports: [BlockchainService, OracleService],
})
export class BlockchainModule {}
