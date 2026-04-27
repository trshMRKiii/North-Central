import React, { useState, useEffect } from "react";
import { OperationsService } from "../../../lib/operations-service";
import { TICKET_FEE } from "../../../lib/constants";
import { apiService } from "../../../lib/api-service";

const statusColor = {
  ISSUED: "bg-yellow-100 text-yellow-800",
  DISPATCHED: "bg-blue-100 text-blue-800",
  COLLECTED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function ticket() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [issuingTicket, setIssuingTicket] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [issueError, setIssueError] = useState("");

  useEffect(() => { fetchTickets(); fetchVehicles(); fetchDrivers(); }, []);

  useEffect(() => {
    const filtered = tickets.filter(
      (t) =>
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.vehicle?.plate_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.driver?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = filtered.sort((a, b) => 
      new Date(b.issued_at) - new Date(a.issued_at)
    );
    setFilteredTickets(filtered.slice(0, 10));
  }, [searchTerm, tickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setTickets(await apiService.getTickets());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchVehicles = async () => {
    try { setVehicles(await apiService.getVehicles()); } catch { /* silent */ }
  };

  const fetchDrivers = async () => {
    try { setDrivers(await apiService.getDrivers()); } catch { /* silent */ }
  };

  const handleVehicleChange = (e) => {
    const vehicleId = parseInt(e.target.value);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    if (vehicle?.active_driver) {
      setSelectedDriver(drivers.find((d) => d.id === vehicle.active_driver) || null);
    } else {
      setSelectedDriver(null);
    }
  };

  const handleDriverChange = (driverId) => {
    setSelectedDriver(drivers.find((d) => d.id === driverId) || null);
    setShowDriverModal(false);
  };

  const handleIssueTicket = async () => {
    setSuccessMessage("");
    setIssueError("");
    if (!selectedVehicle) { setIssueError("Please select a vehicle."); return; }
    if (!selectedDriver) { setIssueError("Please select a driver."); return; }
    // Vehicle must be AVAILABLE, not ON_TRIP or MAINTENANCE
    if (selectedVehicle.status !== "AVAILABLE") {
      setIssueError(`Vehicle is currently ${selectedVehicle.status} and cannot be ticketed.`); return;
    }
    // Driver must be ACTIVE
    if (selectedDriver.status !== "ACTIVE") {
      setIssueError("Selected driver is not active and cannot be assigned."); return;
    }
    if (OperationsService.isVehicleBusy(selectedVehicle.id, tickets)) {
      setIssueError("This vehicle already has an active ticket."); return;
    }
    if (OperationsService.isDriverBusy(selectedDriver.id, tickets, vehicles)) {
      setIssueError("This driver is already assigned to an active ticket."); return;
    }
    try {
      setIssuingTicket(true);
      const now = new Date();
      const ticketId = `TICKET-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      const newTicket = await apiService.createTicket({
        id: ticketId,
        vehicle_id: selectedVehicle.id,
        driver_id: selectedDriver.id,
        route: selectedVehicle.route,
        status: "ISSUED",
        collection_amount: TICKET_FEE,
        is_verified: false,
      });
      setSuccessMessage(`Ticket ${newTicket.id} issued successfully.`);
      fetchTickets();
      setSelectedVehicle(null);
      setSelectedDriver(null);
      setShowDriverModal(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setIssueError(err.message || "Error issuing ticket");
    } finally { setIssuingTicket(false); }
  };

  const formatTime = (dateString) => {
    try { return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); }
    catch { return "N/A"; }
  };

  // Only show AVAILABLE vehicles for ticketing
  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  // Only show ACTIVE drivers who are not busy (no active ticket and not on a trip)
  const activeDrivers = drivers.filter((d) => 
    d.status === "ACTIVE" && !OperationsService.isDriverBusy(d.id, tickets, vehicles)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="pb-4 mb-2 border-b-2" style={{ borderColor: "#1a2744" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}>Ticket Issuance</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Issue and monitor trip dispatch tickets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Ticket Card */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200" style={{ borderLeftWidth: "4px", borderLeftColor: "#1a2744" }}>
            <h2 className="font-semibold text-gray-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Issue New Ticket</h2>
            <p className="text-xs text-gray-500 mt-0.5">Only available vehicles and active drivers may be selected.</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#1a2744" }}>Vehicle (Plate Number)</label>
              <select value={selectedVehicle?.id || ""} onChange={handleVehicleChange}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2">
                <option value="">— Select a vehicle —</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate_number} — {v.route}</option>
                ))}
              </select>
              {vehicles.length > availableVehicles.length && (
                <p className="text-xs text-gray-400 mt-1">{vehicles.length - availableVehicles.length} vehicle(s) excluded (On Trip / Maintenance). {drivers.length - activeDrivers.length} driver(s) excluded (busy or inactive).</p>
              )}
            </div>

            {selectedVehicle && (
              <div className="p-4 rounded border border-gray-200 space-y-3" style={{ background: "#f8f9fa" }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Assigned Driver</span>
                  <button type="button" onClick={() => setShowDriverModal(!showDriverModal)}
                    className="text-xs font-bold hover:underline" style={{ color: "#1a2744" }}>
                    CHANGE DRIVER
                  </button>
                </div>

                {selectedDriver ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "#1a2744", color: "#c9a84c" }}>
                        {selectedDriver.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{selectedDriver.name}</div>
                        <div className="text-xs text-gray-500">ID: {selectedDriver.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded border text-sm font-semibold" style={{ background: "#eef2ff", color: "#1a2744", borderColor: "#c7d2fe" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {selectedVehicle.route || "N/A"}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-3 text-sm text-gray-500 italic">No driver assigned to this vehicle</div>
                )}

                {showDriverModal && (
                  <div className="border-t border-gray-200 pt-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Select Active Driver</label>
                    <select value={selectedDriver?.id || ""} onChange={(e) => handleDriverChange(parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2">
                      <option value="">— Choose a driver —</option>
                      {activeDrivers.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {successMessage && <div className="p-3 bg-green-50 text-green-800 rounded border border-green-200 text-sm font-medium">{successMessage}</div>}
            {issueError && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm font-medium">{issueError}</div>}

            <button type="button" onClick={handleIssueTicket} disabled={issuingTicket || !selectedVehicle || !selectedDriver}
              className="w-full flex items-center justify-center gap-2 py-3 font-bold text-white rounded transition disabled:opacity-50 disabled:pointer-events-none"
              style={{ background: "#1a2744" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
              </svg>
              {issuingTicket ? "Issuing..." : "Issue Ticket"}
            </button>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between" style={{ borderLeftWidth: "4px", borderLeftColor: "#c9a84c" }}>
            <div>
              <h2 className="font-semibold text-gray-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Recent Tickets</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 10 issued tickets</p>
            </div>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none w-40"
                placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Ticket ID", "Vehicle", "Driver", "Time", "Status"].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">Loading tickets...</td></tr>
                ) : error ? (
                  <tr><td colSpan="5" className="p-4 text-center text-red-500">Error: {error}</td></tr>
                ) : filteredTickets.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">No tickets found.</td></tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-3 text-xs text-gray-700 font-medium">{t.id}</td>
                      <td className="p-3 text-sm">{t.vehicle?.plate_number || "N/A"}</td>
                      <td className="p-3 text-sm">{t.driver?.name || "N/A"}</td>
                      <td className="p-3 text-sm">{formatTime(t.issued_at)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor[t.status] || "bg-gray-100 text-gray-800"}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-200">
            <a href="/Report" className="flex items-center justify-center w-full py-2 text-xs font-semibold uppercase tracking-wider border border-gray-200 rounded hover:bg-gray-50 text-gray-600 transition">
              View Full History
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ticket;
