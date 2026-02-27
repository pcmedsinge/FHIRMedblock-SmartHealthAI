// -----------------------------------------------------------
// Header — Slim top bar with app name + connection status
// -----------------------------------------------------------
// Patient banner moved into the main content area (full-width).
// Header is now just: branding left, connection status right.
// -----------------------------------------------------------

import { LogOut, Wifi, WifiOff } from "lucide-react";
import { useFhirClient } from "../../hooks/useFhirClient";
import { TRANSITIONS, SOURCE_STYLES } from "../../config/designSystem";

const Header = () => {
  const { client, setClient } = useFhirClient();

  const handleDisconnect = () => {
    setClient(null);
    sessionStorage.clear();
    window.location.assign("/");
  };

  return (
    <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 print:hidden">
      {/* Left: App title */}
      <div className="text-sm font-semibold text-slate-500">
        Patient Health Portal
      </div>

      {/* Right: Connection status + disconnect */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Connection indicators — uses design system source colors */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {client ? (
              <Wifi className={`w-4 h-4 ${SOURCE_STYLES["epic-sandbox"].text}`} />
            ) : (
              <WifiOff className="w-4 h-4 text-slate-400" />
            )}
            <span className={`font-medium ${client ? SOURCE_STYLES["epic-sandbox"].text : "text-slate-400"}`}>
              {SOURCE_STYLES["epic-sandbox"].label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${SOURCE_STYLES["community-mc"].dot}`} />
            <span className={`${SOURCE_STYLES["community-mc"].text} font-medium`}>
              {SOURCE_STYLES["community-mc"].label}
            </span>
          </div>
        </div>

        {/* Disconnect */}
        {client && (
          <button
            onClick={handleDisconnect}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              text-slate-500 hover:text-red-600 hover:bg-red-50 ${TRANSITIONS.fast}`}
            title="Disconnect from Epic"
            aria-label="Disconnect from Epic"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Disconnect</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
