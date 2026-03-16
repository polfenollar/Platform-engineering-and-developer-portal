package com.veyor.marketplace.modules.shipment.controller;

import com.veyor.marketplace.modules.shipment.dto.ShipmentTimelineResponse;
import com.veyor.marketplace.modules.shipment.service.ShipmentTimelineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.NoSuchElementException;

/**
 * REST controller for shipment operations.
 *
 * <p>Architecture: controller is thin — no business logic here.
 * All logic lives in {@link ShipmentTimelineService}.
 */
@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentTimelineService timelineService;

    public ShipmentController(ShipmentTimelineService timelineService) {
        this.timelineService = timelineService;
    }

    /**
     * Returns the ordered status timeline for a shipment.
     *
     * <p>Requires the caller to be the shipment owner or an ADMIN
     * (RBAC via Spring Security — ARCHITECTURE_VEYOR.md).
     *
     * @param id          shipment UUID
     * @param userDetails injected by Spring Security
     * @return 200 with timeline, 404 if shipment not found
     */
    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ShipmentTimelineResponse> getTimeline(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            ShipmentTimelineResponse response =
                    timelineService.getTimeline(id, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
