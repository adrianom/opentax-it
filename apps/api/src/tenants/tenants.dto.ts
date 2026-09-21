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
  @IsOptional() @IsString() @Matches(/^\d{4}-[a-z0-9-]+$/) inpsOfficeId?: string;
  @IsOptional() @IsInt() @Min(0) paymentTermsDays?: number;
  @IsOptional() @IsString() @Matches(/^MP\d{2}$/) paymentMethod?: string;
  @IsOptional() @IsString() @Matches(/^([A-Z]{2}\d{2}[A-Z0-9]{11,30})?$/) paymentIban?: string;
  @IsOptional() @IsString() @Matches(/^([A-Z0-9]{8}|[A-Z0-9]{11})?$/) paymentBic?: string;
  @IsOptional() @IsString() pecAddress?: string;
}

export class UpdateTenantProfileDto {
  @IsOptional() @IsString() @Length(1, 120) name?: string;
  @IsOptional() @IsString() @Length(1, 80) businessName?: string;
  @IsOptional() @IsString() @Length(1, 60) firstName?: string;
  @IsOptional() @IsString() @Length(1, 60) lastName?: string;
  @IsOptional() @IsString() @Matches(/^[A-Z0-9]{16}$/) fiscalCode?: string;
  @IsOptional() @IsString() @Matches(/^\d{11}$/) vatNumber?: string;
  @IsOptional() @IsString() @Matches(/^\d{2}(\.\d{1,2}){0,2}$/) atecoCode?: string;
  @IsOptional() @IsString() @Length(1, 60) address?: string;
  @IsOptional() @IsString() @Matches(/^\d{5}$/) postalCode?: string;
  @IsOptional() @IsString() @Length(1, 60) city?: string;
  @IsOptional() @IsString() @Length(2, 2) province?: string;
  @IsOptional() @IsInt() @Min(1990) activityStartYear?: number;
  @IsOptional() @IsBoolean() reducedRate?: boolean;
  @IsOptional() @IsBoolean() applyInpsSurcharge?: boolean;
  @IsOptional() @IsBoolean() viesRegistered?: boolean;
  @IsOptional() @IsString() pecAddress?: string;
  @IsOptional() @IsString() @Matches(/^\d{4}-[a-z0-9-]+$/) inpsOfficeId?: string;
  @IsOptional() @IsInt() @Min(0) paymentTermsDays?: number;
  @IsOptional() @IsString() @Matches(/^MP\d{2}$/) paymentMethod?: string;
  @IsOptional() @IsString() @Matches(/^([A-Z]{2}\d{2}[A-Z0-9]{11,30})?$/) paymentIban?: string;
  @IsOptional() @IsString() @Matches(/^([A-Z0-9]{8}|[A-Z0-9]{11})?$/) paymentBic?: string;
}
