import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorAlert } from '@/components/error-alert';
import { Field } from '@/components/field';
import { HelpTip } from '@/components/help-tip';
import { NativeSelect } from '@/components/native-select';
import { NoTenant } from '@/components/no-tenant';
import { createPlan, deletePlan } from '@/lib/actions';
import { api, ApiError, currentTenantId, fetchOrNull, formatDate, formatMoney, type PlanOptions, type PlanPreview, type PlanStart } from '@/lib/api';
import { F24Card } from './f24-card';

const START_LABELS: Record<PlanStart, string> = {
  ORDINARY: 'Scadenza ordinaria',
  EXTENDED: 'Proroga dell’anno (forfettari/ISA)',
  DEFERRED: 'Differimento di 30 giorni (+0,40%)',
  DEFERRED_EXTENDED: 'Differimento di 30 giorni dalla proroga',
};

function startLabel(o: PlanOptions['starts'][number]): string {
  const base = START_LABELS[o.start];
  const surcharge = o.surchargePct ? ` (+${o.surchargePct.toLocaleString('it-IT')}%)` : '';
  return `${formatDate(o.date)} — ${o.start.startsWith('DEFERRED') ? base.replace(/ \(\+.*\)$/, '') + surcharge : base}`;
}

function AmountsRow({ label, value, code }: { label: string; value: number | string; code?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-sm">
      <span>{label}{code && <span className="ml-2 font-mono text-xs text-muted-foreground">{code}</span>}</span>
      <span className="font-mono tabular-nums">{formatMoney(value)}</span>
    </div>
  );
}

