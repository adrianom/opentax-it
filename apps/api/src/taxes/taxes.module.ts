import { Module } from '@nestjs/common';
import { FiscalRulesModule } from '../fiscal-rules/fiscal-rules.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { TaxesController } from './taxes.controller.js';
import { TaxCreditsService } from './tax-credits.service.js';
import { TaxesService } from './taxes.service.js';

@Module({ imports: [FiscalRulesModule, PaymentsModule, TenantsModule], controllers: [TaxesController], providers: [TaxesService, TaxCreditsService], exports: [TaxesService, TaxCreditsService] })
export class TaxesModule {}
