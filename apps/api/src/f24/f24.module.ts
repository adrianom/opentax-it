import { Module } from '@nestjs/common';
import { FiscalRulesModule } from '../fiscal-rules/fiscal-rules.module.js';
import { TaxesModule } from '../taxes/taxes.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { F24Controller } from './f24.controller.js';
import { F24Service } from './f24.service.js';

@Module({ imports: [FiscalRulesModule, TaxesModule, TenantsModule], controllers: [F24Controller], providers: [F24Service] })
export class F24Module {}
