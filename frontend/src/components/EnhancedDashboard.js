import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  RadialBarChart, RadialBar, Legend, ScatterChart, Scatter
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
];

const EnhancedDashboard = ({ socket }) => {
  // Enhanced state management
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
  const [viewMode, setViewMode] = useState('overview');
  const [filters, setFilters] = useState({ segment: 'all', course: 'all' });
  const intervalRef = useRef(null);

  // Animation hook for counting up numbers
  const useCountUp = (end, duration = 1000) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (end === 0) return;
      
      let start = 0;
      const increment = end / (duration / 10);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 10);
      
      return () => clearInterval(timer);
    }, [end, duration]);
    
    return count;
  };

  // Enhanced data fetching with error handling and caching
  const fetchDashboardData = async () => {
    try {
      const [overviewRes, alertsRes, feedRes, metricsRes] = await Promise.all([
        axios.get(`/api/dashboard/overview?timeframe=${timeRange}`),
        axios.get('/api/dashboard/alerts?limit=10'),
        axios.get('/api/dashboard/live-feed?limit=15'),
        axios.get('/api/dashboard/metrics/summary')
      ]);
      
      setDashboardData(overviewRes.data.data);
      setAlerts(alertsRes.data.alerts || []);
      setLiveFeed(feedRes.data.feed || []);
      setMetrics(metricsRes.data.metrics || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Set default data if API fails
      setDashboardData({
        summary: {
          totalActiveUsers: 0,
          averageEngagementScore: 0,
          totalSessions: 0,
          dropOffAlerts: 0,
          nudgesSentToday: 0,
          nudgeClickRate: 0
        },
        hourlyTrends: [],
        topCourses: []
      });
      setAlerts([]);
      setLiveFeed([]);
      setMetrics({});
      setLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchDashboardData, 30000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeRange, autoRefresh]);

  // WebSocket handlers for real-time updates
  useEffect(() => {
    if (socket) {
      // Join dashboard room for real-time updates
      socket.emit('join_dashboard');
      
      socket.on('system_notification', (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        setLiveFeed(prev => [notification, ...prev.slice(0, 14)]);
      });

      socket.on('engagement_update', (data) => {
        setDashboardData(prev => prev ? { ...prev, ...data } : null);
      });

      socket.on('alert_triggered', (alert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 9)]);
      });
      
      // Handle real-time metrics updates
      socket.on('metrics_update', (metrics) => {
        console.log('Real-time metrics received:', metrics);
        setDashboardData(prev => ({
          ...prev,
          summary: {
            totalActiveUsers: metrics.activeNow || 0,
            averageEngagementScore: metrics.engagementRate || 0,
            totalSessions: prev?.summary?.totalSessions || 0,
            dropOffAlerts: Math.floor((metrics.activeNow || 0) * (metrics.dropOffRate || 0.18)),
            nudgesSentToday: metrics.newSignupsToday || 0,
            nudgeClickRate: metrics.nudgeClickRate || 0
          }
        }));
      });
      
      // Handle new activity updates
      socket.on('new_activity', (activity) => {
        setLiveFeed(prev => [activity, ...prev.slice(0, 14)]);
      });

      return () => {
        socket.off('system_notification');
        socket.off('engagement_update');
        socket.off('alert_triggered');
        socket.off('metrics_update');
        socket.off('new_activity');
      };
    }
  }, [socket]);

  // Utility functions
  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString();
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

  const resolveAlert = async (alertId) => {
    try {
      await axios.post(`/api/dashboard/alerts/${alertId}/resolve`, {
        resolution: 'manual',
        notes: 'Resolved from dashboard'
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // Custom components
  const MetricCard = ({ title, value, trend, icon, color, subtitle }) => {
    const animatedValue = useCountUp(value);
    
    return (
      <div className="metric-card enhanced" style={{ borderTop: `4px solid ${color}` }}>
        <div className="metric-header">
          <div className="metric-icon" style={{ backgroundColor: color + '20', color }}>
            {icon}
          </div>
          <div className="metric-trend">
            {trend > 0 ? '📈' : trend < 0 ? '📉' : '➖'}
            <span className={trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}>
              {Math.abs(trend)}%
            </span>
          </div>
        </div>
        <div className="metric-content">
          <h3>{title}</h3>
          <div className="metric-value-container">
            <div className="metric-value animated">
              {typeof value === 'number' ? animatedValue.toLocaleString() : value}
            </div>
            {subtitle && <div className="metric-subtitle">{subtitle}</div>}
          </div>
        </div>
      </div>
    );
  };

  const ChartContainer = ({ title, children, controls, fullWidth = false }) => (
    <div className={`chart-container enhanced ${fullWidth ? 'full-width' : ''}`}>
      <div className="chart-header">
        <h3>{title}</h3>
        {controls && <div className="chart-controls">{controls}</div>}
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard enhanced loading">
        <div className="loading-container">
          <div className="loading-spinner enhanced"></div>
          <div className="loading-text">Loading intelligent insights...</div>
        </div>
      </div>
    );
  }

  const engagementDistributionData = dashboardData ? [
    { name: 'High Engagement', value: dashboardData.engagementDistribution.high.count, color: COLORS[1] },
    { name: 'Medium Engagement', value: dashboardData.engagementDistribution.medium.count, color: COLORS[2] },
    { name: 'Low Engagement', value: dashboardData.engagementDistribution.low.count, color: COLORS[3] }
  ] : [];

  const performanceData = dashboardData?.topCourses?.map(course => ({
    name: course.courseName.slice(0, 15) + '...',
    engagement: Math.round(course.avgEngagement * 100),
    users: course.activeUsers,
    completion: Math.round(course.completionRate * 100)
  })) || [];

  return (
    <div className="dashboard enhanced">
      {/* Enhanced Header with Controls */}
      <div className="dashboard-header enhanced">
        <div className="header-left">
          <h2>🎯 Engagement Intelligence Dashboard</h2>
          <div className="header-subtitle">
            Real-time insights • Last updated: {formatTime(Date.now())}
          </div>
        </div>
        <div className="header-controls">
          <div className="time-range-selector">
            {['1h', '6h', '24h', '7d', '30d'].map(range => (
              <button 
                key={range}
                className={`time-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            🔄 Auto-refresh
          </button>
          <div className="view-mode-selector">
            {['overview', 'detailed'].map(mode => (
              <button
                key={mode}
                className={`view-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Notifications Bar */}
      {notifications.length > 0 && (
        <div className="notifications-bar">
          <div className="notification-items">
            {notifications.slice(0, 3).map((notification, index) => (
              <div key={index} className="notification-item">
                <span className="notification-icon">🔔</span>
                <span className="notification-text">{notification.message}</span>
                <span className="notification-time">{formatTimeAgo(notification.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Metrics Grid */}
      <div className="metrics-grid enhanced">
        <MetricCard
          title="Active Users"
          value={dashboardData?.summary?.totalActiveUsers || 0}
          trend={5.2}
          icon="👥"
          color="#3498db"
          subtitle="Currently online"
        />
        <MetricCard
          title="Avg Engagement"
          value={`${((dashboardData?.summary?.averageEngagementScore || 0) * 100).toFixed(1)}%`}
          trend={2.1}
          icon="⚡"
          color="#2ecc71"
          subtitle="Across all courses"
        />
        <MetricCard
          title="Drop-off Alerts"
          value={dashboardData?.summary?.dropOffAlerts || 0}
          trend={-3.4}
          icon="⚠️"
          color="#e74c3c"
          subtitle="Require attention"
        />
        <MetricCard
          title="Nudge Success"
          value={`${((dashboardData?.summary?.nudgeClickRate || 0) * 100).toFixed(1)}%`}
          trend={7.8}
          icon="🎯"
          color="#f39c12"
          subtitle="Click-through rate"
        />
      </div>

      <div className="dashboard-content enhanced">
        <div className="dashboard-left">
          {/* Enhanced Engagement Trends */}
          <ChartContainer 
            title="📈 Engagement Trends" 
            controls={
              <select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="metric-selector"
              >
                <option value="engagement">Engagement</option>
                <option value="users">Active Users</option>
                <option value="nudges">Nudges Sent</option>
              </select>
            }
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dashboardData?.hourlyTrends || []}>
                <defs>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="avgEngagement" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorEngagement)"
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="#82ca9d" 
                  fillOpacity={1} 
                  fill="url(#colorUsers)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Course Performance Chart */}
          <ChartContainer title="🏆 Course Performance Analysis">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagement" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completion" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Engagement Distribution with enhanced visuals */}
          <ChartContainer title="🎪 Engagement Distribution">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={engagementDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {engagementDistributionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="dashboard-right">
          {/* Enhanced Alerts Panel */}
          <div className="alerts-panel enhanced">
            <div className="panel-header">
              <h3>🚨 Active Alerts</h3>
              <span className="alert-count">{alerts.length}</span>
            </div>
            <div className="alerts-list">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`alert-item enhanced ${alert.severity}`}>
                  <div className="alert-indicator"></div>
                  <div className="alert-content">
                    <div className="alert-header">
                      <span className="alert-title">{alert.title}</span>
                      <span className="alert-time">{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                    <div className="alert-message">{alert.message}</div>
                    {alert.status === 'active' && (
                      <button 
                        className="resolve-btn enhanced"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        ✓ Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="no-alerts">
                  <div className="no-alerts-icon">🎉</div>
                  <div>All clear! No active alerts</div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Live Activity Feed */}
          <div className="live-feed-panel enhanced">
            <div className="panel-header">
              <h3>📡 Live Activity</h3>
              <div className="live-indicator">
                <span className="pulse"></span>
                LIVE
              </div>
            </div>
            <div className="feed-list">
              {liveFeed.slice(0, 8).map((item, index) => (
                <div key={index} className="feed-item enhanced">
                  <div className="feed-avatar">
                    {item.type === 'session_start' ? '🚀' : 
                     item.type === 'high_engagement' ? '⭐' :
                     item.type === 'nudge_interaction' ? '👆' :
                     item.type === 'activity_completed' ? '✅' :
                     item.type === 'drop_off_warning' ? '⚠️' : '📊'}
                  </div>
                  <div className="feed-content">
                    <div className="feed-user">{item.userName}</div>
                    <div className="feed-details">{item.details}</div>
                    <div className="feed-meta">
                      <span className="feed-time">{formatTimeAgo(item.timestamp)}</span>
                      <span className="feed-type">{item.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
              {liveFeed.length === 0 && (
                <div className="no-activity">
                  <div className="no-activity-icon">💤</div>
                  <div>No recent activity</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="quick-actions-panel">
            <div className="panel-header">
              <h3>⚡ Quick Actions</h3>
            </div>
            <div className="actions-grid">
              <button className="action-btn" onClick={() => setViewMode('detailed')}>
                <span className="action-icon">📊</span>
                <span className="action-text">Detailed View</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📋</span>
                <span className="action-text">Export Report</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">🔧</span>
                <span className="action-text">Settings</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">👥</span>
                <span className="action-text">Manage Users</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
