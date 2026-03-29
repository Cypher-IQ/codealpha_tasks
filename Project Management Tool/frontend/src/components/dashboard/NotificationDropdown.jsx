import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Check } from 'lucide-react';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-surface-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-surface-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-surface-200 overflow-hidden z-50">
          <div className="p-4 border-b border-surface-100 flex justify-between items-center">
            <h3 className="font-semibold text-surface-800">Notifications</h3>
            {unreadCount > 0 && <span className="text-xs text-primary-600 font-medium">{unreadCount} unread</span>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-surface-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-surface-300 opacity-50" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  className={`p-4 border-b border-surface-50 flex gap-3 hover:bg-surface-50 transition-colors ${!notif.read ? 'bg-primary-50/30' : ''}`}
                >
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.read ? 'bg-primary-500' : 'bg-transparent'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-surface-800">{notif.message}</p>
                    <span className="text-xs text-surface-400 mt-1 block">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!notif.read && (
                    <button 
                      title="Mark as read"
                      onClick={() => markAsRead(notif._id)}
                      className="text-surface-400 hover:text-primary-600 transition-colors shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
