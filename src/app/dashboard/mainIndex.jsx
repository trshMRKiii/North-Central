import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./Dashboard";
import Ticket from "./ticket/ticket";
import Collections from "./collection/collection";
import Vehicles from "./vehicle/vehicle";
import Drivers from "./driver/driver";
import StaffRegistry from "./user/user";
import Reports from "./report/report";
import {
  CollectionsIcon, DashboardIcon, DriverIcon,
  ReportIcon, TicketIcon, UserIcon, VehicleIcon,
} from "../../components/ui/NavIcon";

const NAV_ITEMS = [
  { to: "/Dashboard", label: "Dashboard", Icon: DashboardIcon },
  { to: "/Ticket", label: "Tickets", Icon: TicketIcon },
  { to: "/Collections", label: "Collections", Icon: CollectionsIcon },
  { to: "/Vehicles", label: "Vehicles Registry", Icon: VehicleIcon },
  { to: "/Drivers", label: "Drivers Registry", Icon: DriverIcon },
  { to: "/StaffRegistry", label: "Staff Registry", Icon: UserIcon },
  { to: "/Reports", label: "Reports", Icon: ReportIcon },
];

function mainIndex() {
  return (
    <Router>
      <div className="flex h-screen" style={{ background: "#f0f2f5" }}>
        <aside className="w-64 flex flex-col border-r-2" style={{ background: "#1a2744", borderColor: "#c9a84c" }}>
          {/* Header */}
          <div className="px-4 py-5 border-b-2" style={{ borderColor: "#c9a84c" }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded flex-shrink-0" style={{ background: "#c9a84c" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
                  <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
                  <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#c9a84c", fontSize: "9px" }}>City Governmetn of San Fernando</div>
                <div className="text-sm font-bold text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>North Central Terminal</div>
              </div>
            </div>
          </div>

          {/* Nav label */}
          <div className="px-4 pt-4 pb-1 text-xs uppercase tracking-widest font-bold" style={{ color: "#c9a84c88" }}>Navigation</div>

          {/* Nav Links */}
          <nav className="flex-1 px-2 pb-2 space-y-0.5">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all ${isActive ? "text-white" : "text-blue-200 hover:text-white hover:bg-white/10"}`
                }
                style={({ isActive }) => isActive
                  ? { background: "rgba(201,168,76,0.18)", borderLeft: "3px solid #c9a84c", paddingLeft: "9px" }
                  : { borderLeft: "3px solid transparent", paddingLeft: "9px" }
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User info */}
          <div className="border-t p-4" style={{ borderColor: "#c9a84c55" }}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "#c9a84c", color: "#1a2744" }}>HM</div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold text-white truncate">Head Manager Sarah</p>
                <p className="text-xs" style={{ color: "#c9a84c" }}>MANAGER</p>
              </div>
              <button className="text-blue-300 hover:text-red-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto" style={{ background: "#f0f2f5" }}>
          <Routes>
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Ticket" element={<Ticket />} />
            <Route path="/Collections" element={<Collections />} />
            <Route path="/Vehicles" element={<Vehicles />} />
            <Route path="/Drivers" element={<Drivers />} />
            <Route path="/StaffRegistry" element={<StaffRegistry />} />
            <Route path="/Reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default mainIndex;
