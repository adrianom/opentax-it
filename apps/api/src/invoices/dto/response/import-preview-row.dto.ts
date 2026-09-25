import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportPreviewRowDto {
  @ApiProperty({ description: 'File, o percorso nello zip ("archivio.zip/cartella/file.xml")' }) file!: string;
  @ApiProperty({ enum: ['NEW', 'DUPLICATE', 'ERROR', 'IGNORED'], description: 'NEW: da importare; DUPLICATE: già presente; ERROR: non importabile; IGNORED: non è una fattura' })
  status!: 'NEW' | 'DUPLICATE' | 'ERROR' | 'IGNORED';
  @ApiPropertyOptional({ example: 'TD01' }) documentType?: string;
  @ApiPropertyOptional() number?: string;
  @ApiPropertyOptional({ description: 'Data del documento (AAAA-MM-GG)' }) date?: string;
  @ApiPropertyOptional() customer?: string;
  @ApiPropertyOptional({ description: 'Importo totale del documento' }) total?: number;
  @ApiPropertyOptional({ description: 'Fattura già presente' }) invoiceId?: string;
  @ApiPropertyOptional() message?: string;
}
