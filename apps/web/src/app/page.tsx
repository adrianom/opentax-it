import { redirect } from 'next/navigation';
import { currentSessionToken } from '@/lib/api';

export default async function HomePage() {
  const token = await currentSessionToken();
  if (token) {
    redirect('/dashboard');
  }
  redirect('/login');
}
