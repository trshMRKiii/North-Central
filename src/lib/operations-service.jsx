import { SHIFTS, TICKET_FEE } from "./constants";
import { format } from "date-fns";

/**
 * OperationsService handles core business logic and data transformations.
 * Decouples domain logic from React components (SRP).
 */
export const OperationsService = {
  getShiftBatchName(dateInput) {
    const date = new Date(dateInput);
    const hour = date.getHours();

    if (hour >= SHIFTS.BATCH_1.startHour && hour < SHIFTS.BATCH_1.endHour) {
      return SHIFTS.BATCH_1.name;
    }
    if (hour >= SHIFTS.BATCH_2.startHour && hour < SHIFTS.BATCH_2.endHour) {
      return SHIFTS.BATCH_2.name;
    }
    return "Other";
  },

  isDriverBusy(driverId, tickets, vehicles) {
    const hasActiveTicket = tickets.some(
      (t) => t.driver?.id === driverId && t.status === "ISSUED",
    );
    const isOnTrip = vehicles.some(
      (v) => v.active_driver === driverId && v.status === "ON_TRIP",
    );
    return hasActiveTicket || isOnTrip;
  },

  isVehicleBusy(vehicleId, tickets) {
    return tickets.some(
      (t) => t.vehicle?.id === vehicleId && t.status === "ISSUED",
    );
  },

  calculateBatchStats(tickets) {
    const activeTickets = tickets.filter((t) => t.status !== "CANCELLED");

    const b1 = activeTickets.filter(
      (t) => this.getShiftBatchName(t.issued_at) === SHIFTS.BATCH_1.name,
    );
    const b2 = activeTickets.filter(
      (t) => this.getShiftBatchName(t.issued_at) === SHIFTS.BATCH_2.name,
    );

    return {
      batch1: {
        total: b1.reduce((sum, t) => sum + Number(t.collection_amount || 0), 0),
        count: b1.filter(t => t.status !== "COLLECTED").length,
        pending: b1.filter((t) => !t.is_verified).length,
      },
      batch2: {
        total: b2.reduce((sum, t) => sum + Number(t.collection_amount || 0), 0),
        count: b2.filter(t => t.status !== "COLLECTED").length,
        pending: b2.filter((t) => !t.is_verified).length,
      },
      totalVerified: activeTickets
        .filter((t) => t.is_verified)
        .reduce((sum, t) => sum + Number(t.collection_amount || 0), 0),
    };
  },

  /**
   * Groups tickets by route and calculates financial summaries for reporting.
   */
  getRouteTallyReport(tickets, vehicles, dateFilter, batchFilter) {
    const filtered = tickets.filter((t) => {
      if (t.status === "CANCELLED") return false;
      const ticketDateStr = t.issued_at.split("T")[0];
      if (ticketDateStr !== dateFilter) return false;

      if (batchFilter !== "ALL") {
        return this.getShiftBatchName(t.issued_at) === batchFilter;
      }
      return true;
    });

    const matrix = {};
    const finance = {};

    // Initialize routes
    const allRoutes = Array.from(new Set(vehicles.map((v) => v.route)));
    allRoutes.forEach((r) => {
      matrix[r] = [];
      finance[r] = { trips: 0, revenue: 0 };
    });

    filtered.forEach((t) => {
      const vehicle = vehicles.find((v) => v.id === t.vehicle?.id);
      if (vehicle) {
        matrix[t.route].push({
          id: t.id,
          unit: vehicle.code,
          plate: vehicle.plate_number,
          time: format(new Date(t.issued_at), "h:mm a"),
        });

        finance[t.route].trips += 1;
        finance[t.route].revenue += t.collection_amount || TICKET_FEE;
      }
    });

    return { matrix, finance };
  },
};
