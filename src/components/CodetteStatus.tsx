import { useEffect, useState } from 'react';

interface CodetteConnectionStatus {
  connected: boolean;
  status: string;
  error?: string;
}

export function CodetteStatus() {
  const [status, setStatus] = useState<CodetteConnectionStatus>({
    connected: false,
    status: 'checking...',
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setStatus({
            connected: true,
            status: data.status,
          });
        } else {
          setStatus({
            connected: false,
            status: 'offline',
            error: `HTTP ${response.status}`,
          });
        }
      } catch (err) {
        setStatus({
          connected: false,
          status: 'offline',
          error: 'Connection refused',
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-700 rounded">
      <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'} ${status.connected ? 'animate-pulse' : ''}`}></div>
      <span className="text-xs font-medium text-gray-300">
        Codette{' '}
        <span className={status.connected ? 'text-green-400' : 'text-red-400'}>
          {status.connected ? 'Online' : 'Offline'}
        </span>
      </span>
    </div>
  );
}

export default CodetteStatus;
