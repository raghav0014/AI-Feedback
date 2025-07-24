interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    // Load notifications from localStorage
    this.loadNotifications();
  }

  private loadNotifications() {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    // Immediately call with current notifications
    listener([...this.notifications]);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  add(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();
    this.notifyListeners();

    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, 5000);
    }

    return newNotification.id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  clear() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Convenience methods for different notification types
  success(title: string, message: string, actionUrl?: string) {
    return this.add({ type: 'success', title, message, actionUrl });
  }

  error(title: string, message: string, actionUrl?: string) {
    return this.add({ type: 'error', title, message, actionUrl });
  }

  warning(title: string, message: string, actionUrl?: string) {
    return this.add({ type: 'warning', title, message, actionUrl });
  }

  info(title: string, message: string, actionUrl?: string) {
    return this.add({ type: 'info', title, message, actionUrl });
  }

  // Request browser notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Show browser notification
  async showBrowserNotification(title: string, message: string, icon?: string) {
    const hasPermission = await this.requestPermission();
    
    if (hasPermission) {
      new Notification(title, {
        body: message,
        icon: icon || '/vite.svg',
        tag: 'feedbackchain'
      });
    }
  }
}

export const notificationService = new NotificationService();
export type { Notification };