export default async function F24Page({ searchParams }: PageProps<'/f24'>) {
  if (!(await currentTenantId())) return <NoTenant />;
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const taxYear = Number(params.year ?? new Date().getFullYear() - 1);
  const error = typeof params.error === 'string' ? params.error : undefined;
  const [plan, options, credits] = await Promise.all([fetchOrNull(() => api.plan(taxYear)), fetchOrNull(() => api.planOptions(taxYear)), fetchOrNull(() => api.taxCredits())]);
  const availableCredit = (credits ?? []).reduce((s, c) => s + c.remaining, 0);
  const useCredits = params.useCredits === undefined ? availableCredit > 0 : params.useCredits === 'on';
  const creditOrder = params.creditOrder === 'TAX_FIRST' ? 'TAX_FIRST' : 'INPS_FIRST';

  const start = (typeof params.start === 'string' ? params.start : options?.starts[0]?.start) as PlanStart | undefined;
  const startOpt = options?.starts.find((o) => o.start === start);
  const installments = Math.min(Number(params.installments ?? startOpt?.maxInstallments ?? 1) || 1, startOpt?.maxInstallments ?? 1);
  let preview: PlanPreview | null = null;
  let previewError: string | undefined;
  if (!plan && options && start) {
    try {
      preview = await api.previewPlan(taxYear, { start, installments, useCredits, creditOrder });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      previewError = e.message;
    }
  }

  const forms = plan?.f24s ?? [];
  const next = forms.find((f) => f.status !== 'PAID' && f.status !== 'CANCELLED' && f.paymentDate.slice(0, 10) >= today) ?? forms.find((f) => f.status !== 'PAID' && f.status !== 'CANCELLED');

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">F24 e rate — periodo d&apos;imposta {taxYear}</h1>
          <p className="text-sm text-muted-foreground">Saldo {taxYear} e acconti {taxYear + 1}, versati nel {taxYear + 1}. Deleghe calcolate dal riepilogo imposte: verifica gli importi con chi ti assiste prima di pagare.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/f24?year=${taxYear - 1}`} />}>{taxYear - 1}</Button>
          <Button variant="outline" render={<Link href={`/f24?year=${taxYear + 1}`} />}>{taxYear + 1}</Button>
        </div>
      </div>

      <ErrorAlert message={error ?? previewError} />
      {(plan ? [] : (preview?.warnings ?? options?.warnings ?? [])).length > 0 && (
        <Alert>
          <AlertTitle>Attenzione</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">{(preview?.warnings ?? options?.warnings ?? []).map((w) => <li key={w}>{w}</li>)}</ul>
          </AlertDescription>
        </Alert>
      )}

      {!options && !plan && (
        <Card><CardHeader><CardTitle>Piano non disponibile</CardTitle><CardDescription>Serve un set di regole attivo per il {taxYear + 1} e un profilo con il codice sede INPS.</CardDescription></CardHeader></Card>
      )}

      {plan ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>Piano salvato</CardTitle>
                <CardDescription>
                  Prima scadenza {formatDate(plan.firstDueDate)} · {plan.installments === 1 ? 'unica soluzione' : `${plan.installments} rate mensili`}
                  {Number(plan.surchargePct) > 0 && ` · maggiorazione ${Number(plan.surchargePct).toLocaleString('it-IT')}%`}
                  {Number(plan.creditsUsed) > 0 && ` · crediti compensati ${formatMoney(plan.creditsUsed)}`}
                  {plan.ruleSetVersion && ` · regole ${plan.paymentYear} v${plan.ruleSetVersion}`}
                </CardDescription>
              </div>
              <form action={deletePlan}>
                <input type="hidden" name="taxYear" value={taxYear} />
                <Button type="submit" variant="outline" size="sm">Elimina piano</Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="grid gap-x-8 sm:grid-cols-2">
            <div className="divide-y">
              <AmountsRow label={`Saldo imposta sostitutiva ${taxYear}`} value={plan.taxBalance} code="1792" />
              <AmountsRow label={`Primo acconto imposta ${taxYear + 1}`} value={plan.taxFirstAdvance} code="1790" />
              <AmountsRow label={`Secondo acconto imposta ${taxYear + 1}`} value={plan.taxSecondAdvance} code="1791" />
            </div>
            <div className="divide-y">
              <AmountsRow label={`Saldo INPS ${taxYear}`} value={plan.inpsBalance} code="PXX/PXXR" />
              <AmountsRow label={`Primo acconto INPS ${taxYear + 1}`} value={plan.inpsFirstAdvance} code="PXX/PXXR" />
              <AmountsRow label={`Secondo acconto INPS ${taxYear + 1}`} value={plan.inpsSecondAdvance} code="PXX" />
            </div>
          </CardContent>
        </Card>
      ) : options ? (
        <Card>
          <CardHeader>
            <CardTitle>Nuovo piano di versamento</CardTitle>
            <CardDescription>
              Saldo e primo acconto si possono rateizzare in rate mensili di pari importo entro il 16 dicembre (D.Lgs. 33/2025 art. 10); il secondo acconto del 30 novembre no. Interessi 4% annuo con metodo commerciale sulla seconda rata e +0,33% sulle successive (Istr. Redditi PF, &quot;Rateazione&quot;).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form method="get" className="grid gap-4 sm:grid-cols-3">
              <input type="hidden" name="year" value={taxYear} />
              <Field label="Prima scadenza" htmlFor="start" help={<HelpTip><p>Ordinaria 30 giugno; con la proroga dell&apos;anno, se prevista per i forfettari; oppure entro 30 giorni con maggiorazione dello 0,40% (art. 17 c. 2 DPR 435/2001), applicata prima di rateizzare.</p></HelpTip>}>
                <NativeSelect id="start" name="start" defaultValue={start}>
                  {options.starts.map((o) => <option key={o.start} value={o.start}>{startLabel(o)}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Numero di rate" htmlFor="installments" help={<HelpTip><p>1 = unica soluzione (rateazione 0101 sull&apos;F24). Il massimo dipende dalla prima scadenza: rate al 16 di ogni mese fino al 16 dicembre; quelle tra il 1 e il 20 agosto slittano al 20 agosto (art. 11).</p></HelpTip>}>
                <NativeSelect id="installments" name="installments" defaultValue={installments}>
                  {Array.from({ length: startOpt?.maxInstallments ?? 1 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n === 1 ? 'Unica soluzione' : `${n} rate`}</option>)}
                </NativeSelect>
              </Field>
              {availableCredit > 0 && (
                <>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <Checkbox name="useCredits" defaultChecked={useCredits} /> Usa i crediti disponibili ({formatMoney(availableCredit)}) in un modello a saldo zero
                    <HelpTip><p>Istr. Redditi PF 2026 Fasc. 1 §8 e Avvertenze F24 &quot;Compensazione e rateazione&quot;: un primo modello a saldo zero con i crediti (rateazione 0101) e un secondo con la prima rata del debito residuo. Il modello con compensazione si trasmette solo con i servizi telematici AdE; sopra 5.000 € annui serve il visto di conformità. I crediti si gestiscono in <Link href="/credits" className="underline">Crediti</Link>.</p></HelpTip>
                  </label>
                  <Field label="Compensa prima" htmlFor="creditOrder" help={<HelpTip><p>Le istruzioni non impongono un ordine: è una scelta del contribuente. Nei modelli reali visti i crediti IRPEF coprivano il saldo INPS.</p></HelpTip>}>
                    <NativeSelect id="creditOrder" name="creditOrder" defaultValue={creditOrder}>
                      <option value="INPS_FIRST">Saldo INPS, poi acconto INPS, poi imposta</option>
                      <option value="TAX_FIRST">Saldo imposta, poi acconto imposta, poi INPS</option>
                    </NativeSelect>
                  </Field>
                </>
              )}
              <div className="flex items-end"><Button type="submit" variant="outline">Aggiorna anteprima</Button></div>
            </form>

            {preview && (
              <>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div className="divide-y">
                    <AmountsRow label={`Saldo imposta sostitutiva ${taxYear}`} value={preview.amounts.taxBalance} code="1792" />
                    <AmountsRow label={`Primo acconto imposta ${taxYear + 1}`} value={preview.amounts.taxFirstAdvance} code="1790" />
                    <AmountsRow label={`Secondo acconto imposta ${taxYear + 1}`} value={preview.amounts.taxSecondAdvance} code="1791" />
                  </div>
                  <div className="divide-y">
                    <AmountsRow label={`Saldo INPS ${taxYear}`} value={preview.amounts.inpsBalance} code={installments > 1 ? 'PXXR' : 'PXX'} />
                    <AmountsRow label={`Primo acconto INPS ${taxYear + 1}`} value={preview.amounts.inpsFirstAdvance} code={installments > 1 ? 'PXXR' : 'PXX'} />
                    <AmountsRow label={`Secondo acconto INPS ${taxYear + 1}`} value={preview.amounts.inpsSecondAdvance} code="PXX" />
                  </div>
                </div>
                {(preview.credits.tax > 0 || preview.credits.inps > 0) && (
                  <p className="text-sm text-muted-foreground">
                    Crediti non inclusi nelle deleghe: imposta {formatMoney(preview.credits.tax)} (LM47), INPS {formatMoney(preview.credits.inps)} (RR8). La compensazione in F24 sarà gestita dal modulo compensazioni.
                  </p>
                )}
                {preview.compensation.used > 0 && (
                  <p className="text-sm">
                    Crediti usati nel modello a saldo zero: <span className="font-mono">{formatMoney(preview.compensation.used)}</span>
                    {preview.compensation.unused > 0 && <> · residuo non usato {formatMoney(preview.compensation.unused)}</>}. Importi rateizzati al netto dei crediti.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Sede INPS {preview.inpsOfficeCode} dal profilo.{' '}
                  {preview.forms.length === 0
                    ? `Nulla da versare: nessun saldo o acconto a debito per il ${taxYear} (servono incassi registrati nel ${taxYear}).`
                    : `${preview.forms.length} deleghe: totale ${formatMoney(preview.forms.reduce((s, f) => s + Number(f.totalDebit), 0))}.`}
                </p>
                <form action={createPlan}>
                  <input type="hidden" name="taxYear" value={taxYear} />
                  <input type="hidden" name="start" value={preview.start} />
                  <input type="hidden" name="installments" value={preview.installments} />
                  <input type="hidden" name="useCredits" value={useCredits ? 'true' : 'false'} />
                  <input type="hidden" name="creditOrder" value={preview.compensation.order} />
                  <Button type="submit" disabled={preview.forms.length === 0 || preview.rulesYear !== taxYear + 1}>Salva piano</Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        {plan
          ? forms.map((f) => <F24Card key={f.id} f={f} taxYear={taxYear} highlight={next?.id === f.id} />)
          : (preview?.forms ?? []).map((f, i) => <F24Card key={`${f.kind}-${f.paymentDate}-${i}`} f={f} taxYear={taxYear} />)}
      </section>
    </main>
  );
}
