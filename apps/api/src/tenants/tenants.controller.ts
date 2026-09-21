import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { TenantId } from '../common/tenant.decorator.js';
import { BankAccountDto, CreateTenantDto, PaymentTermsDto, UpdateTenantProfileDto } from './tenants.dto.js';
import { TenantsService } from './tenants.service.js';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get('me/bank-accounts')
  bankAccounts(@TenantId() tenantId: string) { return this.service.listBankAccounts(tenantId); }

  @Post('me/bank-accounts')
  createBankAccount(@TenantId() tenantId: string, @Body() dto: BankAccountDto) { return this.service.saveBankAccount(tenantId, dto); }

  @Put('me/bank-accounts/:id')
  updateBankAccount(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: BankAccountDto) { return this.service.saveBankAccount(tenantId, dto, id); }

  @Delete('me/bank-accounts/:id') @HttpCode(204)
  deleteBankAccount(@TenantId() tenantId: string, @Param('id') id: string) { return this.service.deleteBankAccount(tenantId, id); }

  @Get('me/payment-terms')
  paymentTerms(@TenantId() tenantId: string) { return this.service.listPaymentTerms(tenantId); }

  @Post('me/payment-terms')
  createPaymentTerms(@TenantId() tenantId: string, @Body() dto: PaymentTermsDto) { return this.service.savePaymentTerms(tenantId, dto); }

  @Put('me/payment-terms/:id')
  updatePaymentTerms(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: PaymentTermsDto) { return this.service.savePaymentTerms(tenantId, dto, id); }

  @Delete('me/payment-terms/:id') @HttpCode(204)
  deletePaymentTerms(@TenantId() tenantId: string, @Param('id') id: string) { return this.service.deletePaymentTerms(tenantId, id); }

  @Get('inps-offices')
  inpsOffices() {
    return this.service.inpsOffices();
  }

  @Get('me')
  me(@TenantId() tenantId: string) {
    return this.service.getWithProfile(tenantId);
  }

  @Put('me')
  updateMe(@TenantId() tenantId: string, @Body() dto: UpdateTenantProfileDto) {
    return this.service.updateProfile(tenantId, dto);
  }
}
