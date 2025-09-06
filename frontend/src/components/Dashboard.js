import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  RadialBarChart, RadialBar, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = ({ socket }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('engagement');
  const [animatedValues, setAnimatedValues] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
    fetchLiveFeed();
    fetchMetrics();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchLiveFeed();
      fetchMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('system_notification', (notification) => {
        console.log('System notification:', notification);
        // Add to live feed
        setLiveFeed(prev => [notification, ...prev.slice(0, 19)]);
      });

      socket.on('engagement_update', (data) => {
        console.log('Engagement update:', data);
        // Update real-time metrics if needed
      });

      return () => {
        socket.off('system_notification');
        socket.off('engagement_update');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard/overview');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/dashboard/alerts?limit=5');
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchLiveFeed = async () => {
    try {
      const response = await axios.get('/api/dashboard/live-feed?limit=10');
      setLiveFeed(response.data.feed);
    } catch (error) {
      console.error('Error fetching live feed:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await axios.get('/api/dashboard/metrics/summary');
      setMetrics(response.data.metrics);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await axios.post(`/api/dashboard/alerts/${alertId}/resolve`, {
        resolution: 'manual',
        notes: 'Resolved from dashboard'
      });
      fetchAlerts(); // Refresh alerts
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  const engagementDistributionData = dashboardData ? [
    { name: 'High Engagement', value: dashboardData.engagementDistribution.high.count, color: COLORS[1] },
    { name: 'Medium Engagement', value: dashboardData.engagementDistribution.medium.count, color: COLORS[2] },
    { name: 'Low Engagement', value: dashboardData.engagementDistribution.low.count, color: COLORS[3] }
  ] : [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Real-time Engagement Dashboard</h2>
        <div className="last-updated">
          Last updated: {formatTime(Date.now())}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Active Users</h3>
          <div className="metric-value">{dashboardData?.summary?.totalActiveUsers || 0}</div>
          <div className="metric-trend">
            {metrics.activeUsers?.trend === 'up' ? '📈' : '📉'} 
            {metrics.activeUsers?.change || 0}
          </div>
        </div>

        <div className="metric-card">
          <h3>Avg Engagement</h3>
          <div className="metric-value">
            {((dashboardData?.summary?.averageEngagementScore || 0) * 100).toFixed(1)}%
          </div>
          <div className="metric-trend">
            {metrics.engagement?.trend === 'up' ? '📈' : '📉'} 
            {((metrics.engagement?.change || 0) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="metric-card">
          <h3>Drop-off Alerts</h3>
          <div className="metric-value alert">{dashboardData?.summary?.dropOffAlerts || 0}</div>
          <div className="metric-trend">
            {metrics.dropOffRate?.trend === 'down' ? '📈' : '📉'} 
            {((metrics.dropOffRate?.change || 0) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="metric-card">
          <h3>Nudge Click Rate</h3>
          <div className="metric-value">
            {((dashboardData?.summary?.nudgeClickRate || 0) * 100).toFixed(1)}%
          </div>
          <div className="metric-trend">
            {metrics.nudgeEffectiveness?.trend === 'up' ? '📈' : '📉'} 
            {((metrics.nudgeEffectiveness?.change || 0) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-left">
          {/* Engagement Trends Chart */}
          <div className="chart-container">
            <h3>Engagement Trends (24h)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData?.hourlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgEngagement" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="activeUsers" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Distribution */}
          <div className="chart-container">
            <h3>Current Engagement Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {engagementDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-right">
          {/* Alerts Panel */}
          <div className="alerts-panel">
            <h3>Active Alerts</h3>
            <div className="alerts-list">
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.severity}`}>
                  <div className="alert-header">
                    <span className="alert-title">{alert.title}</span>
                    <span className="alert-time">{formatTimeAgo(alert.timestamp)}</span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  {alert.status === 'active' && (
                    <button 
                      className="resolve-btn"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="no-alerts">No active alerts</div>
              )}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="live-feed-panel">
            <h3>Live Activity Feed</h3>
            <div className="feed-list">
              {liveFeed.map(item => (
                <div key={item.id} className="feed-item">
                  <div className="feed-icon">
                    {item.type === 'session_start' ? '🚀' : 
                     item.type === 'high_engagement' ? '⭐' :
                     item.type === 'nudge_interaction' ? '👆' :
                     item.type === 'activity_completed' ? '✅' :
                     item.type === 'drop_off_warning' ? '⚠️' : '📊'}
                  </div>
                  <div className="feed-content">
                    <div className="feed-user">{item.userName}</div>
                    <div className="feed-details">{item.details}</div>
                    <div className="feed-time">{formatTimeAgo(item.timestamp)}</div>
                  </div>
                </div>
              ))}
              {liveFeed.length === 0 && (
                <div className="no-activity">No recent activity</div>
              )}
            </div>
          </div>

          {/* Top Courses */}
          <div className="top-courses-panel">
            <h3>Top Courses</h3>
            <div className="courses-list">
              {dashboardData?.topCourses?.map(course => (
                <div key={course.courseId} className="course-item">
                  <div className="course-name">{course.courseName}</div>
                  <div className="course-stats">
                    <span>{course.activeUsers} users</span>
                    <span>{(course.avgEngagement * 100).toFixed(0)}% engagement</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
