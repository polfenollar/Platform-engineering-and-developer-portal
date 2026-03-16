package com.veyor.marketplace.modules.shipment.dto;

import java.time.Instant;

/**
 * Immutable DTO representing a single status event on a shipment's timeline.
 * Uses Java 21 record — no setters, no boilerplate (CODING_STANDARDS.md).
 */
public record ShipmentTimelineEvent(
        String status,
        String description,
        Instant occurredAt,
        String location
) {}
