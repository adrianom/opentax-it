import { IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateTenantDto {
  @IsString() @Length(1, 120) name!: string;

  @IsOptional() @IsString() @Length(1, 80) businessName?: string;
  @IsString() @Length(1, 60) firstName!: string;
  @IsString() @Length(1, 60) lastName!: string;
  @IsString() @Matches(/^[A-Z0-9]{16}$/, { message: 'fiscalCode must be 16 alphanumeric characters' }) fiscalCode!: string;
  @IsString() @Matches(/^\d{11}$/, { message: 'vatNumber must be 11 digits' }) vatNumber!: string;
  @IsString() @Matches(/^\d{2}(\.\d{1,2}){0,2}$/, { message: 'atecoCode must look like 62.02 or 62.02.00' }) atecoCode!: string;
  @IsString() @Length(1, 60) address!: string;
  @IsString() @Matches(/^\d{5}$/) postalCode!: string;
  @IsString() @Length(1, 60) city!: string;
  @IsString() @Length(2, 2) province!: string;
  @IsInt() @Min(1990) activityStartYear!: number;
  @IsOptional() @IsBoolean() reducedRate?: boolean;
  @IsOptional() @IsBoolean() applyInpsSurcharge?: boolean;
  @IsOptional() @IsBoolean() viesRegistered?: boolean;
  @IsOptional() @IsString() @Matches(/^\d{3,4}$/) inpsOfficeCode?: string;
  @IsOptional() @IsString() pecAddress?: string;
}
