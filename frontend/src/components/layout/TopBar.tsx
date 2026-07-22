import { Bell, User } from "lucide-react";

export function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'%3E%3Ctext x='5' y='28' font-family='Inter, sans-serif' font-weight='700' font-size='18' fill='%2316a34a'%3Esimaven%3C/text%3E%3C/svg%3E"
            alt="SIMAVEN"
            className="h-6"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Hospital Logo */}
        <div className="flex items-center gap-2 text-sm text-gray-600 pr-4 border-r border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">HK</span>
            </div>
            <span className="font-medium text-gray-700">Kemenkes RSAB Harapan Kita</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
        </button>
      </div>
    </header>
  );
}
