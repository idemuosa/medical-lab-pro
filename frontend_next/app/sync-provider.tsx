'use client';

import React, { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

export default function SyncProvider({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    const handleNotification = (data: { message?: string; type?: string }) => {
      if (!data?.message) return;
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
    };

    // 1. Setup Real-time Listener (Django Channels)
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket('ws://localhost:8000/ws/notifications/');
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleNotification(data);
        } catch (e) {
          console.error('Error parsing WS notification', e);
        }
      };
      socket.onerror = () => {
        // Silently handled if channels in-memory
      };
    } catch (e) {
      console.warn('Could not initialize WebSocket connection');
    }

    // 2. Setup Real-time Listener (Node.js Socket Server on port 4000)
    const nodeSocket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 3000
    });

    nodeSocket.on('global_notification', (data) => {
      console.log('Received global socket notification:', data);
      handleNotification(data);
    });

    // 3. LocalStorage Sync Logic
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
      if (socket) {
        socket.close();
      }
      nodeSocket.disconnect();
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
