import { useEffect, useState } from 'react';
import socket from '../socket';
import { getCatalog, getOrders, createOrder, rpc } from '../api';
import { statusColor, canCancel } from '../utils';
import ChatBox from './ChatBox';

export default function CustomerView({ user }) {
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [chatOrder, setChatOrder] = useState(null);
  const [message, setMessage] = useState(null);

  const addOrder = (order) =>
    setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]));

  useEffect(() => {
    getCatalog()
      .then((items) => {
        setCatalog(items);
        if (items[0]) setProductId(String(items[0].id));
      })
      .catch((e) => setMessage({ type: 'danger', text: e.message }));

    getOrders(user.name).then(setOrders).catch((e) => setMessage({ type: 'danger', text: e.message }));

    // WebSocket: live status updates from the server
    const onUpdated = (order) =>
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    socket.on('order:statusUpdated', onUpdated);
    socket.on('order:created', addOrder);

    return () => {
      socket.off('order:statusUpdated', onUpdated);
      socket.off('order:created', addOrder);
    };
  }, [user.name]);

  const place = async (e) => {
    e.preventDefault();
    try {
      const order = await createOrder({
        customer_name: user.name,
        product_id: Number(productId),
        quantity: Number(quantity),
      });
      addOrder(order);
      setMessage({ type: 'success', text: `Order #${order.id} placed` });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message });
    }
  };

  // JSON-RPC: call the "cancelOrder" method by name
  const cancel = async (id) => {
    try {
      await rpc('cancelOrder', { orderId: id });
      setMessage({ type: 'warning', text: `Order #${id} cancelled (JSON-RPC)` });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message });
    }
  };

  return (
    <div className="row g-4">
      <div className={chatOrder ? 'col-lg-7' : 'col-12'}>
        {message && (
          <div className={`alert alert-${message.type} py-2`}>{message.text}</div>
        )}

        <div className="card shadow-sm mb-4">
          <div className="card-header"><strong>Place a new order</strong></div>
          <form className="card-body row g-2" onSubmit={place}>
            <div className="col-md-6">
              <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - Rs. {Number(p.price).toFixed(0)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="number" min="1" max="20" className="form-control"
                value={quantity} onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="col-md-3 d-grid">
              <button className="btn btn-primary">Order</button>
            </div>
          </form>
        </div>

        <div className="card shadow-sm">
          <div className="card-header"><strong>My orders</strong></div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr><th>#</th><th>Item</th><th>Qty</th><th>Total</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan="6" className="text-center text-muted py-4">No orders yet</td></tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.product_name}</td>
                    <td>{o.quantity}</td>
                    <td>Rs. {Number(o.total).toFixed(0)}</td>
                    <td><span className={`badge text-bg-${statusColor[o.status]}`}>{o.status}</span></td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger me-2"
                        disabled={!canCancel(o.status)}
                        onClick={() => cancel(o.id)}
                      >
                        Cancel
                      </button>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => setChatOrder(o)}>
                        Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {chatOrder && (
        <div className="col-lg-5">
          <ChatBox
            key={chatOrder.id}
            room={`support-order-${chatOrder.id}`}
            title={`Support - Order #${chatOrder.id}`}
            me={user}
            join={{ event: 'support:request', payload: { orderId: chatOrder.id, customerName: user.name } }}
            onClose={() => setChatOrder(null)}
          />
        </div>
      )}
    </div>
  );
}