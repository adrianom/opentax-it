-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'TENANT_ADMIN', 'TENANT_USER');

-- CreateEnum
CREATE TYPE "CustomerKind" AS ENUM ('IT_B2B', 'IT_B2C', 'IT_PA', 'UE', 'EXTRA_UE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TD01', 'TD04', 'TD05', 'TD06');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'DELIVERED', 'NOT_DELIVERED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VatNature" AS ENUM ('N2_1', 'N2_2');

-- CreateEnum
CREATE TYPE "SdiChannel" AS ENUM ('PEC');

-- CreateEnum
CREATE TYPE "SdiTransmissionStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED_BY_PEC', 'DELIVERED_TO_SDI', 'SDI_DELIVERED', 'SDI_NOT_DELIVERED', 'SDI_REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "RuleSetStatus" AS ENUM ('DRAFT', 'PROPOSED', 'ACTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "RuleSourceKind" AS ENUM ('PDF', 'HTML', 'JSON', 'XLS');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaxReturnStatus" AS ENUM ('DRAFT', 'FILED');

-- CreateEnum
CREATE TYPE "TaxCreditKind" AS ENUM ('IMPOSTA_SOSTITUTIVA', 'INPS');

-- CreateEnum
CREATE TYPE "InstallmentPlanKind" AS ENUM ('IMPOSTA_SALDO', 'IMPOSTA_ACCONTO1', 'INPS_SALDO', 'INPS_ACCONTO1');

-- CreateEnum
CREATE TYPE "F24Kind" AS ENUM ('SALDO', 'ACCONTO1', 'ACCONTO2', 'RATA', 'BOLLO', 'AVVISO', 'ALTRO');

