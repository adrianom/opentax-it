import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';

/** Due date of the balance and first advance: which of the rule set's dates to use. */
export const PLAN_STARTS = ['ORDINARY', 'EXTENDED', 'DEFERRED', 'DEFERRED_EXTENDED'] as const;
export type PlanStart = (typeof PLAN_STARTS)[number];

export class PlanOptionsDto {
  @IsIn(PLAN_STARTS) start!: PlanStart;
  /** 1 = single payment; the maximum depends on the first due date (up to 16 December). */
  @IsInt() @Min(1) installments!: number;
}

export const F24_STATUSES = ['PLANNED', 'SCHEDULED_I24', 'PAID', 'CANCELLED'] as const;

export class UpdateF24StatusDto {
  @IsIn(F24_STATUSES) status!: (typeof F24_STATUSES)[number];
  @IsOptional() @IsDateString() paidOn?: string;
}
