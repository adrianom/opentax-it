import { IsNotEmpty, IsString } from 'class-validator';

export class SelectTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Il tenantId è obbligatorio' })
  tenantId!: string;
}
