import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const cookieStore = request.cookies;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Not setting cookies in POST route - will be handled by response
        },
        remove(name: string, options: CookieOptions) {
          // Not removing cookies in POST route - will be handled by response
        },
      },
    }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/', request.url));
}
