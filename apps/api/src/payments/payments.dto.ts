import { IsNumber, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreatePaymentDto {
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  /** Amount in the invoice currency; negative for refunds (e.g. on credit notes). */
  @IsNumber() amount!: number;
  /** Amount in EUR when the invoice currency is not EUR; defaults to amount × invoice exchange rate. */
  @IsOptional() @IsNumber() amountEur?: number;
  @IsOptional() @IsString() @Length(1, 40) method?: string;
  @IsOptional() @IsString() notes?: string;
}
