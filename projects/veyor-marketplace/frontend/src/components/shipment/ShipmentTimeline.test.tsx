import { render, screen } from '@testing-library/react';
import { ShipmentTimeline } from './ShipmentTimeline';
import type { ShipmentTimelineEvent } from '@/lib/api/shipments';

const events: ShipmentTimelineEvent[] = [
  {
    status: 'PICKED_UP',
    description: 'Package picked up from sender',
    occurredAt: '2026-03-10T08:00:00Z',
    location: 'New York, NY',
  },
  {
    status: 'IN_TRANSIT',
    description: 'In transit to destination',
    occurredAt: '2026-03-11T14:00:00Z',
    location: 'Chicago, IL',
  },
  {
    status: 'DELIVERED',
    description: 'Delivered to recipient',
    occurredAt: '2026-03-13T11:30:00Z',
    location: 'Los Angeles, CA',
  },
];

describe('ShipmentTimeline', () => {
  it('renders all events', () => {
    render(<ShipmentTimeline shipmentId="ship-123" events={events} />);
    expect(screen.getByText('Package picked up from sender')).toBeInTheDocument();
    expect(screen.getByText('In transit to destination')).toBeInTheDocument();
    expect(screen.getByText('Delivered to recipient')).toBeInTheDocument();
  });

  it('renders location for each event', () => {
    render(<ShipmentTimeline shipmentId="ship-123" events={events} />);
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    expect(screen.getByText('Chicago, IL')).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<ShipmentTimeline shipmentId="ship-empty" events={[]} />);
    expect(screen.getByText(/No tracking events yet/)).toBeInTheDocument();
  });

  it('has accessible landmark region', () => {
    render(<ShipmentTimeline shipmentId="ship-123" events={events} />);
    expect(screen.getByRole('region', { name: 'Shipment timeline' })).toBeInTheDocument();
  });

  it('renders dates as time elements with dateTime attribute', () => {
    render(<ShipmentTimeline shipmentId="ship-123" events={events} />);
    const timeEls = screen.getAllByRole('time');
    expect(timeEls[0]).toHaveAttribute('dateTime', '2026-03-10T08:00:00Z');
  });
});
