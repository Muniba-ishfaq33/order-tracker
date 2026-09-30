import { useState } from 'react';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onLogin({ name: name.trim(), role });
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-11 col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h4 className="mb-1">Order Tracker</h4>
              <p className="text-muted">Real-time orders and live support</p>
              <form onSubmit={submit}>
                <label className="form-label">Your name</label>
                <input
                  className="form-control mb-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ali"
                />
                <label className="form-label">I am a</label>
                <select className="form-select mb-4" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="agent">Support Agent</option>
                </select>
                <button className="btn btn-primary w-100">Continue</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}