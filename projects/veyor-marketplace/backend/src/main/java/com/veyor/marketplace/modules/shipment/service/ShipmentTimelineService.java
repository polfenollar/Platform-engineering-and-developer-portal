package com.veyor.marketplace.modules.shipment.service;

import com.veyor.marketplace.modules.shipment.dto.ShipmentTimelineEvent;
import com.veyor.marketplace.modules.shipment.dto.ShipmentTimelineResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Business logic for shipment timeline retrieval.
 *
 * <p>Architecture guardrail (ARCHITECTURE_VEYOR.md):
 * <ul>
 *   <li>All business logic lives here, NOT in the controller.</li>
 *   <li>Module owns its own data; no cross-module JOINs.</li>
 *   <li>Cache TTL ≤ 5 min (Redis, via @Cacheable).</li>
 * </ul>
 */
@Service
public class ShipmentTimelineService {

    private static final Logger log = LoggerFactory.getLogger(ShipmentTimelineService.class);

    private final ShipmentRepository shipmentRepository;  // owns shipment table
    private final ShipmentEventRepository eventRepository; // owns shipment_events table

    public ShipmentTimelineService(
            ShipmentRepository shipmentRepository,
            ShipmentEventRepository eventRepository
    ) {
        this.shipmentRepository = shipmentRepository;
        this.eventRepository = eventRepository;
    }

    /**
     * Returns all status events for a shipment, ordered oldest → newest.
     *
     * @param shipmentId  UUID of the shipment
     * @param requesterId entity ref of the requesting user (for audit)
     * @return ordered timeline response
     * @throws NoSuchElementException if shipmentId does not exist
     */
    @Cacheable(value = "shipment-timeline", key = "#shipmentId")
    public ShipmentTimelineResponse getTimeline(String shipmentId, String requesterId) {
        log.info("Fetching timeline for shipment={} requester={}", shipmentId, requesterId);

        if (!shipmentRepository.existsById(shipmentId)) {
            throw new NoSuchElementException("Shipment not found: " + shipmentId);
        }

        List<ShipmentTimelineEvent> events = eventRepository
                .findByShipmentIdOrderByOccurredAtAsc(shipmentId)
                .stream()
                .map(e -> new ShipmentTimelineEvent(
                        e.getStatus(),
                        e.getDescription(),
                        e.getOccurredAt(),
                        e.getLocation()
                ))
                .toList();

        log.info("Timeline returned events={} for shipment={}", events.size(), shipmentId);
        return new ShipmentTimelineResponse(shipmentId, events);
    }
}
