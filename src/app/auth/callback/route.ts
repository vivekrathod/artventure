import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOrCreateProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';

  if (code) {
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
            // Not setting cookies in GET route - will be set by middleware
          },
          remove(name: string, options: CookieOptions) {
            // Not removing cookies in GET route
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or get user profile
      await getOrCreateProfile(
        data.user.id,
        data.user.email!,
        data.user.user_metadata?.full_name
      );

      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  // If there's an error, redirect to sign in
  return NextResponse.redirect(new URL('/auth/signin', request.url));
}
