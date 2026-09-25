import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportResultDto {
  @ApiProperty({ description: 'File, o percorso nello zip ("archivio.zip/cartella/file.xml")' }) file!: string;
  @ApiProperty({ enum: ['IMPORTED', 'SKIPPED', 'ERROR'] }) status!: 'IMPORTED' | 'SKIPPED' | 'ERROR';
  @ApiPropertyOptional() number?: string;
  @ApiPropertyOptional() invoiceId?: string;
  @ApiPropertyOptional() customer?: string;
  @ApiPropertyOptional() message?: string;
}
