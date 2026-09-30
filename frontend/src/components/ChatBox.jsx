import { useEffect, useRef, useState } from 'react';
import socket from '../socket';

export default function ChatBox({ room, title, me, join, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    const onJoined = (d) => { if (d.room === room) setMessages(d.history); };
    const onMessage = (m) => { if (m.room === room) setMessages((p) => [...p, m]); };
    const onSystem = (m) => {
      if (m.room === room) setMessages((p) => [...p, { id: Math.random(), system: true, text: m.text }]);
    };
    const onTyping = (d) => {
      if (d.room !== room) return;
      setTyping(`${d.name} is typing...`);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(''), 1500);
    };
    const onError = (msg) => setError(msg);

    socket.on('chat:joined', onJoined);
    socket.on('chat:message', onMessage);
    socket.on('chat:system', onSystem);
    socket.on('chat:typing', onTyping);
    socket.on('chat:error', onError);

    socket.emit(join.event, join.payload); // join AFTER listeners are ready

    return () => {
      socket.off('chat:joined', onJoined);
      socket.off('chat:message', onMessage);
      socket.off('chat:system', onSystem);
      socket.off('chat:typing', onTyping);
      socket.off('chat:error', onError);
      clearTimeout(typingTimer.current);
      socket.emit('chat:leave', { room });
    };
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('chat:message', { room, text });
    setText('');
  };

  const onChange = (e) => {
    setText(e.target.value);
    socket.emit('chat:typing', { room });
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>{title}</strong>
        <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
      </div>

      <div className="card-body bg-light" style={{ height: 320, overflowY: 'auto' }}>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {messages.map((m) =>
          m.system ? (
            <div key={m.id} className="text-center text-muted small my-2">{m.text}</div>
          ) : (
            <div key={m.id} className={`d-flex mb-2 ${m.sender === me.name ? 'justify-content-end' : ''}`}>
              <div className={`px-3 py-2 rounded-3 ${m.sender === me.name ? 'bg-primary text-white' : 'bg-white border'}`}>
                <div className="small opacity-75">
                  {m.sender} ({m.role})
                </div>
                {m.text}
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="card-footer">
        <div className="small text-muted mb-1" style={{ minHeight: 18 }}>{typing}</div>
        <form className="input-group" onSubmit={send}>
          <input className="form-control" value={text} onChange={onChange} placeholder="Type a message..." />
          <button className="btn btn-primary">Send</button>
        </form>
      </div>
    </div>
  );
}