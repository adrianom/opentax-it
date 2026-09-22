import { Module } from '@nestjs/common';
import { FiscalRulesModule } from '../fiscal-rules/fiscal-rules.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { TaxesModule } from '../taxes/taxes.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { F24Controller } from './f24.controller.js';
import { F24PdfService } from './f24-pdf.service.js';
import { F24Service } from './f24.service.js';

@Module({ imports: [FiscalRulesModule, TaxesModule, TenantsModule, StorageModule], controllers: [F24Controller], providers: [F24Service, F24PdfService] })
export class F24Module {}
