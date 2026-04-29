import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  request.headers.set('x-pathname', request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith('/admin')) {
    return await updateSession(request);
  }

  return NextResponse.next({
    request: { headers: request.headers },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
