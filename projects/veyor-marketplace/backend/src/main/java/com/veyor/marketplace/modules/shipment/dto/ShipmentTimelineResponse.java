package com.veyor.marketplace.modules.shipment.dto;

import java.util.List;

/**
 * Response envelope for the shipment timeline endpoint.
 * shipmentId included so callers can correlate async responses.
 */
public record ShipmentTimelineResponse(
        String shipmentId,
        List<ShipmentTimelineEvent> events
) {}
