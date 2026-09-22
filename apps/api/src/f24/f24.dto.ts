import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';

/** Due date of the balance and first advance: which of the rule set's dates to use. */
export const PLAN_STARTS = ['ORDINARY', 'EXTENDED', 'DEFERRED', 'DEFERRED_EXTENDED'] as const;
export type PlanStart = (typeof PLAN_STARTS)[number];

export const COMPENSATION_ORDERS = ['INPS_FIRST', 'TAX_FIRST'] as const;

export class PlanOptionsDto {
  @IsIn(PLAN_STARTS) start!: PlanStart;
  /** 1 = single payment; the maximum depends on the first due date (up to 16 December). */
  @IsInt() @Min(1) installments!: number;
  /** Use the available credits in a zero-balance form before splitting the residual. */
  @IsOptional() @IsBoolean() useCredits?: boolean;
  /** Which debts the credits cover first (the taxpayer's choice). */
  @IsOptional() @IsIn(COMPENSATION_ORDERS) creditOrder?: (typeof COMPENSATION_ORDERS)[number];
}

export const F24_STATUSES = ['PLANNED', 'SCHEDULED_I24', 'PAID', 'CANCELLED'] as const;

export class UpdateF24StatusDto {
  @IsIn(F24_STATUSES) status!: (typeof F24_STATUSES)[number];
  @IsOptional() @IsDateString() paidOn?: string;
}
