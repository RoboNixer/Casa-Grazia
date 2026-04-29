'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Molimo ispunite sva polja'));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const authErrorMap: Record<string, string> = {
      'Invalid login credentials': 'Neispravni podaci za prijavu.',
      'Email not confirmed': 'E-mail adresa nije potvrđena.',
      'Too many requests': 'Previše pokušaja. Molimo pričekajte.',
      'User not found': 'Korisnik nije pronađen.',
    };
    const message = authErrorMap[error.message] ?? 'Greška pri prijavi. Molimo pokušajte ponovo.';
    redirect('/login?error=' + encodeURIComponent(message));
  }

  redirect('/admin');
}
