import { Module } from '@nestjs/common';
import { FiscalRulesModule } from '../fiscal-rules/fiscal-rules.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';

@Module({ imports: [FiscalRulesModule, TenantsModule], controllers: [InvoicesController], providers: [InvoicesService] })
export class InvoicesModule {}
