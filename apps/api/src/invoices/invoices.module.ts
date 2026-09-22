import { Module } from '@nestjs/common';
import { FiscalRulesModule } from '../fiscal-rules/fiscal-rules.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesImportService } from './invoices-import.service.js';
import { InvoicesPdfService } from './invoices-pdf.service.js';
import { InvoicesService } from './invoices.service.js';

@Module({ imports: [FiscalRulesModule, TenantsModule], controllers: [InvoicesController], providers: [InvoicesService, InvoicesImportService, InvoicesPdfService] })
export class InvoicesModule {}
