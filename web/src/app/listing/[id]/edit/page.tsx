import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import EditForm from "./EditForm";

export const metadata = {
  title: "Edit your listing",
};

export const dynamic = "force-dynamic";

/**
 * Seller edit page.
 *
 * The ownership check is enforced server-side by `PATCH /items/{id}`; this
 * page trusts the API to 403 if someone other than the seller gets here
 * and surfaces a friendly error. The client form also bounces non-owners
 * once it sees the API reject the save.
 */
export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let item;
  try {
    item = await api.item(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
        Edit listing
      </div>
      <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight">
        Refine the cupboard pitch.
      </h1>
      <p className="mt-2 text-[color:var(--muted)]">
        Polish the title, move the price, or upload a better photo. Changes
        are live the moment you hit save.
      </p>
      <div className="mt-6">
        <EditForm item={item} />
      </div>
    </div>
  );
}
