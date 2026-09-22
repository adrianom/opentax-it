import { Body, Controller, Delete, Get, Header, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { TenantId } from '../common/tenant.decorator.js';
import { PlanOptionsDto, UpdateF24StatusDto } from './f24.dto.js';
import { F24Service } from './f24.service.js';

@Controller('f24')
export class F24Controller {
  constructor(private readonly service: F24Service) {}

  /** F24 forms of a payment year (all kinds), with lines. */
  @Get()
  list(@TenantId() tenantId: string, @Query('year', ParseIntPipe) year: number) { return this.service.listByPaymentYear(tenantId, year); }

  /** Start dates allowed by the rule set of the payment year and, for each, the maximum number of installments. */
  @Get('plans/:taxYear/options')
  options(@TenantId() tenantId: string, @Param('taxYear', ParseIntPipe) taxYear: number) { return this.service.planOptions(tenantId, taxYear); }

  /** Saved plan of a tax year with its forms, or 404. */
  @Get('plans/:taxYear')
  plan(@TenantId() tenantId: string, @Param('taxYear', ParseIntPipe) taxYear: number) { return this.service.getPlan(tenantId, taxYear); }

  /** Forms that a plan with these options would produce (nothing is saved). */
  @Post('plans/:taxYear/preview')
  preview(@TenantId() tenantId: string, @Param('taxYear', ParseIntPipe) taxYear: number, @Body() dto: PlanOptionsDto) {
    return this.service.preview(tenantId, taxYear, dto);
  }

  /** Create the plan and its forms from the current tax summary; fails if a plan exists. */
  @Post('plans/:taxYear')
  create(@TenantId() tenantId: string, @Param('taxYear', ParseIntPipe) taxYear: number, @Body() dto: PlanOptionsDto) {
    return this.service.createPlan(tenantId, taxYear, dto);
  }

  /** Delete the plan and its forms (only when no form is paid or scheduled). */
  @Delete('plans/:taxYear') @HttpCode(204)
  remove(@TenantId() tenantId: string, @Param('taxYear', ParseIntPipe) taxYear: number) { return this.service.deletePlan(tenantId, taxYear); }

  @Get(':id')
  one(@TenantId() tenantId: string, @Param('id') id: string) { return this.service.get(tenantId, id); }

  /** The form printed on the official AdE model (three copies). */
  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(@TenantId() tenantId: string, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { fileName, content } = await this.service.pdf(tenantId, id);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return new StreamableFile(Buffer.from(content));
  }

  @Patch(':id/status')
  status(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateF24StatusDto) { return this.service.updateStatus(tenantId, id, dto); }
}
