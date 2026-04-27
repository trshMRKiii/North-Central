import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const EMPTY_FORM = { name: "", contact: "", status: "ACTIVE" };

// Field defined OUTSIDE component to prevent remount (fixes input deselect bug)
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#1a2744" }}>{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2";

function Driver() {
  const [drivers, setDrivers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchDrivers(); fetchTickets(); }, []);

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${API_BASE}/drivers/`);
      if (!res.ok) throw new Error("Failed to fetch drivers");
      setDrivers(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/tickets/`);
      if (!res.ok) return;
      setTickets(await res.json());
    } catch { /* non-critical */ }
  };

  // Check if driver has an active (ISSUED or DISPATCHED) ticket
  const isDriverOnActiveTicket = (driverId) =>
    tickets.some((t) => t.driver?.id === driverId && (t.status === "ISSUED" || t.status === "DISPATCHED"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Guard: cannot set INACTIVE if driver has an active ticket
    if (editing && form.status === "INACTIVE" && isDriverOnActiveTicket(editing.id)) {
      setError("Cannot set driver to Inactive — this driver has an active ticket. Resolve the ticket first.");
      return;
    }
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API_BASE}/drivers/${editing.id}/` : `${API_BASE}/drivers/`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save driver");
      fetchDrivers();
      closeModal();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (driver) => {
    setEditing(driver);
    setForm({ ...driver });
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
    setError(null);
  };

  const handleDelete = async (id) => {
    if (isDriverOnActiveTicket(id)) {
      alert("Cannot delete this driver — they have an active ticket. Resolve the ticket first.");
      return;
    }
    if (!confirm("Are you sure you want to remove this driver record?")) return;
    try {
      const res = await fetch(`${API_BASE}/drivers/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete driver");
      fetchDrivers();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="pb-4 mb-2 border-b-2" style={{ borderColor: "#1a2744" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}>Driver Registry</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Manage registered drivers and duty status</p>
            </div>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded transition" style={{ background: "#1a2744" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            Register Driver
          </button>
        </div>
      </div>

      {error && !isModalOpen && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#1a2744" }}>
                {["Code", "Full Name", "Contact No.", "Status", "Actions"].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">No driver records found.</td></tr>
              ) : drivers.map((driver, idx) => (
                <tr key={driver.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="p-3 text-sm font-medium text-gray-700">{driver.code}</td>
                  <td className="p-3 text-sm font-semibold">{driver.name}</td>
                  <td className="p-3 text-sm">{driver.contact}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${driver.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {driver.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                    {isDriverOnActiveTicket(driver.id) && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded font-semibold" style={{ background: "#dbeafe", color: "#1e40af" }}>On Duty</span>
                    )}
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(driver)} className="px-3 py-1 text-xs font-semibold rounded transition" style={{ background: "#c9a84c", color: "#1a2744" }}>Edit</button>
                    <button onClick={() => handleDelete(driver.id)} className="px-3 py-1 text-xs font-semibold text-white rounded transition bg-red-600 hover:bg-red-700">Delete</button>
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
                {editing ? "Edit Driver Record" : "Register New Driver"}
              </h2>
              <button onClick={closeModal} className="text-white/60 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {error && <div className="p-2 bg-red-50 text-red-700 rounded text-sm border border-red-200">{error}</div>}
              {editing && (
                <Field label="Driver Code">
                  <input type="text" value={form.code} disabled className={`${inputCls} bg-gray-100 text-gray-500`} />
                </Field>
              )}
              <Field label="Full Name">
                <input type="text" placeholder="Full name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
              </Field>
              <Field label="Contact Number">
                <input type="text" placeholder="e.g. 09XXXXXXXXX" value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })} required className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                {editing && isDriverOnActiveTicket(editing.id) && form.status === "INACTIVE" && (
                  <p className="text-xs text-red-500 mt-1">⚠ This driver has an active ticket and cannot be set to Inactive.</p>
                )}
              </Field>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition">Cancel</button>
                <button type="submit" className="flex-1 py-2 text-sm font-semibold text-white rounded transition" style={{ background: "#1a2744" }}>
                  {editing ? "Update Record" : "Register Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Driver;
