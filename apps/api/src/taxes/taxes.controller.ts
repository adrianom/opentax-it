import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { TenantId } from '../common/tenant.decorator.js';
import { UpdateTaxYearDataDto } from './taxes.dto.js';
import { CreateTaxCreditDto } from './tax-credits.dto.js';
import { TaxCreditsService } from './tax-credits.service.js';
import { TaxesService } from './taxes.service.js';

@Controller('taxes')
export class TaxesController {
  constructor(
    private readonly service: TaxesService,
    private readonly credits: TaxCreditsService,
  ) {}

  @Get('credits')
  credits_(@TenantId() tenantId: string) { return this.credits.list(tenantId); }

  @Get('credits/:id')
  credit(@TenantId() tenantId: string, @Param('id') id: string) { return this.credits.get(tenantId, id); }

  @Post('credits')
  createCredit(@TenantId() tenantId: string, @Body() dto: CreateTaxCreditDto) { return this.credits.create(tenantId, dto); }

  @Put('credits/:id')
  updateCredit(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: CreateTaxCreditDto) { return this.credits.update(tenantId, id, dto); }

  @Delete('credits/:id') @HttpCode(204)
  removeCredit(@TenantId() tenantId: string, @Param('id') id: string) { return this.credits.remove(tenantId, id); }

  @Get(':year/summary')
  summary(@TenantId() tenantId: string, @Param('year', ParseIntPipe) year: number) { return this.service.summary(tenantId, year); }

  @Get(':year/data')
  data(@TenantId() tenantId: string, @Param('year', ParseIntPipe) year: number) { return this.service.yearData(tenantId, year); }

  @Put(':year/data')
  update(@TenantId() tenantId: string, @Param('year', ParseIntPipe) year: number, @Body() dto: UpdateTaxYearDataDto) {
    return this.service.updateYearData(tenantId, year, dto);
  }
}
