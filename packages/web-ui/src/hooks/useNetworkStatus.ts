import { useState, useEffect, useCallback } from 'react';

declare global {
  interface NetworkInformation extends EventTarget {
    readonly effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
    readonly rtt?: number; // Round-trip time in milliseconds
    readonly downlink?: number; // Downlink speed in megabits per second
    readonly saveData?: boolean;
    onchange?: EventListener;
  }

  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  rtt?: number;
  downlink?: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
  });

  const updateNetworkStatus = useCallback(() => {
    const connection = navigator.connection || 
                       navigator.mozConnection || 
                       navigator.webkitConnection;

    setStatus({
      isOnline: navigator.onLine,
      isSlowConnection: connection ? 
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' || 
        (connection.rtt !== undefined && connection.rtt > 500) : false,
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
      downlink: connection?.downlink,
    });
  }, []);

  useEffect(() => {
    updateNetworkStatus();

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      updateNetworkStatus();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes if available
    const connection = navigator.connection || 
                       navigator.mozConnection || 
                       navigator.webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus]);

  return status;
}