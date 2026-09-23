import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Put, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { TenantId } from '../common/tenant.decorator.js';
import { CreateInvoiceDto, ImportInvoicesDto, IssueInvoiceDto, ListInvoicesQuery, UpdateInvoiceDto } from './invoices.dto.js';
import { InvoicesImportService } from './invoices-import.service.js';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService, private readonly importer: InvoicesImportService) {}

  /** Import FatturaPA XML files issued elsewhere (declared before ':id' routes). */
  @Post('import')
  importXml(@TenantId() tenantId: string, @Body() dto: ImportInvoicesDto) { return this.importer.importFiles(tenantId, dto.files); }

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
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return content;
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(@TenantId() tenantId: string, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { fileName, content } = await this.service.pdf(tenantId, id);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return new StreamableFile(Buffer.from(content));
  }

  @Get(':id/preview')
  preview(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.preview(tenantId, id);
  }
}
