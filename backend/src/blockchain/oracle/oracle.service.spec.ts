import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from '../blockchain.service';
import { OracleService } from './oracle.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('OracleService - Live Tests', () => {
  let oracleService: OracleService;
  let blockchainService: BlockchainService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        OracleService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: string) => {
              // Filter out invalid placeholder keys
              const isValidKey = (val: string) =>
                val &&
                val.length >= 64 &&
                !val.includes('your_') &&
                val !== 'your_oracle_private_key_here';

              const config = {
                DIONE_RPC_URL: process.env.DIONE_RPC_URL,
                CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
                PRIVATE_KEY: process.env.PRIVATE_KEY,
                ORACLE_PRIVATE_KEY: isValidKey(
                  process.env.ORACLE_PRIVATE_KEY || '',
                )
                  ? process.env.ORACLE_PRIVATE_KEY
                  : undefined,
                ORACLE_MODE: process.env.ORACLE_MODE || 'simulation',
              };
              return config[key] !== undefined ? config[key] : defaultValue;
            },
          },
        },
      ],
    }).compile();

    blockchainService = module.get<BlockchainService>(BlockchainService);
    oracleService = module.get<OracleService>(OracleService);

    await blockchainService.onModuleInit();
    await oracleService.onModuleInit();
  });

  describe('Oracle Initialization', () => {
    it('should initialize oracle service', () => {
      expect(oracleService).toBeDefined();
      expect(blockchainService).toBeDefined();
    });

    it('should check oracle mode and availability', () => {
      const isSimulation = oracleService.isSimulationMode();
      const isAvailable = blockchainService.isOracleAvailable();

      console.log(`\n🔍 Oracle Mode: ${isSimulation ? 'SIMULATION' : 'REAL'}`);
      console.log(`🔍 Oracle Available: ${isAvailable}`);

      // In simulation mode, oracle wallet won't be available
      if (process.env.ORACLE_MODE === 'simulation') {
        expect(isSimulation).toBe(true);
        console.log('✅ Running in SIMULATION mode - perfect for testing!');
      } else if (isAvailable) {
        expect(isSimulation).toBe(false);
        console.log('✅ Running in REAL mode with oracle wallet');
      }
    });

    it('should get oracle status', async () => {
      const status = await oracleService.getOracleStatus();

      console.log('\n📊 Oracle Status:');
      console.log(`   Mode: ${status.mode}`);
      console.log(`   Active: ${status.active}`);
      console.log(`   Address: ${status.address || 'N/A (simulation mode)'}`);
      console.log(`   Balance: ${status.balance || 'N/A'}`);

      expect(status).toBeDefined();
      expect(status.mode).toBe(
        oracleService.isSimulationMode() ? 'simulation' : 'real',
      );
      expect(status.active).toBe(true);
    });
  });

  describe('Production Simulation', () => {
    it('should calculate simulated production for Austin Solar Farm', async () => {
      const projectId = 1;

      try {
        const production =
          await oracleService.getSimulatedProduction(projectId);

        const currentHour = new Date().getHours();
        console.log(`\n☀️  Hour: ${currentHour}:00`);
        console.log(`⚡ Simulated Production: ${production} kWh`);

        expect(typeof production).toBe('number');
        expect(production).toBeGreaterThanOrEqual(0);

        // Solar should produce 0 at night (before 6am or after 6pm)
        if (currentHour < 6 || currentHour > 18) {
          expect(production).toBe(0);
        } else {
          // During day, should have some production
          expect(production).toBeGreaterThan(0);
        }
      } catch (error) {
        console.error('Failed to get simulated production:', error);
        throw error;
      }
    });
  });

  describe('Production Recording (requires ORACLE_PRIVATE_KEY)', () => {
    it('should record production manually', async () => {
      if (
        !process.env.ORACLE_PRIVATE_KEY ||
        process.env.ORACLE_PRIVATE_KEY === 'your_oracle_private_key_here' ||
        process.env.ORACLE_PRIVATE_KEY.length < 64
      ) {
        console.log(
          '\n⚠️  Skipping - Set valid ORACLE_PRIVATE_KEY env variable to test production recording',
        );
        return;
      }

      const projectId = 1;
      const kwhProduced = 100;
      const source = 'Test Manual Recording';

      console.log('\n🔄 Recording production manually...');

      try {
        const result = await oracleService.recordProductionManually(
          projectId,
          kwhProduced,
          source,
        );

        console.log(`✅ Production recorded!`);
        console.log(`📝 Transaction Hash: ${result.transactionHash}`);
        console.log(`⛽ Gas Used: ${result.gasUsed}`);

        expect(result.success).toBe(true);
        expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(result.gasUsed).toBeDefined();
      } catch (error) {
        console.error('❌ Failed to record production:', error);
        throw error;
      }
    }, 60000);

    it('should test oracle with current simulated production', async () => {
      if (!oracleService.isSimulationMode()) {
        console.log('\n⚠️  Skipping - Only for simulation mode');
        return;
      }

      console.log('\n🧪 Testing oracle with simulated production...');

      await oracleService.testOracle();
      console.log('✅ Oracle test completed successfully');
    }, 120000);
  });

  describe('Error Handling', () => {
    it('should handle simulation mode correctly', async () => {
      if (!oracleService.isSimulationMode()) {
        console.log('\n⚠️  Skipping - Only for simulation mode');
        return;
      }

      // Should NOT throw error in simulation mode
      const result = await oracleService.recordProductionManually(
        1,
        100,
        'Test',
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toContain('SIMULATED');
    });
  });
});
