package com.veyor.marketplace.modules.shipment;

import com.veyor.marketplace.modules.shipment.dto.ShipmentTimelineResponse;
import com.veyor.marketplace.modules.shipment.service.ShipmentEventRepository;
import com.veyor.marketplace.modules.shipment.service.ShipmentRepository;
import com.veyor.marketplace.modules.shipment.service.ShipmentTimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipmentTimelineServiceTest {

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private ShipmentEventRepository eventRepository;

    private ShipmentTimelineService service;

    @BeforeEach
    void setUp() {
        service = new ShipmentTimelineService(shipmentRepository, eventRepository);
    }

    @Test
    @DisplayName("returns ordered timeline events for a valid shipment")
    void returnsOrderedEventsForValidShipment() {
        var shipmentId = "ship-abc-123";
        var event1 = fakeEvent("PICKED_UP", Instant.parse("2026-03-10T08:00:00Z"), "NYC");
        var event2 = fakeEvent("IN_TRANSIT", Instant.parse("2026-03-11T14:00:00Z"), "Chicago");

        when(shipmentRepository.existsById(shipmentId)).thenReturn(true);
        when(eventRepository.findByShipmentIdOrderByOccurredAtAsc(shipmentId))
                .thenReturn(List.of(event1, event2));

        ShipmentTimelineResponse result = service.getTimeline(shipmentId, "user@veyor.io");

        assertThat(result.shipmentId()).isEqualTo(shipmentId);
        assertThat(result.events()).hasSize(2);
        assertThat(result.events().get(0).status()).isEqualTo("PICKED_UP");
        assertThat(result.events().get(1).status()).isEqualTo("IN_TRANSIT");
    }

    @Test
    @DisplayName("returns empty timeline when no events exist yet")
    void returnsEmptyTimelineWhenNoEvents() {
        var shipmentId = "ship-new-001";
        when(shipmentRepository.existsById(shipmentId)).thenReturn(true);
        when(eventRepository.findByShipmentIdOrderByOccurredAtAsc(shipmentId))
                .thenReturn(List.of());

        ShipmentTimelineResponse result = service.getTimeline(shipmentId, "user@veyor.io");

        assertThat(result.events()).isEmpty();
    }

    @Test
    @DisplayName("throws NoSuchElementException when shipment not found")
    void throwsWhenShipmentNotFound() {
        when(shipmentRepository.existsById("ghost-id")).thenReturn(false);

        assertThatThrownBy(() -> service.getTimeline("ghost-id", "user@veyor.io"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("ghost-id");

        verifyNoInteractions(eventRepository);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static ShipmentEvent fakeEvent(String status, Instant occurredAt, String location) {
        var e = new ShipmentEvent();
        e.setStatus(status);
        e.setDescription("Event: " + status);
        e.setOccurredAt(occurredAt);
        e.setLocation(location);
        return e;
    }
}
