import { useEffect, useState } from 'react';
import socket from '../socket';
import { getOrders, updateStatus, sendAlert } from '../api';
import { STATUSES, statusColor } from '../utils';
import ChatBox from './ChatBox';

export default function AgentView({ user }) {
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chat, setChat] = useState(null);
  const [alertText, setAlertText] = useState('');
  const [level, setLevel] = useState('info');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getOrders().then(setOrders).catch((e) => setMessage({ type: 'danger', text: e.message }));

    const onReady = ({ openRequests }) => setRequests(openRequests);
    const onNewRequest = (r) =>
      setRequests((p) => (p.some((x) => x.room === r.room) ? p : [...p, r]));
    const onRemoved = ({ room }) => setRequests((p) => p.filter((x) => x.room !== room));
    const onCreated = (o) => setOrders((p) => (p.some((x) => x.id === o.id) ? p : [o, ...p]));
    const onUpdated = (o) => setOrders((p) => p.map((x) => (x.id === o.id ? o : x)));

    socket.on('agent:ready', onReady);
    socket.on('support:newRequest', onNewRequest);
    socket.on('support:removed', onRemoved);
    socket.on('order:created', onCreated);
    socket.on('order:statusUpdated', onUpdated);

    return () => {
      socket.off('agent:ready', onReady);
      socket.off('support:newRequest', onNewRequest);
      socket.off('support:removed', onRemoved);
      socket.off('order:created', onCreated);
      socket.off('order:statusUpdated', onUpdated);
    };
  }, []);

  const changeStatus = async (id, status) => {
    try {
      await updateStatus(id, status); // REST PATCH, server then pushes it live
      setMessage(null);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message });
    }
  };

  const pushAlert = async (e) => {
    e.preventDefault();
    if (!alertText.trim()) return;
    try {
      await sendAlert(alertText, level);
      setAlertText('');
    } catch (err) {
      setMessage({ type: 'danger', text: err.message });
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        {message && <div className={`alert alert-${message.type} py-2`}>{message.text}</div>}

        <div className="card shadow-sm mb-4">
          <div className="card-header"><strong>Broadcast a system alert (SSE)</strong></div>
          <form className="card-body row g-2" onSubmit={pushAlert}>
            <div className="col-md-6">
              <input
                className="form-control" placeholder="e.g. Heavy rain, deliveries delayed"
                value={alertText} onChange={(e) => setAlertText(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </select>
            </div>
            <div className="col-md-3 d-grid"><button className="btn btn-dark">Send</button></div>
          </form>
        </div>

        <div className="card shadow-sm">
          <div className="card-header"><strong>All orders</strong></div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr><th>#</th><th>Customer</th><th>Item</th><th>Qty</th><th>Status</th></tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan="5" className="text-center text-muted py-4">No orders yet</td></tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.product_name}</td>
                    <td>{o.quantity}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge text-bg-${statusColor[o.status]}`}>{o.status}</span>
                        <select
                          className="form-select form-select-sm w-auto"
                          value={o.status}
                          disabled={['Delivered', 'Cancelled'].includes(o.status)}
                          onChange={(e) => changeStatus(o.id, e.target.value)}
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="card shadow-sm mb-4">
          <div className="card-header d-flex justify-content-between">
            <strong>Customers waiting for help</strong>
            <span className="badge text-bg-danger">{requests.length}</span>
          </div>
          <ul className="list-group list-group-flush">
            {requests.length === 0 && <li className="list-group-item text-muted">No one is waiting</li>}
            {requests.map((r) => (
              <li key={r.room} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{r.customerName} (Order #{r.orderId})</span>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => setChat({ room: r.room, title: `${r.customerName} - Order #${r.orderId}` })}
                >
                  Join chat
                </button>
              </li>
            ))}
          </ul>
        </div>

        {chat && (
          <ChatBox
            key={chat.room}
            room={chat.room}
            title={chat.title}
            me={user}
            join={{ event: 'chat:join', payload: { room: chat.room, name: user.name } }}
            onClose={() => setChat(null)}
          />
        )}
      </div>
    </div>
  );
}