-- CreateEnum
CREATE TYPE "F24Status" AS ENUM ('PLANNED', 'SCHEDULED_I24', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "F24Section" AS ENUM ('ERARIO', 'INPS');

-- CreateEnum
CREATE TYPE "DeadlineKind" AS ENUM ('IMPOSTA_SALDO', 'IMPOSTA_ACCONTO1', 'IMPOSTA_ACCONTO2', 'INPS_SALDO', 'INPS_ACCONTO1', 'INPS_ACCONTO2', 'RATA', 'BOLLO', 'DICHIARAZIONE', 'INTRASTAT', 'IVA_ESTERO', 'AVVISO', 'ALTRO');

-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('OPEN', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaxNoticeKind" AS ENUM ('COMUNICAZIONE_IRREGOLARITA', 'AVVISO_TELEMATICO', 'CARTELLA', 'BOLLO_FE', 'CONTROLLO_FORMALE', 'ALTRO');

-- CreateEnum
CREATE TYPE "TaxNoticeStatus" AS ENUM ('RECEIVED', 'CIVIS_REQUESTED', 'PAID', 'INSTALLMENTS', 'CLOSED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TENANT_USER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "denominazione" TEXT,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "partitaIva" TEXT NOT NULL,
    "codiceAteco" TEXT NOT NULL,
    "codiceAteco2025" TEXT,
    "indirizzo" TEXT NOT NULL,
    "cap" TEXT NOT NULL,
    "comune" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "nazione" TEXT NOT NULL DEFAULT 'IT',
    "annoInizioAttivita" INTEGER NOT NULL,
    "aliquotaRidotta" BOOLEAN NOT NULL DEFAULT false,
    "applicaRivalsaInps" BOOLEAN NOT NULL DEFAULT false,
    "iscrittoVies" BOOLEAN NOT NULL DEFAULT false,
    "pecAddress" TEXT,
    "pecCredentialsEnc" TEXT,
    "sdiPecAssigned" TEXT,
    "ibanEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "CustomerKind" NOT NULL,
    "denominazione" TEXT,
    "nome" TEXT,
    "cognome" TEXT,
    "partitaIva" TEXT,
    "codiceFiscale" TEXT,
    "idPaese" TEXT NOT NULL DEFAULT 'IT',
    "indirizzo" TEXT NOT NULL,
    "cap" TEXT,
    "comune" TEXT NOT NULL,
    "provincia" TEXT,
    "nazione" TEXT NOT NULL DEFAULT 'IT',
    "codiceDestinatario" TEXT NOT NULL DEFAULT '0000000',
    "pecDestinatario" TEXT,
    "valuta" TEXT NOT NULL DEFAULT 'EUR',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tipo" "DocumentType" NOT NULL DEFAULT 'TD01',
    "anno" INTEGER NOT NULL,
    "progressivo" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "valuta" TEXT NOT NULL DEFAULT 'EUR',
    "cambio" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "natura" "VatNature" NOT NULL DEFAULT 'N2_2',
    "imponibile" DECIMAL(14,2) NOT NULL,
    "rivalsaInps" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "bolloVirtuale" BOOLEAN NOT NULL DEFAULT false,
    "importoBollo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totale" DECIMAL(14,2) NOT NULL,
    "causali" TEXT[],
    "stato" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "refInvoiceId" TEXT,
    "xmlFileName" TEXT,
    "xmlPath" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "numeroLinea" INTEGER NOT NULL,
    "descrizione" TEXT NOT NULL,
    "quantita" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "unitaMisura" TEXT,
    "prezzoUnitario" DECIMAL(14,4) NOT NULL,
    "prezzoTotale" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "importo" DECIMAL(14,2) NOT NULL,
    "importoEur" DECIMAL(14,2) NOT NULL,
    "cambio" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "metodo" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdiTransmission" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "canale" "SdiChannel" NOT NULL DEFAULT 'PEC',
    "fileName" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "pecMessageId" TEXT,
    "stato" "SdiTransmissionStatus" NOT NULL DEFAULT 'PENDING',
    "identificativoSdi" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SdiTransmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdiNotification" (
    "id" TEXT NOT NULL,
    "transmissionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "identificativoSdi" TEXT,
    "fileName" TEXT,
    "rawPath" TEXT,
    "dettaglio" JSONB,

    CONSTRAINT "SdiNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StampDutyPeriod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "importoCalcolato" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "importoDovuto" DECIMAL(14,2),
    "scadenza" DATE NOT NULL,
    "scadenzaEffettiva" DATE,
    "f24Id" TEXT,
    "pagatoIl" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StampDutyPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalRuleSet" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RuleSetStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "sourceRefs" JSONB NOT NULL,
    "notes" TEXT,
    "activatedAt" TIMESTAMP(3),
    "activatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "RuleSourceKind" NOT NULL,
    "parser" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "checkIntervalHours" INTEGER NOT NULL DEFAULT 168,
    "lastHash" TEXT,
    "lastModified" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "lastSnapshotPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleChangeProposal" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetYear" INTEGER NOT NULL,
    "ruleSetId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotBeforePath" TEXT,
    "snapshotAfterPath" TEXT,
    "diff" TEXT,
    "extractedValues" JSONB NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,

    CONSTRAINT "RuleChangeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxReturn" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "ricaviIncassati" DECIMAL(14,2) NOT NULL,
    "coefficiente" DECIMAL(5,2) NOT NULL,
    "redditoLordo" DECIMAL(14,2) NOT NULL,
    "contributiVersati" DECIMAL(14,2) NOT NULL,
    "contributiDedotti" DECIMAL(14,2) NOT NULL,
    "redditoNetto" DECIMAL(14,2) NOT NULL,
    "aliquota" DECIMAL(5,2) NOT NULL,
    "impostaSostitutiva" DECIMAL(14,2) NOT NULL,
    "eccedenzaPrecedente" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "eccedenzaCompensata" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "accontiVersati" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "impostaDebito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "impostaCredito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "inpsImponibile" DECIMAL(14,2) NOT NULL,
    "inpsAliquota" DECIMAL(5,2) NOT NULL,
    "inpsContributoDovuto" DECIMAL(14,2) NOT NULL,
    "inpsAccontiVersati" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "inpsDebito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "inpsCredito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "accontoImpostaDovuto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "accontoInpsDovuto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "ruleSetVersion" INTEGER,
    "stato" "TaxReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "filedAt" DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCredit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taxReturnId" TEXT,
    "kind" "TaxCreditKind" NOT NULL,
    "annoRiferimento" INTEGER NOT NULL,
    "importo" DECIMAL(14,2) NOT NULL,
    "utilizzabileDal" DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCreditUsage" (
    "id" TEXT NOT NULL,
    "taxCreditId" TEXT NOT NULL,
    "f24LineId" TEXT NOT NULL,
    "importo" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCreditUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallmentPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "annoVersamento" INTEGER NOT NULL,
    "annoImposta" INTEGER NOT NULL,
    "kind" "InstallmentPlanKind" NOT NULL,
    "importo" DECIMAL(14,2) NOT NULL,
    "primaRata" DATE NOT NULL,
    "numeroRate" INTEGER NOT NULL,
    "maggiorazionePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "F24" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "F24Kind" NOT NULL,
    "dataVersamento" DATE NOT NULL,
    "stato" "F24Status" NOT NULL DEFAULT 'PLANNED',
    "planId" TEXT,
    "rataNumero" INTEGER,
    "rateTotali" INTEGER,
    "totaleDebito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totaleCredito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "i24ScheduledAt" TIMESTAMP(3),
    "i24CancelBy" DATE,
    "paidAt" DATE,
    "taxNoticeId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "F24_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "F24Line" (
    "id" TEXT NOT NULL,
    "f24Id" TEXT NOT NULL,
    "sezione" "F24Section" NOT NULL,
    "codice" TEXT NOT NULL,
    "codiceSede" TEXT,
    "rateazione" TEXT,
    "periodoDa" TEXT,
    "periodoA" TEXT,
    "annoRiferimento" INTEGER NOT NULL,
    "importoDebito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "importoCredito" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "F24Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "DeadlineKind" NOT NULL,
    "data" DATE NOT NULL,
    "descrizione" TEXT NOT NULL,
    "importoStimato" DECIMAL(14,2),
    "stato" "DeadlineStatus" NOT NULL DEFAULT 'OPEN',
    "f24Id" TEXT,
    "ruleSetVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxNotice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "TaxNoticeKind" NOT NULL,
    "numero" TEXT,
    "annoImposta" INTEGER,
    "dataRicezione" DATE NOT NULL,
    "importo" DECIMAL(14,2),
    "scadenza" DATE,
    "stato" "TaxNoticeStatus" NOT NULL DEFAULT 'RECEIVED',
    "civisRequestId" TEXT,
    "civisRequestedAt" DATE,
    "esito" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantProfile_tenantId_key" ON "TenantProfile"("tenantId");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_data_idx" ON "Invoice"("tenantId", "data");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tenantId_anno_tipo_progressivo_key" ON "Invoice"("tenantId", "anno", "tipo", "progressivo");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceLine_invoiceId_numeroLinea_key" ON "InvoiceLine"("invoiceId", "numeroLinea");

-- CreateIndex
CREATE INDEX "Payment_tenantId_data_idx" ON "Payment"("tenantId", "data");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "SdiTransmission_invoiceId_idx" ON "SdiTransmission"("invoiceId");

-- CreateIndex
CREATE INDEX "SdiNotification_transmissionId_idx" ON "SdiNotification"("transmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "StampDutyPeriod_tenantId_anno_trimestre_key" ON "StampDutyPeriod"("tenantId", "anno", "trimestre");

-- CreateIndex
CREATE INDEX "FiscalRuleSet_year_status_idx" ON "FiscalRuleSet"("year", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalRuleSet_year_version_key" ON "FiscalRuleSet"("year", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RuleSource_url_key" ON "RuleSource"("url");

-- CreateIndex
CREATE INDEX "RuleChangeProposal_status_targetYear_idx" ON "RuleChangeProposal"("status", "targetYear");

-- CreateIndex
CREATE UNIQUE INDEX "TaxReturn_tenantId_anno_key" ON "TaxReturn"("tenantId", "anno");

-- CreateIndex
CREATE INDEX "TaxCredit_tenantId_kind_annoRiferimento_idx" ON "TaxCredit"("tenantId", "kind", "annoRiferimento");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCreditUsage_f24LineId_key" ON "TaxCreditUsage"("f24LineId");

-- CreateIndex
CREATE INDEX "TaxCreditUsage_taxCreditId_idx" ON "TaxCreditUsage"("taxCreditId");

-- CreateIndex
CREATE INDEX "InstallmentPlan_tenantId_annoVersamento_idx" ON "InstallmentPlan"("tenantId", "annoVersamento");

-- CreateIndex
CREATE INDEX "F24_tenantId_dataVersamento_idx" ON "F24"("tenantId", "dataVersamento");

-- CreateIndex
CREATE INDEX "F24Line_f24Id_idx" ON "F24Line"("f24Id");

-- CreateIndex
CREATE INDEX "Deadline_tenantId_data_idx" ON "Deadline"("tenantId", "data");

-- CreateIndex
CREATE INDEX "TaxNotice_tenantId_dataRicezione_idx" ON "TaxNotice"("tenantId", "dataRicezione");

-- CreateIndex
CREATE INDEX "Attachment_tenantId_entityType_entityId_idx" ON "Attachment"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantProfile" ADD CONSTRAINT "TenantProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_refInvoiceId_fkey" FOREIGN KEY ("refInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdiTransmission" ADD CONSTRAINT "SdiTransmission_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdiNotification" ADD CONSTRAINT "SdiNotification_transmissionId_fkey" FOREIGN KEY ("transmissionId") REFERENCES "SdiTransmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StampDutyPeriod" ADD CONSTRAINT "StampDutyPeriod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StampDutyPeriod" ADD CONSTRAINT "StampDutyPeriod_f24Id_fkey" FOREIGN KEY ("f24Id") REFERENCES "F24"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalRuleSet" ADD CONSTRAINT "FiscalRuleSet_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleChangeProposal" ADD CONSTRAINT "RuleChangeProposal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RuleSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleChangeProposal" ADD CONSTRAINT "RuleChangeProposal_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "FiscalRuleSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleChangeProposal" ADD CONSTRAINT "RuleChangeProposal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxReturn" ADD CONSTRAINT "TaxReturn_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCredit" ADD CONSTRAINT "TaxCredit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCredit" ADD CONSTRAINT "TaxCredit_taxReturnId_fkey" FOREIGN KEY ("taxReturnId") REFERENCES "TaxReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCreditUsage" ADD CONSTRAINT "TaxCreditUsage_taxCreditId_fkey" FOREIGN KEY ("taxCreditId") REFERENCES "TaxCredit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCreditUsage" ADD CONSTRAINT "TaxCreditUsage_f24LineId_fkey" FOREIGN KEY ("f24LineId") REFERENCES "F24Line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F24" ADD CONSTRAINT "F24_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F24" ADD CONSTRAINT "F24_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F24" ADD CONSTRAINT "F24_taxNoticeId_fkey" FOREIGN KEY ("taxNoticeId") REFERENCES "TaxNotice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "F24Line" ADD CONSTRAINT "F24Line_f24Id_fkey" FOREIGN KEY ("f24Id") REFERENCES "F24"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_f24Id_fkey" FOREIGN KEY ("f24Id") REFERENCES "F24"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxNotice" ADD CONSTRAINT "TaxNotice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
