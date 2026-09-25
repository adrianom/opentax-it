import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Put, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { attachment } from '../common/content-disposition.js';
import { TenantId } from '../common/tenant.decorator.js';
import { CreateInvoiceDto, IssueInvoiceDto, ListInvoicesQuery, UpdateInvoiceDto } from './invoices.dto.js';
import { ImportInvoicesDto } from './dto/request/import-invoices.dto.js';
import { PreviewImportDto } from './dto/request/preview-import.dto.js';
import { ImportPreviewRowDto } from './dto/response/import-preview-row.dto.js';
import { ImportResultDto } from './dto/response/import-result.dto.js';
import { toImportPreviewRowDto, toImportResultDto, toUploadedFiles } from './invoice-import.mapper.js';
import { InvoicesImportService } from './invoices-import.service.js';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService, private readonly importer: InvoicesImportService) {}

  /** What importing these XML or ZIP files would do, without writing anything (declared before ':id' routes). */
  @Post('import/preview')
  @HttpCode(200)
  @ApiOkResponse({ type: [ImportPreviewRowDto] })
  async previewImport(@TenantId() tenantId: string, @Body() dto: PreviewImportDto): Promise<ImportPreviewRowDto[]> {
    return (await this.importer.preview(tenantId, toUploadedFiles(dto.files))).map(toImportPreviewRowDto);
  }

  /** Import FatturaPA XML files issued elsewhere, loose or in ZIP archives (declared before ':id' routes). */
  @Post('import')
  @ApiCreatedResponse({ type: [ImportResultDto] })
  async importXml(@TenantId() tenantId: string, @Body() dto: ImportInvoicesDto): Promise<ImportResultDto[]> {
    return (await this.importer.importFiles(tenantId, toUploadedFiles(dto.files), dto.selected)).map(toImportResultDto);
  }

  /** Revenue thresholds of the current year (declared before ':id' routes). */
  @Get('thresholds') thresholds(@TenantId() tenantId: string) { return this.service.thresholds(tenantId); }
  @Get(':id/thresholds') invoiceThresholds(@TenantId() tenantId: string, @Param('id') id: string) { return this.service.thresholds(tenantId, id); }

  /** Years that have at least one invoice (declared before ':id' routes). */
  @Get('years') years(@TenantId() tenantId: string) { return this.service.years(tenantId); }

  @Get() list(@TenantId() tenantId: string, @Query() q: ListInvoicesQuery) { return this.service.list(tenantId, q); }
  @Get(':id') get(@TenantId() tenantId: string, @Param('id') id: string) { return this.service.get(tenantId, id); }
  @Post() create(@TenantId() tenantId: string, @Body() dto: CreateInvoiceDto) { return this.service.create(tenantId, dto); }
  @Put(':id') update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) { return this.service.update(tenantId, id, dto); }
  @Delete(':id') @HttpCode(204) remove(@TenantId() tenantId: string, @Param('id') id: string) { return this.service.remove(tenantId, id); }

  @Post(':id/issue')
  issue(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: IssueInvoiceDto) {
    return this.service.issue(tenantId, id, dto);
  }

  @Get(':id/xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async xml(@TenantId() tenantId: string, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { fileName, content } = await this.service.xml(tenantId, id);
    res.setHeader('Content-Disposition', attachment(fileName));
    return content;
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(@TenantId() tenantId: string, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { fileName, content } = await this.service.pdf(tenantId, id);
    res.setHeader('Content-Disposition', attachment(fileName));
    return new StreamableFile(Buffer.from(content));
  }

  @Get(':id/preview')
  preview(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.preview(tenantId, id);
  }
}
