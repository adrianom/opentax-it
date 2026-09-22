import { IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export const CREDIT_SECTIONS = ['TREASURY', 'INPS', 'REGIONAL', 'LOCAL'] as const;

export class CreateTaxCreditDto {
  @IsIn(CREDIT_SECTIONS) section!: (typeof CREDIT_SECTIONS)[number];
  /** Tax code (e.g. 4001, 1792, 3844) or INPS reason (PXX). */
  @IsString() @Matches(/^[A-Z0-9]{3,6}$/) code!: string;
  @IsInt() @Min(2000) referenceYear!: number;
  @IsNumber() @Min(0.01) amount!: number;
  /** Region code / municipality cadastral code (regional and local sections). */
  @IsOptional() @IsString() @Matches(/^([A-Z0-9]{1,4})?$/) localCode?: string;
  @IsOptional() @IsString() @Matches(/^(\d{4})?$/) installmentCode?: string;
  @IsOptional() @IsString() @Matches(/^(\d{4}-\d{2}-\d{2})?$/) usableFrom?: string;
  @IsOptional() @IsString() @Length(0, 120) description?: string;
  @IsOptional() @IsString() notes?: string;
}
