import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const EMPTY_FORM = { username: "", email: "", first_name: "", last_name: "", password: "", role: "PERSONNEL", is_active: true };

const roleColor = {
  MANAGER: "bg-purple-100 text-purple-700",
  SUPERVISOR: "bg-blue-100 text-blue-700",
  PERSONNEL: "bg-gray-100 text-gray-600",
};

// Defined OUTSIDE to prevent remount (fixes input deselect bug)
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#1a2744" }}>{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2";

function User() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/`);
      if (!res.ok) throw new Error("Failed to fetch users");
      setUsers(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API_BASE}/users/${editing.id}/` : `${API_BASE}/users/`;
      const payload = { username: form.username, email: form.email, first_name: form.first_name, last_name: form.last_name, role: form.role, is_active: form.is_active };
      if (form.password) payload.password = form.password;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to save user");
      fetchUsers();
      closeModal();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (user) => {
    setEditing(user);
    setForm({ username: user.username, email: user.email, first_name: user.first_name, last_name: user.last_name, password: "", role: user.role, is_active: user.is_active });
    setIsModalOpen(true);
  };

  const handleAdd = () => { setEditing(null); setForm(EMPTY_FORM); setIsModalOpen(true); };

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this staff account?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      fetchUsers();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 mb-2 border-b-2" style={{ borderColor: "#1a2744" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}>Staff Registry</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Manage system accounts and personnel roles</p>
            </div>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded transition" style={{ background: "#1a2744" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            Add Staff Account
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
                {["ID", "Full Name", "Email Address", "Role", "Status", "Actions"].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-gray-500">No staff accounts found.</td></tr>
              ) : users.map((user, idx) => (
                <tr key={user.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="p-3 text-sm font-medium text-gray-700">{user.id}</td>
                  <td className="p-3 text-sm font-semibold">{user.first_name} {user.last_name}</td>
                  <td className="p-3 text-sm text-gray-500">{user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${roleColor[user.role] || "bg-gray-100 text-gray-600"}`}>{user.role}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(user)} className="px-3 py-1 text-xs font-semibold rounded transition" style={{ background: "#c9a84c", color: "#1a2744" }}>Edit</button>
                    <button onClick={() => handleDelete(user.id)} className="px-3 py-1 text-xs font-semibold text-white rounded transition bg-red-600 hover:bg-red-700">Delete</button>
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
                {editing ? "Edit Staff Account" : "Register Staff Account"}
              </h2>
              <button onClick={closeModal} className="text-white/60 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name">
                  <input type="text" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required className={inputCls} />
                </Field>
                <Field label="Last Name">
                  <input type="text" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required className={inputCls} />
                </Field>
              </div>
              <Field label="Username">
                <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className={inputCls} />
              </Field>
              <Field label="Email Address">
                <input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputCls} />
              </Field>
              <Field label={editing ? "Password (leave blank to keep)" : "Password"}>
                <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Role">
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                    <option value="PERSONNEL">Personnel</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })} className={inputCls}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </Field>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition">Cancel</button>
                <button type="submit" className="flex-1 py-2 text-sm font-semibold text-white rounded transition" style={{ background: "#1a2744" }}>
                  {editing ? "Update Account" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default User;
