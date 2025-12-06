import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './config/database/database.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { ProjectsModule } from './projects/projects.module';
import { InvestorsModule } from './investors/investors.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ProductionController } from './production/production.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    MailModule,
    UserModule,
    AuthModule,
    BlockchainModule,
    ProjectsModule,
    InvestorsModule,
    TransactionsModule,
  ],
  controllers: [AppController, ProductionController],
  providers: [AppService],
})
export class AppModule {}
