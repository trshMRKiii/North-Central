import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const EMPTY_FORM = { plate_number: "", route: "", status: "AVAILABLE", active_driver: null };

const statusColor = {
  AVAILABLE: "bg-green-100 text-green-700",
  ON_TRIP: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
};

const statusLabel = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  MAINTENANCE: "Under Maintenance",
};

// Field component defined OUTSIDE to prevent remount on re-render (fixes input deselect bug)
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#1a2744" }}>{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent";
const inputStyle = { "--tw-ring-color": "#1a2744" };

function Vehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchVehicles(); fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${API_BASE}/drivers/`);
      if (!res.ok) throw new Error("Failed to fetch drivers");
      setDrivers(await res.json());
    } catch (err) { console.error(err.message); }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/vehicles/`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      setVehicles(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API_BASE}/vehicles/${editing.id}/` : `${API_BASE}/vehicles/`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save vehicle");
      fetchVehicles();
      closeModal();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (vehicle) => {
    setEditing(vehicle);
    setForm({ ...vehicle });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this vehicle record?")) return;
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete vehicle");
      fetchVehicles();
    } catch (err) { setError(err.message); }
  };

  // Only show ACTIVE drivers in dropdown
  const activeDrivers = drivers.filter((d) => d.status === "ACTIVE");

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="pb-4 mb-2 border-b-2" style={{ borderColor: "#1a2744" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}>Fleet Vehicle Registry</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Manage registered fleet vehicles and driver assignments</p>
            </div>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded transition" style={{ background: "#1a2744" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            Register Vehicle
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#1a2744" }}>
                {["Code", "Plate Number", "Route", "Active Driver", "Status", "Actions"].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-gray-500">No vehicle records found.</td></tr>
              ) : vehicles.map((vehicle, idx) => (
                <tr key={vehicle.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="p-3 text-sm font-medium text-gray-700">{vehicle.code}</td>
                  <td className="p-3 text-sm font-semibold">{vehicle.plate_number}</td>
                  <td className="p-3 text-sm">{vehicle.route}</td>
                  <td className="p-3 text-sm">{vehicle.active_driver_name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[vehicle.status] || "bg-gray-100 text-gray-700"}`}>
                      {statusLabel[vehicle.status] || vehicle.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(vehicle)} className="px-3 py-1 text-xs font-semibold text-white rounded transition" style={{ background: "#c9a84c", color: "#1a2744" }}>Edit</button>
                    <button onClick={() => handleDelete(vehicle.id)} className="px-3 py-1 text-xs font-semibold text-white rounded transition bg-red-600 hover:bg-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 flex items-center justify-between" style={{ background: "#1a2744" }}>
              <h2 className="font-semibold text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                {editing ? "Edit Vehicle Record" : "Register New Vehicle"}
              </h2>
              <button onClick={closeModal} className="text-white/60 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <Field label="Route">
                <input type="text" placeholder="e.g. Tanqui - City" value={form.route}
                  onChange={(e) => setForm({ ...form, route: e.target.value })} required className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                  <option value="AVAILABLE">Available</option>
                  <option value="ON_TRIP">On Trip</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </Field>
              <Field label="Active Driver (Optional)">
                <select value={form.active_driver || ""} onChange={(e) => setForm({ ...form, active_driver: e.target.value ? parseInt(e.target.value) : null })} className={inputCls}>
                  <option value="">— None / Unassigned —</option>
                  {activeDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Only active drivers are shown.</p>
              </Field>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition">Cancel</button>
                <button type="submit" className="flex-1 py-2 text-sm font-semibold text-white rounded transition" style={{ background: "#1a2744" }}>
                  {editing ? "Update Record" : "Register Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicle;
