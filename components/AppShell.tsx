import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell() {
  const { user, businessName, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const linkClasses = ({
    isActive,
    collapsed,
  }: {
    isActive: boolean;
    collapsed: boolean;
  }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
      isActive
        ? "bg-accent text-white font-medium"
        : "text-secondary hover:bg-muted hover:text-foreground"
    } ${collapsed ? "justify-center" : ""}`;

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Mobile overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-border transition-all duration-200 ease-in-out hidden md:flex flex-col ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center h-16 px-4 border-b border-border ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
        >
          {sidebarCollapsed ? (
            <span className="font-heading font-bold text-lg text-accent">
              L
            </span>
          ) : (
            <span className="font-heading font-bold text-xl text-accent">
              LeadDesk
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2" role="navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                linkClasses({ isActive, collapsed: sidebarCollapsed })
              }
            >
              <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className={`border-t border-border ${sidebarCollapsed ? "px-2 py-4" : "p-4"}`}>
          {!sidebarCollapsed && user && (
            <div className="mb-3 truncate">
              <p className="text-sm font-medium text-foreground truncate">
                {businessName || "My Business"}
              </p>
              <p className="text-xs text-secondary truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-secondary hover:text-destructive hover:bg-red-50 transition-all duration-150 cursor-pointer ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center text-secondary hover:text-foreground shadow-sm cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-200 ease-in-out md:hidden flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <span className="font-heading font-bold text-xl text-accent">
            LeadDesk
          </span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-secondary hover:text-foreground cursor-pointer transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2" role="navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                linkClasses({ isActive, collapsed: false })
              }
            >
              <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          {user && (
            <div className="mb-3 truncate">
              <p className="text-sm font-medium text-foreground truncate">
                {businessName || "My Business"}
              </p>
              <p className="text-xs text-secondary truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-secondary hover:text-destructive hover:bg-red-50 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-border">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-secondary hover:text-foreground cursor-pointer transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-heading font-bold text-lg text-accent">
            LeadDesk
          </span>
          <div className="w-9" aria-hidden="true" />
        </header>

        {/* Page content */}
        <main className="flex-1" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
