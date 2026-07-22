import {
  Home,
  Building2,
  Activity,
  Settings,
  LogOut,
} from "lucide-react";

// Desain sidebar dari Figma. Tipe view didefinisikan lokal supaya komponen ini
// tidak bergantung pada App.tsx dan bisa dipakai ulang.
export type ViewType = "dashboard" | "vendor-list" | "monitoring";

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Sidebar({
  activeView,
  onViewChange,
}: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard" as ViewType,
      icon: Home,
      label: "Dashboards",
    },
    {
      id: "vendor-list" as ViewType,
      icon: Building2,
      label: "Rekanan Bank",
    },
    {
      id: "monitoring" as ViewType,
      icon: Activity,
      label: "Monitoring",
    },
  ];

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div>
            <img
              src="https://simaven.pjnhk.go.id/assets/media/logos/vms-logos.png"
              alt="Logo Simaven"
              className="h-10 w-auto"
            />
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all
                ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer Menu */}
      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mb-1">
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}