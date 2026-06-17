import { Info, X } from "lucide-react";
import { useState } from "react";

interface SystemAnnouncementProps {
  message: string;
  type?: "info" | "warning" | "success";
  dismissible?: boolean;
}

export function SystemAnnouncement({ 
  message, 
  type = "info",
  dismissible = true 
}: SystemAnnouncementProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const getColors = () => {
    switch (type) {
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-900";
      case "success":
        return "bg-emerald-50 border-emerald-200 text-emerald-900";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "warning":
        return "text-amber-600";
      case "success":
        return "text-emerald-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className={`border rounded-lg p-4 flex items-center justify-between ${getColors()}`}>
      <div className="flex items-center gap-3">
        <Info className={`w-5 h-5 flex-shrink-0 ${getIconColor()}`} />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
