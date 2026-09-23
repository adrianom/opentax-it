import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from '../customer-form';

export default function NewCustomerPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <Card>
        <CardHeader><CardTitle>Nuovo cliente</CardTitle></CardHeader>
        <CardContent><CustomerForm /></CardContent>
      </Card>
    </main>
  );
}
