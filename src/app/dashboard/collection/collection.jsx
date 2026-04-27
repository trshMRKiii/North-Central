import React, { useState, useEffect } from "react";
import { OperationsService } from "../../../lib/operations-service";
import { apiService } from "../../../lib/api-service";

function collection() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchStats, setBatchStats] = useState(null);
  const [verifyingBatch, setVerifyingBatch] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (tickets.length > 0) setBatchStats(OperationsService.calculateBatchStats(tickets));
  }, [tickets]);

  useEffect(() => {
    const filtered = tickets.filter(
      (t) =>
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.vehicle?.plate_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.driver?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.vehicle?.route || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = filtered.sort((a, b) => 
      new Date(b.issued_at) - new Date(a.issued_at)
    );
    setFilteredTickets(filtered);
  }, [searchTerm, tickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setTickets(await apiService.getTickets());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyBatch = async (batchName) => {
    try {
      setVerifyingBatch(batchName);
      const batchTickets = tickets.filter(
        (t) => !t.is_verified && t.status !== "CANCELLED" && OperationsService.getShiftBatchName(t.issued_at) === batchName
      );
      if (batchTickets.length === 0) {
        setSuccessMessage("No pending tickets to verify in this batch.");
        setTimeout(() => setSuccessMessage(""), 3000);
        setVerifyingBatch(null);
        return;
      }
      for (const ticket of batchTickets) {
        await apiService.patch(`/tickets/${ticket.id}/`, { is_verified: true });
      }
      setSuccessMessage(`${batchTickets.length} ticket(s) in ${batchName} verified successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchTickets();
    } catch (err) { setError(err.message); }
    finally { setVerifyingBatch(null); }
  };

  const handleResetAmount = async (ticketId) => {
    try {
      if (!ticketId) {
        const verifiedTickets = tickets.filter((t) => t.is_verified && t.status !== "COLLECTED");
        for (const ticket of verifiedTickets) {
          await apiService.patch(`/tickets/${ticket.id}/`, { collection_amount: 0, status: "COLLECTED" });
        }
        setSuccessMessage(`${verifiedTickets.length} ticket(s) collected and recorded successfully.`);
      } else {
        await apiService.patch(`/tickets/${ticketId}/`, { collection_amount: 0, status: "COLLECTED" });
        setSuccessMessage(`Ticket ${ticketId} marked as collected.`);
      }
      fetchTickets();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) { setError(err.message); }
  };

  const formatTime = (dateString) => {
    try { return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); }
    catch { return "N/A"; }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount || 0);

  const BatchCard = ({ label, stats, batchKey }) => (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100" style={{ background: "#1a2744" }}>
        <p className="text-sm font-semibold text-white">{label}</p>
      </div>
      <div className="p-4 space-y-2">
        {stats && (
          <>
            {[
              { label: "Revenue", value: formatCurrency(stats.total), bold: true },
              { label: "Active Dispatches", value: stats.count },
              { label: "Pending Verification", value: stats.pending, warn: stats.pending > 0 },
            ].map(({ label: l, value, bold, warn }) => (
              <div key={l} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className={`text-sm font-semibold ${warn ? "text-yellow-600" : "text-gray-800"}`}>{value}</span>
              </div>
            ))}
          </>
        )}
        <button type="button" onClick={() => handleVerifyBatch(batchKey)} disabled={verifyingBatch === batchKey}
          className="w-full mt-2 text-white text-sm font-semibold py-2 rounded transition disabled:opacity-50" style={{ background: "#1a2744" }}>
          {verifyingBatch === batchKey ? "Verifying..." : `Verify ${batchKey}`}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 mb-2 border-b-2" style={{ borderColor: "#1a2744" }}>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}>Tally & Collections</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Automated revenue recording — ₱10 per dispatch</p>
          </div>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}
      {successMessage && <div className="p-3 bg-green-50 text-green-800 rounded border border-green-200 text-sm font-medium">{successMessage}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Tally */}
        <div className="space-y-4">
          {/* Total Revenue */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100" style={{ borderLeftWidth: "4px", borderLeftColor: "#c9a84c" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Verified Revenue</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "#1a2744" }}>
                {batchStats ? formatCurrency(batchStats.totalVerified) : "₱0.00"}
              </p>
            </div>
            <div className="p-4">
              <button type="button" onClick={() => handleResetAmount()}
                className="w-full py-2 text-sm font-semibold text-white rounded transition" style={{ background: "#2a5c3f" }}>
                Collect & Record Amount
              </button>
            </div>
          </div>
          <BatchCard label="Batch 1 — Morning Shift (6:00 AM – 3:00 PM)" stats={batchStats?.batch1} batchKey="Batch 1" />
          <BatchCard label="Batch 2 — Afternoon Shift (3:00 PM – 9:00 PM)" stats={batchStats?.batch2} batchKey="Batch 2" />
        </div>

        {/* Collection Log */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between" style={{ borderLeftWidth: "4px", borderLeftColor: "#1a2744" }}>
            <div>
              <h2 className="font-semibold text-gray-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Collection Log</h2>
              <p className="text-xs text-gray-500 mt-0.5">Recent collections and verification status</p>
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
                  {["Ticket ID", "Time", "Vehicle", "Driver", "Verified"].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">Loading...</td></tr>
                ) : error ? (
                  <tr><td colSpan="5" className="p-4 text-center text-red-500">Error: {error}</td></tr>
                ) : filteredTickets.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">No records found.</td></tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-3 text-xs font-medium text-gray-700">{ticket.id}</td>
                      <td className="p-3 text-sm">{formatTime(ticket.issued_at)}</td>
                      <td className="p-3 text-sm">{ticket.vehicle?.plate_number || "N/A"}</td>
                      <td className="p-3 text-sm">{ticket.driver?.name || "N/A"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ticket.is_verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {ticket.is_verified ? "✓ Verified" : "○ Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default collection;
