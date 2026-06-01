'use client';

import React, { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function SyncProvider({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    // 1. Setup Real-time Listener (Django Channels)
    const socket = new WebSocket('ws://localhost:8000/ws/notifications/');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('NEW NOTIFICATION:', data);

      if (data.message) {
        if (data.type === 'NEW_RESULT') {
          toast.success(data.message, {
            description: 'The patient registry and results have been updated.',
          });
        } else if (data.type === 'INVENTORY_ALERT') {
          toast.error(data.message, {
            description: 'Please check the inventory tab to restock.',
            duration: 8000,
          });
        } else {
          toast.info(data.message);
        }
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected. Attempting to reconnect...');
      // Reconnection logic could go here
    };

    // 2. LocalStorage Sync Logic
    const syncData = async () => {
      const localPatients = JSON.parse(localStorage.getItem('pending_patients') || '[]');
      const token = localStorage.getItem('access_token');

      if (localPatients.length > 0 && token) {
        try {
          const response = await axios.post('http://localhost:8000/api/patients/sync_local_data/', localPatients, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.status === 201) {
            console.log('Sync complete, clearing local storage');
            localStorage.removeItem('pending_patients');
          }
        } catch (error) {
          console.error('Sync failed, will retry later:', error);
        }
      }
    };

    // Run sync on load and every 5 minutes
    syncData();
    const interval = setInterval(syncData, 5 * 60 * 1000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
