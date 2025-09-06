import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, 
  ScatterChart, Scatter, RadialBarChart, RadialBar, Legend,
  Treemap, ComposedChart, FunnelChart, Funnel, LabelList
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const EnhancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    engagement: [],
    retention: [],
    courses: [],
    demographics: [],
    learning_paths: [],
    nudge_effectiveness: [],
    drop_off_analysis: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('engagement');
  const [timeframe, setTimeframe] = useState('30d');
  const [filters, setFilters] = useState({
    segment: 'all',
    course_category: 'all',
    user_type: 'all'
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe, filters]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/comprehensive', {
        params: { timeframe, ...filters }
      });
      setAnalyticsData(response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock data for demonstration
      setAnalyticsData({
        engagement: generateMockEngagementData(),
        retention: generateMockRetentionData(),
        courses: generateMockCourseData(),
        demographics: generateMockDemographicsData(),
        learning_paths: generateMockLearningPathsData(),
        nudge_effectiveness: generateMockNudgeData(),
        drop_off_analysis: generateMockDropOffData()
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock data generators
  const generateMockEngagementData = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      overall_engagement: Math.random() * 0.4 + 0.6,
      mobile_engagement: Math.random() * 0.3 + 0.5,
      desktop_engagement: Math.random() * 0.5 + 0.6,
      session_duration: Math.random() * 30 + 20,
      interactions: Math.floor(Math.random() * 50 + 30)
    }));
  };

  const generateMockRetentionData = () => {
    const cohorts = [];
    for (let i = 0; i < 12; i++) {
      const cohort = {
        month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
        initial_users: Math.floor(Math.random() * 1000 + 500),
        week_1: Math.random() * 0.2 + 0.8,
        week_2: Math.random() * 0.15 + 0.7,
        month_1: Math.random() * 0.15 + 0.6,
        month_3: Math.random() * 0.1 + 0.45,
        month_6: Math.random() * 0.1 + 0.3
      };
      cohorts.push(cohort);
    }
    return cohorts;
  };

  const generateMockCourseData = () => {
    const categories = ['Technology', 'Business', 'Design', 'Data Science', 'Personal Development'];
    return categories.map(category => ({
      category,
      total_enrollments: Math.floor(Math.random() * 5000 + 1000),
      avg_completion_rate: Math.random() * 0.3 + 0.5,
      avg_engagement: Math.random() * 0.2 + 0.7,
      revenue: Math.floor(Math.random() * 100000 + 50000),
      satisfaction_score: Math.random() * 1 + 4
    }));
  };

  const generateMockDemographicsData = () => {
    return [
      { segment: 'Enterprise', users: 18300, engagement: 0.78, revenue: 542000 },
      { segment: 'Individual', users: 23600, engagement: 0.65, revenue: 234000 },
      { segment: 'Student', users: 10440, engagement: 0.71, revenue: 89000 },
      { segment: 'Corporate', users: 8900, engagement: 0.82, revenue: 445000 }
    ];
  };

  const generateMockLearningPathsData = () => {
    const paths = ['Full Stack Developer', 'Data Scientist', 'UX Designer', 'Cloud Architect', 'Digital Marketer'];
    return paths.map(path => ({
      name: path,
      enrollments: Math.floor(Math.random() * 3000 + 500),
      completion_rate: Math.random() * 0.3 + 0.4,
      avg_time_to_complete: Math.floor(Math.random() * 60 + 30),
      satisfaction: Math.random() * 1 + 4,
      job_placement_rate: Math.random() * 0.2 + 0.7
    }));
  };

  const generateMockNudgeData = () => {
    const types = ['Reminder', 'Motivation', 'Social', 'Progress', 'Achievement'];
    return types.map(type => ({
      type,
      sent: Math.floor(Math.random() * 5000 + 1000),
      opened: Math.floor(Math.random() * 3000 + 800),
      clicked: Math.floor(Math.random() * 1500 + 400),
      effectiveness: Math.random() * 0.3 + 0.5
    }));
  };

  const generateMockDropOffData = () => {
    return [
      { stage: 'Registration', users: 10000, drop_rate: 0.05 },
      { stage: 'First Lesson', users: 9500, drop_rate: 0.15 },
      { stage: 'Week 1', users: 8075, drop_rate: 0.22 },
      { stage: 'Month 1', users: 6299, drop_rate: 0.35 },
      { stage: 'Month 3', users: 4094, drop_rate: 0.28 },
      { stage: 'Completion', users: 2948, drop_rate: 0.12 }
    ];
  };

  const TabButton = ({ tab, label, isActive, onClick }) => (
    <button
      className={`tab-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  const MetricCard = ({ title, value, change, icon, color }) => (
    <div className="analytics-metric-card">
      <div className="metric-icon" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <div className="metric-info">
        <h4>{title}</h4>
        <div className="metric-value">{value}</div>
        <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
        </div>
      </div>
    </div>
  );

  const renderEngagementAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-grid">
        <div className="analytics-chart large">
          <h3>📊 Engagement Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={analyticsData.engagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="overall_engagement"
                fill="#8884d8"
                stroke="#8884d8"
                fillOpacity={0.6}
                name="Overall Engagement"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="mobile_engagement"
                stroke="#82ca9d"
                name="Mobile"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="desktop_engagement"
                stroke="#ffc658"
                name="Desktop"
              />
              <Bar
                yAxisId="right"
                dataKey="session_duration"
                fill="#ff7300"
                name="Session Duration (min)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-chart">
          <h3>🎯 Engagement by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Desktop', value: 45, color: '#0088FE' },
                  { name: 'Mobile', value: 35, color: '#00C49F' },
                  { name: 'Tablet', value: 20, color: '#FFBB28' }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {[
                  { name: 'Desktop', value: 45, color: '#0088FE' },
                  { name: 'Mobile', value: 35, color: '#00C49F' },
                  { name: 'Tablet', value: 20, color: '#FFBB28' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="metrics-overview">
        <MetricCard
          title="Average Session Duration"
          value="24.7 min"
          change={+5.2}
          icon="⏱️"
          color="#3498db"
        />
        <MetricCard
          title="Daily Active Users"
          value="8,642"
          change={+12.3}
          icon="👥"
          color="#2ecc71"
        />
        <MetricCard
          title="Engagement Score"
          value="87.3%"
          change={+2.1}
          icon="⭐"
          color="#f39c12"
        />
        <MetricCard
          title="Content Interactions"
          value="156,234"
          change={+18.7}
          icon="🔄"
          color="#9b59b6"
        />
      </div>
    </div>
  );

  const renderRetentionAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-chart large">
        <h3>📈 Cohort Retention Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={analyticsData.retention}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="week_1" stroke="#8884d8" name="Week 1" strokeWidth={2} />
            <Line type="monotone" dataKey="week_2" stroke="#82ca9d" name="Week 2" strokeWidth={2} />
            <Line type="monotone" dataKey="month_1" stroke="#ffc658" name="Month 1" strokeWidth={2} />
            <Line type="monotone" dataKey="month_3" stroke="#ff7300" name="Month 3" strokeWidth={2} />
            <Line type="monotone" dataKey="month_6" stroke="#0088FE" name="Month 6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderCourseAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-chart large">
        <h3>📚 Course Performance by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analyticsData.courses}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_enrollments" fill="#8884d8" name="Enrollments" />
            <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDemographicsAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-grid">
        <div className="analytics-chart">
          <h3>👥 User Segments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={analyticsData.demographics}
              dataKey="users"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
            />
          </ResponsiveContainer>
        </div>
        
        <div className="analytics-chart">
          <h3>💰 Revenue by Segment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.demographics}
                dataKey="revenue"
                nameKey="segment"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ segment, percent }) => `${segment}: ${(percent * 100).toFixed(0)}%`}
              >
                {analyticsData.demographics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderNudgeEffectiveness = () => (
    <div className="analytics-section">
      <div className="analytics-chart large">
        <h3>🎯 Nudge Campaign Effectiveness</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analyticsData.nudge_effectiveness}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sent" fill="#8884d8" name="Sent" />
            <Bar dataKey="opened" fill="#82ca9d" name="Opened" />
            <Bar dataKey="clicked" fill="#ffc658" name="Clicked" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDropOffAnalysis = () => (
    <div className="analytics-section">
      <div className="analytics-chart large">
        <h3>📉 User Journey Drop-off Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analyticsData.drop_off_analysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="users" fill="#8884d8" name="Users Remaining" />
            <Bar dataKey="drop_rate" fill="#ff7300" name="Drop Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading comprehensive analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container enhanced">
      <div className="analytics-header">
        <div className="header-content">
          <h1>📊 Advanced Analytics & Insights</h1>
          <p>Comprehensive data analysis and intelligence for engagement optimization</p>
        </div>
        
        <div className="analytics-controls">
          <div className="timeframe-selector">
            {['7d', '30d', '90d', '1y'].map(period => (
              <button
                key={period}
                className={`timeframe-btn ${timeframe === period ? 'active' : ''}`}
                onClick={() => setTimeframe(period)}
              >
                {period}
              </button>
            ))}
          </div>
          
          <div className="filter-controls">
            <select
              value={filters.segment}
              onChange={(e) => setFilters({...filters, segment: e.target.value})}
              className="filter-select"
            >
              <option value="all">All Segments</option>
              <option value="enterprise">Enterprise</option>
              <option value="individual">Individual</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
      </div>

      <div className="analytics-tabs">
        <TabButton
          tab="engagement"
          label="📈 Engagement"
          isActive={activeTab === 'engagement'}
          onClick={() => setActiveTab('engagement')}
        />
        <TabButton
          tab="retention"
          label="🔄 Retention"
          isActive={activeTab === 'retention'}
          onClick={() => setActiveTab('retention')}
        />
        <TabButton
          tab="courses"
          label="📚 Courses"
          isActive={activeTab === 'courses'}
          onClick={() => setActiveTab('courses')}
        />
        <TabButton
          tab="demographics"
          label="👥 Demographics"
          isActive={activeTab === 'demographics'}
          onClick={() => setActiveTab('demographics')}
        />
        <TabButton
          tab="nudges"
          label="🎯 Nudges"
          isActive={activeTab === 'nudges'}
          onClick={() => setActiveTab('nudges')}
        />
        <TabButton
          tab="dropoff"
          label="📉 Drop-off"
          isActive={activeTab === 'dropoff'}
          onClick={() => setActiveTab('dropoff')}
        />
      </div>

      <div className="analytics-content">
        {activeTab === 'engagement' && renderEngagementAnalytics()}
        {activeTab === 'retention' && renderRetentionAnalytics()}
        {activeTab === 'courses' && renderCourseAnalytics()}
        {activeTab === 'demographics' && renderDemographicsAnalytics()}
        {activeTab === 'nudges' && renderNudgeEffectiveness()}
        {activeTab === 'dropoff' && renderDropOffAnalysis()}
      </div>
    </div>
  );
};

export default EnhancedAnalytics;
