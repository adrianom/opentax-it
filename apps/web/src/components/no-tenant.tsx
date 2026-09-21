import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NoTenant() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Nessuna partita IVA selezionata</CardTitle>
          <CardDescription>Seleziona o crea la partita IVA da gestire.</CardDescription>
        </CardHeader>
        <CardContent><Button render={<Link href="/setup" />}>Vai alla configurazione</Button></CardContent>
      </Card>
    </main>
  );
}
