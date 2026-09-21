import { Controller, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Query } from '@nestjs/common';
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

  @Get(':year/deadlines')
  deadlines(
    @Param('year', ParseIntPipe) year: number,
    @Query('extension', new ParseBoolPipe({ optional: true })) extension?: boolean,
    @Query('intrastat', new ParseBoolPipe({ optional: true })) intrastat?: boolean,
  ) {
    return this.service.deadlines(year, { applyExtension: extension ?? true, quarterlyIntrastat: intrastat ?? false });
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
}
