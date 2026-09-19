/**
 * proxy.ts
 *
 * Named `proxy.ts` (not `middleware.ts`) per Next.js 16's own convention --
 * `middleware` is deprecated in favor of `proxy`, same mechanism and same
 * `config.matcher` export, just a rename. Caught by this project's own
 * `npm run build` gate, which is exactly what that gate is for.
 *
 * Retroactive Phase 0 fix, found while testing Phase 0.5's Country
 * Identity screen: Supabase's SSR auth pattern requires this to refresh
 * the session cookie on every request. Without it, a signed-in session
 * can silently fail to persist across navigations -- the
 * getDb()/requireAuth() code in lib/auth/adapter.ts was correct, but had
 * no guarantee the cookie it reads was ever refreshed. This should have
 * been part of Phase 0's adapter-layer scaffold; recorded as a gap in
 * 05-PROGRESS-TRACKER.md rather than silently folded into Phase 0.5.
 *
 * Only touches the `supabase` adapter branch, matching AUTH_PROVIDER --
 * an AWS/Cognito swap later replaces this file's body, not its existence.
 */

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const authProvider = process.env.AUTH_PROVIDER ?? "supabase";
  if (authProvider !== "supabase") {
    // No other provider implemented yet -- see lib/auth/adapter.ts.
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching getUser() is what actually triggers the refresh -- reading
  // the session alone does not.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image optimization
     * files, so it doesn't do unnecessary work on those requests.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
