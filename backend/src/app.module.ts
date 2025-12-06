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
import { ProjectsController } from './projects/projects.controller';
import { ProductionController } from './production/production.controller';
import { InvestorsController } from './investors/investors.controller';

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
  ],
  controllers: [
    AppController,
    ProjectsController,
    InvestorsController,
    ProductionController,
  ],
  providers: [AppService],
})
export class AppModule {}
