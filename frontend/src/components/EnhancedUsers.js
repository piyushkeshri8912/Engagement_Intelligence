import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadialBarChart, RadialBar, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

const EnhancedUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    segment: 'all',
    course: 'all',
    engagementRange: 'all'
  });
  const [view, setView] = useState('list'); // 'list', 'cards', 'analytics'
  const [sortBy, setSortBy] = useState('engagement');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filters, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Mock comprehensive user data
      const mockUsers = generateMockUsers(500);
      setUsers(mockUsers);
      setPagination(prev => ({ ...prev, total: mockUsers.length }));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockUsers = (count) => {
    const segments = ['Enterprise', 'Individual', 'Student', 'Corporate'];
    const courses = [
      'Machine Learning Fundamentals',
      'Full Stack Web Development', 
      'Data Science with Python',
      'UX/UI Design Masterclass',
      'Cloud Computing with AWS',
      'Digital Marketing Strategy'
    ];
    const locations = ['New York', 'San Francisco', 'London', 'Toronto', 'Berlin', 'Tokyo', 'Sydney'];
    const companies = ['TechCorp Inc', 'Innovation Labs', 'StartupXYZ', 'GlobalTech', 'DataSoft', 'CloudSystems'];

    return Array.from({ length: count }, (_, i) => {
      const joinDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      const lastActive = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const engagementScore = Math.random();
      const riskLevel = engagementScore > 0.7 ? 'low' : engagementScore > 0.4 ? 'medium' : 'high';
      const segment = segments[Math.floor(Math.random() * segments.length)];
      
      return {
        id: `user_${i + 1}`,
        name: generateRandomName(),
        email: `user${i + 1}@example.com`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
        segment,
        company: segment === 'Enterprise' || segment === 'Corporate' ? 
          companies[Math.floor(Math.random() * companies.length)] : null,
        location: locations[Math.floor(Math.random() * locations.length)],
        joinDate: joinDate.toISOString(),
        lastActive: lastActive.toISOString(),
        
        // Engagement metrics
        engagementScore,
        riskLevel,
        totalSessionTime: Math.floor(Math.random() * 200 + 50), // hours
        coursesEnrolled: Math.floor(Math.random() * 8 + 1),
        coursesCompleted: Math.floor(Math.random() * 5),
        currentCourse: courses[Math.floor(Math.random() * courses.length)],
        
        // Learning analytics
        weeklyGoal: Math.floor(Math.random() * 10 + 5), // hours per week
        completionRate: Math.random() * 0.4 + 0.6,
        averageSessionDuration: Math.floor(Math.random() * 60 + 15), // minutes
        streakDays: Math.floor(Math.random() * 30),
        badgesEarned: Math.floor(Math.random() * 15),
        
        // Interaction data
        forumPosts: Math.floor(Math.random() * 20),
        questionsAsked: Math.floor(Math.random() * 15),
        peerInteractions: Math.floor(Math.random() * 50),
        nudgesReceived: Math.floor(Math.random() * 30 + 10),
        nudgeResponses: Math.floor(Math.random() * 20 + 5),
        
        // Performance data
        quizScores: Array.from({ length: 5 }, () => Math.floor(Math.random() * 30 + 70)),
        skillProgress: {
          'Technical Skills': Math.random(),
          'Problem Solving': Math.random(),
          'Communication': Math.random(),
          'Leadership': Math.random()
        },
        
        // Behavioral patterns
        preferredLearningTime: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
        deviceUsage: {
          desktop: Math.random() * 0.6 + 0.2,
          mobile: Math.random() * 0.5 + 0.1,
          tablet: Math.random() * 0.3 + 0.1
        },
        
        // Engagement history (last 30 days)
        engagementHistory: Array.from({ length: 30 }, (_, day) => ({
          date: new Date(Date.now() - day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          engagement: Math.random() * 0.5 + 0.4,
          sessionTime: Math.floor(Math.random() * 120),
          completedActivities: Math.floor(Math.random() * 5)
        })).reverse()
      };
    });
  };

  const generateRandomName = () => {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Drew'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Wilson'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.currentCourse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk level filter
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(user => user.riskLevel === filters.riskLevel);
    }

    // Segment filter
    if (filters.segment !== 'all') {
      filtered = filtered.filter(user => user.segment === filters.segment);
    }

    // Engagement range filter
    if (filters.engagementRange !== 'all') {
      const [min, max] = filters.engagementRange.split('-').map(Number);
      filtered = filtered.filter(user => user.engagementScore >= min && user.engagementScore < max);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'engagement':
          aVal = a.engagementScore;
          bVal = b.engagementScore;
          break;
        case 'lastActive':
          aVal = new Date(a.lastActive);
          bVal = new Date(b.lastActive);
          break;
        case 'joinDate':
          aVal = new Date(a.joinDate);
          bVal = new Date(b.joinDate);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const getUserAnalytics = () => {
    const analytics = {
      totalUsers: users.length,
      activeUsers: users.filter(u => new Date(u.lastActive) > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
      riskDistribution: {
        high: users.filter(u => u.riskLevel === 'high').length,
        medium: users.filter(u => u.riskLevel === 'medium').length,
        low: users.filter(u => u.riskLevel === 'low').length
      },
      segmentDistribution: users.reduce((acc, user) => {
        acc[user.segment] = (acc[user.segment] || 0) + 1;
        return acc;
      }, {}),
      avgEngagement: users.reduce((sum, user) => sum + user.engagementScore, 0) / users.length
    };
    return analytics;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}m ago`;
  };

  const UserCard = ({ user }) => (
    <div className="user-card" onClick={() => setSelectedUser(user)}>
      <div className="user-card-header">
        <img src={user.avatar} alt={user.name} className="user-avatar" />
        <div className="user-basic-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          {user.company && <span className="user-company">{user.company}</span>}
        </div>
        <div className={`risk-badge ${user.riskLevel}`}>
          {user.riskLevel} risk
        </div>
      </div>
      
      <div className="user-metrics">
        <div className="metric">
          <label>Engagement</label>
          <div className="engagement-bar">
            <div 
              className="engagement-fill" 
              style={{ width: `${user.engagementScore * 100}%` }}
            ></div>
          </div>
          <span>{(user.engagementScore * 100).toFixed(0)}%</span>
        </div>
        
        <div className="user-stats">
          <div className="stat">
            <span className="stat-value">{user.coursesCompleted}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{user.streakDays}</span>
            <span className="stat-label">Day Streak</span>
          </div>
          <div className="stat">
            <span className="stat-value">{user.totalSessionTime}h</span>
            <span className="stat-label">Total Time</span>
          </div>
        </div>
      </div>
      
      <div className="user-card-footer">
        <span className="current-course">{user.currentCourse}</span>
        <span className="last-active">Active {formatTimeAgo(user.lastActive)}</span>
      </div>
    </div>
  );

  const UserDetailModal = () => {
    if (!selectedUser) return null;

    return (
      <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
        <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelectedUser(null)}>×</button>
          
          <div className="user-detail-header">
            <img src={selectedUser.avatar} alt={selectedUser.name} className="detail-avatar" />
            <div className="detail-basic-info">
              <h2>{selectedUser.name}</h2>
              <p>{selectedUser.email}</p>
              <div className="detail-meta">
                <span className="segment-badge">{selectedUser.segment}</span>
                <span className={`risk-badge ${selectedUser.riskLevel}`}>
                  {selectedUser.riskLevel} risk
                </span>
              </div>
            </div>
          </div>

          <div className="user-detail-content">
            <div className="detail-tabs">
              <button className="tab-btn active">Overview</button>
              <button className="tab-btn">Engagement</button>
              <button className="tab-btn">Performance</button>
              <button className="tab-btn">Activity</button>
            </div>

            <div className="detail-grid">
              <div className="detail-section">
                <h3>📊 Engagement Overview</h3>
                <div className="engagement-chart">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={selectedUser.engagementHistory.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                      <YAxis domain={[0, 1]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="engagement" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="detail-section">
                <h3>🎯 Performance Metrics</h3>
                <div className="performance-grid">
                  <div className="perf-metric">
                    <label>Completion Rate</label>
                    <div className="progress-ring">
                      <div className="progress-value">{(selectedUser.completionRate * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="perf-metric">
                    <label>Avg Session</label>
                    <div className="metric-value">{selectedUser.averageSessionDuration}min</div>
                  </div>
                  <div className="perf-metric">
                    <label>Badges Earned</label>
                    <div className="metric-value">{selectedUser.badgesEarned}</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>💬 Social Engagement</h3>
                <div className="social-metrics">
                  <div className="social-metric">
                    <span className="social-icon">💬</span>
                    <span>{selectedUser.forumPosts} Forum Posts</span>
                  </div>
                  <div className="social-metric">
                    <span className="social-icon">❓</span>
                    <span>{selectedUser.questionsAsked} Questions</span>
                  </div>
                  <div className="social-metric">
                    <span className="social-icon">🤝</span>
                    <span>{selectedUser.peerInteractions} Peer Interactions</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>🔔 Nudge Response</h3>
                <div className="nudge-stats">
                  <div className="nudge-metric">
                    <label>Nudges Received</label>
                    <span>{selectedUser.nudgesReceived}</span>
                  </div>
                  <div className="nudge-metric">
                    <label>Response Rate</label>
                    <span>{((selectedUser.nudgeResponses / selectedUser.nudgesReceived) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const analytics = getUserAnalytics();
  const paginatedUsers = filteredUsers.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  if (loading) {
    return (
      <div className="users-loading">
        <div className="loading-spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="users-container enhanced">
      <div className="users-header">
        <div className="header-content">
          <h1>👥 User Management & Analytics</h1>
          <p>Comprehensive user engagement tracking and management system</p>
        </div>
        
        <div className="users-analytics-cards">
          <div className="analytics-card">
            <h3>Total Users</h3>
            <div className="analytics-value">{analytics.totalUsers.toLocaleString()}</div>
          </div>
          <div className="analytics-card">
            <h3>Active This Week</h3>
            <div className="analytics-value">{analytics.activeUsers.toLocaleString()}</div>
          </div>
          <div className="analytics-card">
            <h3>Avg Engagement</h3>
            <div className="analytics-value">{(analytics.avgEngagement * 100).toFixed(1)}%</div>
          </div>
          <div className="analytics-card">
            <h3>High Risk Users</h3>
            <div className="analytics-value high-risk">{analytics.riskDistribution.high}</div>
          </div>
        </div>
      </div>

      <div className="users-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search users by name, email, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-section">
          <select 
            value={filters.riskLevel}
            onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
          
          <select 
            value={filters.segment}
            onChange={(e) => setFilters({...filters, segment: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Segments</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Individual">Individual</option>
            <option value="Student">Student</option>
            <option value="Corporate">Corporate</option>
          </select>
        </div>
        
        <div className="view-controls">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="engagement">Sort by Engagement</option>
            <option value="name">Sort by Name</option>
            <option value="lastActive">Sort by Last Active</option>
            <option value="joinDate">Sort by Join Date</option>
          </select>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              📋 List
            </button>
            <button 
              className={`view-btn ${view === 'cards' ? 'active' : ''}`}
              onClick={() => setView('cards')}
            >
              🗃️ Cards
            </button>
          </div>
        </div>
      </div>

      <div className="users-content">
        {view === 'cards' ? (
          <div className="users-grid">
            {paginatedUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Segment</th>
                  <th>Engagement</th>
                  <th>Current Course</th>
                  <th>Risk Level</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => (
                  <tr key={user.id} onClick={() => setSelectedUser(user)} className="table-row">
                    <td className="user-cell">
                      <img src={user.avatar} alt={user.name} className="table-avatar" />
                      <div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className="segment-badge">{user.segment}</span>
                    </td>
                    <td>
                      <div className="engagement-cell">
                        <div className="engagement-bar small">
                          <div 
                            className="engagement-fill" 
                            style={{ width: `${user.engagementScore * 100}%` }}
                          ></div>
                        </div>
                        <span>{(user.engagementScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="course-cell">{user.currentCourse}</td>
                    <td>
                      <span className={`risk-badge small ${user.riskLevel}`}>
                        {user.riskLevel}
                      </span>
                    </td>
                    <td>{formatTimeAgo(user.lastActive)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn">📧 Message</button>
                        <button className="action-btn">🔔 Nudge</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pagination-controls">
        <button 
          onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={pagination.page === 1}
        >
          ← Previous
        </button>
        <span>
          Page {pagination.page} of {Math.ceil(filteredUsers.length / pagination.limit)}
        </span>
        <button 
          onClick={() => setPagination(prev => ({ 
            ...prev, 
            page: Math.min(Math.ceil(filteredUsers.length / pagination.limit), prev.page + 1) 
          }))}
          disabled={pagination.page >= Math.ceil(filteredUsers.length / pagination.limit)}
        >
          Next →
        </button>
      </div>

      <UserDetailModal />
    </div>
  );
};

export default EnhancedUsers;
