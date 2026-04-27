import React, { useEffect, useState } from "react";
import { apiService } from "../../../lib/api-service";

function Dispatch() {
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vehicleData, ticketData] = await Promise.all([apiService.getVehicles(), apiService.getTickets()]);
        setVehicles(vehicleData);
        setTickets(ticketData);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const queue = vehicles.filter(
    (v) => v.status === "AVAILABLE" && !v.is_archived && tickets.some((t) => t.vehicle?.id === v.id && t.status === "ISSUED")
  );
  const activeTrips = vehicles.filter((v) => v.status === "ON_TRIP" && !v.is_archived);

  const getDriverName = (vehicle) => {
    if (vehicle.active_driver_name) return vehicle.active_driver_name;
    const ticket = tickets.find((t) => t.vehicle && t.vehicle.id === vehicle.id && t.status === "DISPATCHED");
    return ticket?.driver?.name || "—";
  };

  const handleDispatch = async (vehicle) => {
    try {
      await apiService.patch(`/vehicles/${vehicle.id}/`, { status: "ON_TRIP" });
      const [vehicleData, ticketData] = await Promise.all([apiService.getVehicles(), apiService.getTickets()]);
      setVehicles(vehicleData);
      setTickets(ticketData);
    } catch (err) { setError(err.message); }
  };

  const handleReturn = async (vehicle) => {
    try {
      await apiService.patch(`/vehicles/${vehicle.id}/`, { status: "AVAILABLE", active_driver: null });
      const activeTicket = tickets.find((t) => t.vehicle?.id === vehicle.id && t.status === "ISSUED");
      if (activeTicket) await apiService.patch(`/tickets/${activeTicket.id}/`, { status: "COLLECTED" });
      const [vehicleData, ticketData] = await Promise.all([apiService.getVehicles(), apiService.getTickets()]);
      setVehicles(vehicleData);
      setTickets(ticketData);
    } catch (err) { setError(err.message); }
  };

  const TableSection = ({ title, cols, children, emptyMsg }) => (
    <div className="flex-1 bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100" style={{ background: "#1a2744" }}>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>{cols.map((c) => <th key={c} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">{c}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 mb-2 border-b-2" style={{ borderColor: "#1a2744" }}>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}>Active Terminal Queue</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Dispatch control and active trip monitoring</p>
          </div>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}

      <div className="flex flex-row gap-6">
        <TableSection title="Queued Vehicles" cols={["Plate No.", "Driver", "Route", "Status", "Action"]}>
          {loading ? (
            <tr><td colSpan="5" className="p-4 text-center text-gray-500">Loading...</td></tr>
          ) : queue.length === 0 ? (
            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No vehicles in queue.</td></tr>
          ) : queue.map((vehicle) => (
            <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-3 text-sm font-semibold">{vehicle.plate_number}</td>
              <td className="p-3 text-sm">{getDriverName(vehicle)}</td>
              <td className="p-3 text-sm">{vehicle.route || "—"}</td>
              <td className="p-3"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">Available</span></td>
              <td className="p-3">
                <button onClick={() => handleDispatch(vehicle)} className="px-3 py-1.5 text-xs font-semibold text-white rounded transition" style={{ background: "#1a2744" }}>
                  Dispatch
                </button>
              </td>
            </tr>
          ))}
        </TableSection>

        <TableSection title="Active Trips (On Road)" cols={["Plate No.", "Driver", "Route", "Action"]}>
          {loading ? (
            <tr><td colSpan="4" className="p-4 text-center text-gray-500">Loading...</td></tr>
          ) : activeTrips.length === 0 ? (
            <tr><td colSpan="4" className="p-4 text-center text-gray-500">No active trips.</td></tr>
          ) : activeTrips.map((vehicle) => (
            <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-3 text-sm font-semibold">{vehicle.plate_number}</td>
              <td className="p-3 text-sm">{getDriverName(vehicle)}</td>
              <td className="p-3 text-sm">{vehicle.route || "—"}</td>
              <td className="p-3">
                <button onClick={() => handleReturn(vehicle)} className="px-3 py-1.5 text-xs font-semibold text-white rounded transition" style={{ background: "#2a5c3f" }}>
                  Return
                </button>
              </td>
            </tr>
          ))}
        </TableSection>
      </div>
    </div>
  );
}

export default Dispatch;
