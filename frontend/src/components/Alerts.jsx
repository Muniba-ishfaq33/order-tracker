import { useEffect, useState } from 'react';
import { API_URL } from '../config';

const levelClass = { info: 'info', success: 'success', warning: 'warning', danger: 'danger' };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource(`${API_URL}/events`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.addEventListener('alert', (e) => {
      const alert = { ...JSON.parse(e.data), id: Math.random() };
      setAlerts((prev) => [alert, ...prev].slice(0, 4));
    });
    return () => es.close();
  }, []);

  return (
    <div className="mb-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <strong>Live system alerts</strong>
        <span className={`badge text-bg-${connected ? 'success' : 'secondary'}`}>
          {connected ? 'SSE connected' : 'Reconnecting...'}
        </span>
      </div>
      {alerts.map((a) => (
        <div key={a.id} className={`alert alert-${levelClass[a.level] || 'info'} py-2 mb-2`}>
          <small className="text-muted me-2">{new Date(a.time).toLocaleTimeString()}</small>
          {a.message}
        </div>
      ))}
    </div>
  );
}