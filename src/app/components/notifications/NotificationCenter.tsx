import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import { Bell, Check, X, AlertTriangle, Info, CheckCircle2, Clock, Filter, Trash2, User } from "lucide-react";
import { dashboardApi } from "../../services/dashboardApi";
import { toast } from "sonner";

export function NotificationCenter() {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "alert":
        return "border-l-4 border-l-red-500";
      case "warning":
        return "border-l-4 border-l-amber-500";
      case "success":
        return "border-l-4 border-l-emerald-500";
      case "info":
        return "border-l-4 border-l-blue-500";
      default:
        return "border-l-4 border-l-slate-400";
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await dashboardApi.markNotificationRead(id);
      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await dashboardApi.markAllNotificationsRead();
      setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
      window.dispatchEvent(new Event('notifications_updated'));
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await dashboardApi.deleteNotification(id);
      setNotifications(notifications.filter((notif) => notif.id !== id));
      window.dispatchEvent(new Event('notifications_updated'));
      toast.success("Notification deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete notification");
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
              <Bell className="w-6 h-6 text-slate-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all as read
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
          <span className="text-sm text-slate-600">Filter:</span>
          {["all", "unread", "alert", "warning", "success", "info"].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                filter === filterType
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border border-slate-200 rounded-lg p-4 ${getBorderColor(notification.type)} ${!notification.read ? "bg-slate-50" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{notification.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(notification.timestamp).toLocaleString()}
                          </div>
                          {notification.senderRole && (
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              <span>{notification.senderRole}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
