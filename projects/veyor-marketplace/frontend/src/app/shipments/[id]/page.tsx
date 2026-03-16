import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { fetchShipmentTimeline } from '@/lib/api/shipments';
import { ShipmentTimeline } from '@/components/shipment/ShipmentTimeline';

interface Props {
  params: { id: string };
}

/**
 * Shipment detail page — React Server Component.
 * Fetches timeline server-side; no client bundle impact.
 */
export default async function ShipmentDetailPage({ params }: Props) {
  const token = cookies().get('auth-token')?.value ?? '';

  let timeline;
  try {
    timeline = await fetchShipmentTimeline(params.id, token);
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      notFound();
    }
    throw err;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Shipment <span className="font-mono text-lg">{params.id}</span>
      </h1>

      <section className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">Status Timeline</h2>
        <ShipmentTimeline shipmentId={params.id} events={timeline.events} />
      </section>
    </main>
  );
}

export function generateMetadata({ params }: Props) {
  return { title: `Shipment ${params.id} — Veyor` };
}
