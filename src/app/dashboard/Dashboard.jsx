import React, { useState, useEffect } from "react";
import { apiService } from "../../lib/api-service";
import BatchModal from "../../components/ui/batch-modal";

const STAT_CARDS = [
  { label: "Active Dispatch", key: "activeDispatch", accent: "#1a2744" },
  { label: "Tickets Today", key: "ticketsToday", accent: "#2a5c3f" },
  { label: "Available Vehicles", key: "availableJeeps", accent: "#5c3a1a" },
  { label: "Drivers On Duty", key: "driversOnDuty", accent: "#1a3d5c" },
];

const PageHeader = ({ title, subtitle }) => (
  <div className="pb-4 mb-6 border-b-2" style={{ borderColor: "#1a2744" }}>
    <div className="flex items-center gap-3">
      <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}>{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </div>
);

function Dashboard() {
  const [stats, setStats] = useState({ activeDispatch: [], ticketsToday: [], availableJeeps: [], driversOnDuty: [], activeOnTrip: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tickets, vehicles, drivers] = await Promise.all([
        apiService.getTickets(), apiService.getVehicles(), apiService.getDrivers(),
      ]);
      const today = new Date().toISOString().split("T")[0];
      setStats({
        activeDispatch: tickets.filter((t) => t.status === "ISSUED").slice(0, 5),
        activeOnTrip: tickets.filter((t) => t.status === "DISPATCHED").slice(0, 5),
        ticketsToday: tickets.filter((t) => t.issued_at.split("T")[0] === today && t.status !== "CANCELLED").slice(0, 10),
        availableJeeps: vehicles.filter((v) => v.status === "AVAILABLE"),
        driversOnDuty: drivers.filter((d) => d.status === "ACTIVE"),
      });
      setError(null);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleDispatch = async (ticket) => {
    try {
      await apiService.updateTicket(ticket.id, { status: "DISPATCHED" });
      await fetchDashboardData();
    } catch (err) { setError("Failed to dispatch ticket"); }
  };

  const handleReturn = async (ticket) => {
    try {
      const vehicle = ticket.vehicle;
      await apiService.patch(`/vehicles/${vehicle.id}/`, { status: "AVAILABLE", active_driver: null });
      await apiService.patch(`/tickets/${ticket.id}/`, { status: "RETURNED" });
      await fetchDashboardData();
    } catch (err) { setError(err.message); }
  };

  const handleBatchSelect = async (batch) => {
    try {
      await apiService.updateTicket(selectedTicket.id, { batch });
      await fetchDashboardData();
    } catch (err) { setError("Failed to update ticket batch"); }
    finally { setShowBatchModal(false); setSelectedTicket(null); }
  };

  if (loading && stats.activeDispatch.length === 0) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Operations Dashboard" subtitle="Tanqui Transport Dispatch Management System" />

      {error && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, key, accent }) => (
          <div key={key} className="bg-white rounded border shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: accent }} />
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: accent }}>{stats[key].length}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Queue + On Trip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Dispatch Queue */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b-2 border-gray-100 flex items-center gap-2" style={{ borderLeftWidth: "4px", borderLeftColor: "#1a2744" }}>
            <h2 className="font-semibold text-gray-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Active Dispatch Queue</h2>
          </div>
          <div className="overflow-y-auto max-h-80">
            {stats.activeDispatch.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.activeDispatch.map((ticket) => (
                  <div key={ticket.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{ticket.id}</p>
                        <p className="text-xs text-gray-500">{ticket.route}</p>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded" style={{ background: "#fef3c7", color: "#92400e" }}>ISSUED</span>
                    </div>
                    <button onClick={() => handleDispatch(ticket)} className="w-full px-3 py-1.5 text-xs font-semibold text-white rounded transition" style={{ background: "#1a2744" }}>
                      Dispatch
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">No active dispatch queue</div>
            )}
          </div>
        </div>

        {/* Active On Trip */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b-2 border-gray-100" style={{ borderLeftWidth: "4px", borderLeftColor: "#c9a84c" }}>
            <h2 className="font-semibold text-gray-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Active On Trip</h2>
          </div>
          <div className="overflow-y-auto max-h-80">
            {stats.activeOnTrip.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.activeOnTrip.map((ticket) => (
                  <div key={ticket.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{ticket.id}</p>
                        <p className="text-xs text-gray-500">{ticket.route}</p>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded" style={{ background: "#dbeafe", color: "#1e40af" }}>DISPATCHED</span>
                    </div>
                    <button onClick={() => handleReturn(ticket)} className="w-full px-3 py-1.5 text-xs font-semibold text-white rounded transition" style={{ background: "#2a5c3f" }}>
                      Mark as Returned
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">No active trips</div>
            )}
          </div>
        </div>
      </div>

      {showBatchModal && selectedTicket && (
        <BatchModal ticket={selectedTicket} onBatchSelect={handleBatchSelect}
          onClose={() => { setShowBatchModal(false); setSelectedTicket(null); }} />
      )}
    </div>
  );
}

export default Dashboard;
