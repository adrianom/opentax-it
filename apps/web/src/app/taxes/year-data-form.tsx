'use client';

import { useActionState } from 'react';
import { saveTaxYearData } from '@/lib/actions';
import type { TaxSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/field';
import { ErrorAlert } from '@/components/error-alert';
import { HelpTip } from '@/components/help-tip';

export function YearDataForm({ year, input }: { year: number; input: TaxSummary['input'] }) {
  const [state, action, pending] = useActionState(saveTaxYearData, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <ErrorAlert message={state?.error} />
      <input type="hidden" name="year" value={year} />
      <Field label={`Contributi INPS versati nel ${year}`} htmlFor="contributionsPaid" help={<HelpTip><p>Deducibili per intero dal reddito forfettario, nel limite della capienza (L. 190/2014 art. 1 c. 64; rigo LM35). Contano i contributi <em>pagati</em> nell&apos;anno: saldo dell&apos;anno prima e acconti dell&apos;anno.</p></HelpTip>}>
        <Input id="contributionsPaid" name="contributionsPaid" type="number" step="0.01" defaultValue={input.contributionsPaid} />
      </Field>
      <Field label={`Acconti imposta sostitutiva versati per il ${year}`} htmlFor="taxAdvancesPaid" help={<HelpTip><p>Codici tributo 1790 e 1791, al netto di maggiorazioni e interessi (rigo LM45 col. 2).</p></HelpTip>}>
        <Input id="taxAdvancesPaid" name="taxAdvancesPaid" type="number" step="0.01" defaultValue={input.taxAdvancesPaid} />
      </Field>
      <Field label={`Acconti INPS versati per il ${year}`} htmlFor="inpsAdvancesPaid" help={<HelpTip><p>Causale PXX/PXXR con periodo di riferimento {year} (rigo RR5 col. 16).</p></HelpTip>}>
        <Input id="inpsAdvancesPaid" name="inpsAdvancesPaid" type="number" step="0.01" defaultValue={input.inpsAdvancesPaid} />
      </Field>
      <Field label="Crediti d'imposta e ritenute da scomputare" htmlFor="taxCredits" help={<HelpTip><p>Righi LM40 e LM41. Normalmente zero per un forfettario.</p></HelpTip>}>
        <Input id="taxCredits" name="taxCredits" type="number" step="0.01" defaultValue={input.taxCredits} />
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><Checkbox name="inpsReducedRate" defaultChecked={input.inpsRatePct === 24} /> Pensionato o assicurato presso altra forma obbligatoria (aliquota INPS 24% invece di 26,07%)</label>
      <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? 'Salvataggio…' : 'Salva e ricalcola'}</Button></div>
    </form>
  );
}
