import { useEffect, useState } from 'react';
import socket from './socket';
import Login from './components/Login';
import Alerts from './components/Alerts';
import CustomerView from './components/CustomerView';
import AgentView from './components/AgentView';

export default function App() {
  const [user, setUser] = useState(null);

  // Tell the server who we are (and again after any reconnect)
  useEffect(() => {
    if (!user) return;
    const announce = () =>
      socket.emit(user.role === 'agent' ? 'agent:online' : 'customer:online', { name: user.name });
    announce();
    socket.on('connect', announce);
    return () => socket.off('connect', announce);
  }, [user]);

  const logout = () => {
    socket.disconnect(); // leaves all rooms
    socket.connect();
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <>
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand">Order Tracker and Live Support</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white">
              {user.name} <span className="badge text-bg-info">{user.role}</span>
            </span>
            <button className="btn btn-sm btn-outline-light" onClick={logout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="container pb-5">
        <Alerts />
        {user.role === 'agent' ? <AgentView user={user} /> : <CustomerView user={user} />}
      </div>
    </>
  );
}