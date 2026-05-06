import { Suspense } from "react";
import Dashboard from "./Dashboard";

export const metadata = {
  title: "Your Gulp cupboard",
};

export const dynamic = "force-dynamic";

/**
 * Dashboard landing: the authed user's listings + bids in tabs.
 *
 * Rendering is deferred to the client component because everything here
 * depends on the auth cookie and the cached user; doing it server-side
 * would require forwarding cookies through `fetch` and we already pay for
 * that via the client API calls.
 */
export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Suspense fallback={<div className="h-64" />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
