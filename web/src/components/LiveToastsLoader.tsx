"use client";

import dynamic from "next/dynamic";

/**
 * Client-only shell for activity toasts: ``next/dynamic`` with ``ssr: false``
 * is not allowed in Server Components (e.g. ``app/layout.tsx``), so the lazy
 * import lives here.
 */
const LiveToasts = dynamic(() => import("@/components/LiveToasts"), {
  ssr: false,
});

/**
 * Mount the SSE toast stack after hydration; renders nothing on the server.
 */
export default function LiveToastsLoader() {
  return <LiveToasts />;
}
