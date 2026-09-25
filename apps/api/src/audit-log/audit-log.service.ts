import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditLogEntry {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  data?: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry, client?: Prisma.TransactionClient): Promise<void> {
    const db = client ?? this.prisma;
    try {
      await db.auditLog.create({
        data: {
          tenantId: entry.tenantId ?? null,
          userId: entry.userId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          data: entry.data ? (entry.data as Prisma.InputJsonValue) : Prisma.DbNull,
        },
      });
    } catch (err) {
      // Audit log errors should never crash the main operation, but must be logged
      this.logger.error(`Failed to write audit log: ${entry.action}`, err);
    }
  }
}
