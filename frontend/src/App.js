import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import io from 'socket.io-client';
import EnhancedDashboard from './components/EnhancedDashboard';
import EnhancedAnalytics from './components/EnhancedAnalytics';
import EnhancedUsers from './components/EnhancedUsers';
import './App.css';
import './components/EnhancedDashboard.css';
import './components/EnhancedAnalytics.css';
import './components/EnhancedUsers.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');
    
    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      setConnectionStatus('error');
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav className="navbar">
            <div className="nav-brand">
              <h1>Engagement Intelligence</h1>
              <span className={`connection-status ${connectionStatus}`}>
                {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'error' ? '🔴' : '🟡'}
                {connectionStatus}
              </span>
            </div>
            <ul className="nav-links">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/analytics">Analytics</Link></li>
              <li><Link to="/users">Users</Link></li>
            </ul>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<EnhancedDashboard socket={socket} />} />
            <Route path="/analytics" element={<EnhancedAnalytics />} />
            <Route path="/users" element={<EnhancedUsers />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
