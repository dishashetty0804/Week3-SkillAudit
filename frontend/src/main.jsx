import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { Activity, CalendarCheck, CarFront, LogIn, MapPin, Search, ShieldCheck, UserPlus } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function App() {
  const [locations, setLocations] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [credentials, setCredentials] = useState({ name: '', email: '', password: '' });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  async function loadData() {
    const [parking, trafficResponse] = await Promise.all([
      axios.get(`${API}/parking/locations?q=${encodeURIComponent(query)}`),
      axios.get(`${API}/traffic`),
    ]);
    setLocations(parking.data.data);
    setTraffic(trafficResponse.data.data);
    if (token) {
      const response = await axios.get(`${API}/reservations`, { headers: { Authorization: `Bearer ${token}` } });
      setReservations(response.data);
    }
  }

  useEffect(() => { loadData().catch(() => setMessage('Backend unavailable. Start the API and refresh.')); }, [query, token]);

  function saveSession(result) {
    setToken(result.token); setUser(result.user);
    localStorage.setItem('token', result.token); localStorage.setItem('user', JSON.stringify(result.user));
    setMessage(`Welcome, ${result.user.name}`);
  }

  async function submitAuth(event) {
    event.preventDefault();
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${path}`, credentials);
      saveSession(response.data);
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to complete authentication'); }
  }

  function signOut() { localStorage.clear(); setToken(null); setUser(null); setReservations([]); setMessage('You have been signed out.'); }

  async function reserve(slot) {
    if (!token) { setMessage('Please log in or register before reserving a space.'); return; }
    try {
      await axios.post(`${API}/reservations`, { slotId: slot.id, startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString() }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(`Reserved ${slot.label}`); setSelected(null); loadData();
    } catch (error) { setMessage(error.response?.data?.message || 'Reservation failed'); }
  }

  return <div className="app">
    <aside><div className="brand"><span className="brand-mark"><CarFront size={22} /></span><div><strong>Parkwise</strong><small>smart city operations</small></div></div>
      <nav><a className="active"><Activity size={17} />Overview</a><a href="#parking"><MapPin size={17} />Find parking</a><a href="#reservations"><CalendarCheck size={17} />Reservations</a><a href="#traffic"><ShieldCheck size={17} />Traffic</a></nav>
      <div className="side-note"><span className="pulse" />Systems operational<br /><small>Simulation mode · local data</small></div>
    </aside>
    <main>
      <header><div><p className="eyebrow">CITY MOBILITY / LIVE CONSOLE</p><h1>{user ? `Good morning, ${user.name.split(' ')[0]}.` : 'Move through the city smarter.'}</h1><p className="muted">Find parking, understand traffic, and reserve your next space.</p></div><div className="account-actions">{user ? <><span className="user-label">{user.email}</span><button className="outline" onClick={signOut}>Sign out</button></> : <button className="outline" onClick={() => document.getElementById('auth-panel').scrollIntoView({ behavior: 'smooth' })}>Sign in / Register</button>}</div></header>
      {message && <div className="notice">{message}</div>}
      {!user && <section id="auth-panel" className="auth-panel"><div className="auth-copy"><p className="eyebrow">WELCOME TO PARKWISE</p><h2>One account for every journey.</h2><p className="muted">Register as a driver to search available spaces, view live traffic conditions, and reserve parking in seconds.</p><div className="auth-highlights"><span><MapPin size={16} /> Search nearby parking</span><span><Activity size={16} /> Monitor traffic zones</span><span><CalendarCheck size={16} /> Keep reservations together</span></div></div><form className="auth-card" onSubmit={submitAuth}><div className="auth-tabs"><button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => setAuthMode('login')}><LogIn size={15} />Login</button><button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => setAuthMode('register')}><UserPlus size={15} />Register</button></div><h3>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h3>{authMode === 'register' && <input required placeholder="Full name" value={credentials.name} onChange={event => setCredentials({ ...credentials, name: event.target.value })} />}<input required type="email" placeholder="Email address" value={credentials.email} onChange={event => setCredentials({ ...credentials, email: event.target.value })} /><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={credentials.password} onChange={event => setCredentials({ ...credentials, password: event.target.value })} /><button className="primary" type="submit">{authMode === 'login' ? <><LogIn size={16} />Login to dashboard</> : <><UserPlus size={16} />Create driver account</>}</button><small className="demo-hint">Demo: driver@parking.local / Driver@123</small></form></section>}
      <section className="stats"><div><span className="icon blue"><MapPin /></span><div><b>{locations.length}</b><small>parking hubs</small></div></div><div><span className="icon green"><CarFront /></span><div><b>{locations.reduce((total, location) => total + location.available, 0)}</b><small>spaces available</small></div></div><div><span className="icon amber"><Activity /></span><div><b>{traffic.filter(item => item.level === 'HIGH').length}</b><small>high traffic zones</small></div></div></section>
      <section id="parking" className="workspace"><div className="panel parking"><div className="panel-head"><div><p className="eyebrow">AVAILABILITY RADAR</p><h2>Search parking</h2></div><label className="search"><Search size={17} /><input placeholder="Search area, address, or garage" value={query} onChange={event => setQuery(event.target.value)} /></label></div><div className="location-grid">{locations.map(location => <article className="location" key={location.id} onClick={() => axios.get(`${API}/parking/locations/${location.id}`).then(response => setSelected(response.data))}><div className="location-top"><span className="tag">{location.area}</span><strong>{location.available} free</strong></div><h3>{location.name}</h3><p>{location.address}</p><div className="meter"><span style={{ width: `${Math.round(location.available / location.total * 100)}%` }} /></div><footer><span>${location.pricePerHour.toFixed(2)} / hour</span><button>View spaces <span>→</span></button></footer></article>)}</div>{locations.length === 0 && <div className="empty">No parking locations match “{query}”. Try another area.</div>}</div>
        <div id="traffic" className="panel traffic"><p className="eyebrow">MANGALURU TRAFFIC PULSE</p><h2>Road conditions</h2><p className="muted">Simulated Mangaluru telemetry · updated {new Date().toLocaleTimeString()}</p>{traffic.map(item => <div className="traffic-row" key={item.area}><div><b>{item.area}</b><small>{item.speed} km/h average · {item.incidents} incidents</small></div><span className={`level ${item.level.toLowerCase()}`}>{item.level}</span></div>)}</div></section>
      {user && <section id="reservations" className="panel reservations"><p className="eyebrow">YOUR JOURNEY</p><h2>My reservations</h2>{reservations.length ? reservations.map(item => <div className="reservation-row" key={item.id}><div><b>{item.location?.name}</b><small>{item.slot?.label} · {item.status}</small></div><span>{new Date(item.startTime).toLocaleDateString()}</span></div>) : <p className="muted">No reservations yet. Select a parking hub above to reserve a space.</p>}</section>}
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal" onClick={event => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><p className="eyebrow">{selected.area}</p><h2>{selected.name}</h2><p className="muted">{selected.description}</p><div className="slot-grid">{selected.slots.map(slot => <button disabled={slot.status !== 'AVAILABLE'} className={slot.status.toLowerCase()} key={slot.id} onClick={() => reserve(slot)}>{slot.label}<small>{slot.status}</small></button>)}</div></div></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
