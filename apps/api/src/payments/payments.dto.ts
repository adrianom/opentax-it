import { IsNumber, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  /** Amount in the invoice currency; negative for refunds (e.g. on credit notes). */
  @IsNumber() @Min(-1_000_000_000) @Max(1_000_000_000) amount!: number;
  /** Amount in EUR when the invoice currency is not EUR; defaults to amount × invoice exchange rate. */
  @IsOptional() @IsNumber() @Min(-1_000_000_000) @Max(1_000_000_000) amountEur?: number;
  /** EUR per unit of the invoice currency on the collection day (TUIR art. 9 par. 2); required for non-EUR invoices unless amountEur is given. */
  @IsOptional() @IsNumber() @Min(0.000001) @Max(1_000_000) exchangeRate?: number;
  @IsOptional() @IsString() @Length(1, 40) method?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
