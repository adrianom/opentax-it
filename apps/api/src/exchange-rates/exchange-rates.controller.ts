import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRateQuery } from './exchange-rates.dto.js';
import { ExchangeRatesService } from './exchange-rates.service.js';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly service: ExchangeRatesService) {}

  /** Reference rate for a currency and day ("1 EUR = X units"), from the cache or Banca d'Italia. */
  @Get()
  rate(@Query() q: ExchangeRateQuery) {
    return this.service.rate(q.currency, q.date);
  }
}
