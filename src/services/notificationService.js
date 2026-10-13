import { apiConfig } from '../config/api';

/**
 * Fetch all notifications for the authenticated user.
 */
export const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return { success: false, data: [], unreadCount: 0 };

    const url = apiConfig.endpoints.notifications.get();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to fetch notifications:', response.status);
      return { success: false, data: [], unreadCount: 0 };
    }

    const res = await response.json();
    return res;
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return { success: false, data: [], unreadCount: 0 };
  }
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    const url = apiConfig.endpoints.notifications.markAsRead(id);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read.
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    const url = apiConfig.endpoints.notifications.markAllAsRead();
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return false;
  }
};
