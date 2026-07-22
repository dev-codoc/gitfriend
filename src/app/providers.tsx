// SessionProvider is a React Context provider — it has to be a Client
// Component (Next.js Server Components can't hold React state/context).
// This thin wrapper is the standard pattern: isolate the "use client"
// boundary to one small file instead of making your whole layout client-side.
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
