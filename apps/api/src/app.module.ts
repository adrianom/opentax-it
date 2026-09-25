import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuditLogModule } from './audit-log/audit-log.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { AuthModule } from './auth/auth.module.js';
import { RolesGuard } from './auth/roles.guard.js';
import { CustomersModule } from './customers/customers.module.js';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module.js';
import { F24Module } from './f24/f24.module.js';
import { FiscalRulesModule } from './fiscal-rules/fiscal-rules.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { TaxesModule } from './taxes/taxes.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SourcesModule } from './sources/sources.module.js';
import { StorageModule } from './storage/storage.module.js';
import { TenantsModule } from './tenants/tenants.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    StorageModule,
    FiscalRulesModule,
    TenantsModule,
    CustomersModule,
    InvoicesModule,
    PaymentsModule,
    TaxesModule,
    F24Module,
    ExchangeRatesModule,
    SourcesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
