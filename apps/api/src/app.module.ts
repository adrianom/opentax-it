import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CustomersModule } from './customers/customers.module.js';
import { FiscalRulesModule } from './fiscal-rules/fiscal-rules.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StorageModule } from './storage/storage.module.js';
import { TenantsModule } from './tenants/tenants.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    StorageModule,
    FiscalRulesModule,
    TenantsModule,
    CustomersModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
