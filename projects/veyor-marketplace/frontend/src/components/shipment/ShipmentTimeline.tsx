'use client';

import type { ShipmentTimelineEvent } from '@/lib/api/shipments';

const STATUS_COLORS: Record<string, string> = {
  PICKED_UP: 'bg-blue-500',
  IN_TRANSIT: 'bg-yellow-500',
  OUT_FOR_DELIVERY: 'bg-orange-500',
  DELIVERED: 'bg-green-500',
  EXCEPTION: 'bg-red-500',
};

interface Props {
  shipmentId: string;
  events: ShipmentTimelineEvent[];
}

export function ShipmentTimeline({ shipmentId, events }: Props) {
  if (events.length === 0) {
    return (
      <section aria-label="Shipment timeline" className="py-4 text-gray-500 text-sm">
        No tracking events yet for shipment {shipmentId}.
      </section>
    );
  }

  return (
    <section aria-label="Shipment timeline" className="flow-root">
      <ul role="list" className="-mb-8">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1;
          const dotColor = STATUS_COLORS[event.status] ?? 'bg-gray-400';
          const date = new Date(event.occurredAt);

          return (
            <li key={`${event.occurredAt}-${event.status}`}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${dotColor} ring-8 ring-white`}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                      {event.location && (
                        <p className="text-xs text-gray-500">{event.location}</p>
                      )}
                    </div>
                    <time
                      dateTime={event.occurredAt}
                      className="whitespace-nowrap text-right text-xs text-gray-500"
                    >
                      {date.toLocaleString()}
                    </time>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
