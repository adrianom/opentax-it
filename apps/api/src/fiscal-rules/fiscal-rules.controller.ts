import { Controller, Get, HttpException, Param, ParseBoolPipe, ParseIntPipe, Post, Query } from '@nestjs/common';
import { OptionalTenantId } from '../common/optional-tenant.decorator.js';
import { FiscalRulesService } from './fiscal-rules.service.js';

@Controller('fiscal-rules')
export class FiscalRulesController {
  constructor(private readonly service: FiscalRulesService) {}

  @Get(':year')
  list(@Param('year', ParseIntPipe) year: number) {
    return this.service.listByYear(year);
  }

  @Get(':year/active')
  active(@Param('year', ParseIntPipe) year: number) {
    return this.service.getActive(year);
  }

  /** Deadline calendar; with an `x-tenant-id` header the stamp duty deferrals use the tenant's invoices. */
  @Get(':year/deadlines')
  deadlines(
    @Param('year', ParseIntPipe) year: number,
    @OptionalTenantId() tenantId: string | undefined,
    @Query('extension', new ParseBoolPipe({ optional: true })) extension?: boolean,
    @Query('intrastat', new ParseBoolPipe({ optional: true })) intrastat?: boolean,
  ) {
    return this.service.deadlines(year, { applyExtension: extension ?? true, quarterlyIntrastat: intrastat }, tenantId);
  }

  // TODO: restrict to PLATFORM_ADMIN once authentication is in place.
  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Post('seed')
  seed() {
    return this.service.seedBundled().then((inserted) => ({ inserted }));
  }

  /** Whether the active set for a year is usable; lets the UI explain what to do instead of failing. */
  @Get(':year/status')
  async status(@Param('year', ParseIntPipe) year: number) {
    try {
      await this.service.getActive(year);
      return { year, ok: true };
    } catch (e) {
      if (!(e instanceof HttpException)) throw e; // unexpected errors stay generic 500s
      return { year, ok: false, reason: e.message };
    }
  }
}
