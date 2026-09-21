import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-semibold">OpenTax IT</h1>
      <p className="max-w-2xl text-muted-foreground">
        Gestionale open source per partite IVA in regime forfettario: fatture elettroniche, scadenze, rate, INPS,
        compensazioni. Strumento di supporto, non consulenza fiscale.
      </p>
      <div className="flex gap-2">
        <Button render={<Link href="/invoices" />}>Fatture</Button>
        <Button variant="outline" render={<Link href="/customers" />}>Clienti</Button>
        <Button variant="outline" render={<Link href="/deadlines" />}>Scadenzario</Button>
      </div>
    </main>
  );
}
