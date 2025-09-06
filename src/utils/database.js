const { Pool } = require('pg');
const logger = require('./logger');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'engagement_intelligence',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.info('Database connected successfully');
      
      // Initialize database schema
      await this.initializeSchema();
      
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async initializeSchema() {
    try {
      const client = await this.pool.connect();
      
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id),
          course_id VARCHAR(255) REFERENCES courses(id),
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          total_duration INTEGER,
          interactions INTEGER DEFAULT 0,
          page_views INTEGER DEFAULT 0,
          completed_activities INTEGER DEFAULT 0,
          engagement_score DECIMAL(3,2),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS nudges (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id),
          course_id VARCHAR(255) REFERENCES courses(id),
          type VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          action_text VARCHAR(255),
          priority VARCHAR(50),
          delivery_channel VARCHAR(100),
          status VARCHAR(50) DEFAULT 'pending',
          sent_at TIMESTAMP,
          expires_at TIMESTAMP,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS nudge_interactions (
          id SERIAL PRIMARY KEY,
          nudge_id VARCHAR(255) REFERENCES nudges(id),
          user_id VARCHAR(255) REFERENCES users(id),
          interaction_type VARCHAR(100) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
          prefers_challenges BOOLEAN DEFAULT true,
          best_time_to_nudge TIME DEFAULT '14:00:00',
          effective_nudge_types TEXT[],
          timezone VARCHAR(100) DEFAULT 'UTC',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS engagement_analytics (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id),
          course_id VARCHAR(255) REFERENCES courses(id),
          date DATE NOT NULL,
          avg_engagement_score DECIMAL(3,2),
          total_sessions INTEGER DEFAULT 0,
          total_duration INTEGER DEFAULT 0,
          total_interactions INTEGER DEFAULT 0,
          drop_off_events INTEGER DEFAULT 0,
          nudges_received INTEGER DEFAULT 0,
          nudges_clicked INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, course_id, date)
        );
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_course_id ON user_sessions(course_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON user_sessions(start_time);
        CREATE INDEX IF NOT EXISTS idx_nudges_user_id ON nudges(user_id);
        CREATE INDEX IF NOT EXISTS idx_nudges_sent_at ON nudges(sent_at);
        CREATE INDEX IF NOT EXISTS idx_nudge_interactions_nudge_id ON nudge_interactions(nudge_id);
        CREATE INDEX IF NOT EXISTS idx_engagement_analytics_date ON engagement_analytics(date);
      `);

      client.release();
      logger.info('Database schema initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  async query(text, params) {
    if (!this.isConnected || !this.pool) {
      logger.warn('Database not connected, skipping query');
      return null;
    }

    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', { error: error.message, query: text });
      throw error;
    }
  }

  async getClient() {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async disconnect() {
    if (this.pool) {
      try {
        await this.pool.end();
        this.isConnected = false;
        logger.info('Database disconnected');
      } catch (error) {
        logger.error('Error disconnecting from database:', error);
      }
    }
  }

  // Helper methods for common operations
  async insertUser(userData) {
    const { id, email, name } = userData;
    const query = `
      INSERT INTO users (id, email, name) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await this.query(query, [id, email, name]);
    return result.rows[0];
  }

  async insertCourse(courseData) {
    const { id, name, description } = courseData;
    const query = `
      INSERT INTO courses (id, name, description) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await this.query(query, [id, name, description]);
    return result.rows[0];
  }

  async insertSession(sessionData) {
    const { 
      id, user_id, course_id, start_time, end_time, 
      total_duration, interactions, page_views, 
      completed_activities, engagement_score, metadata 
    } = sessionData;
    
    const query = `
      INSERT INTO user_sessions (
        id, user_id, course_id, start_time, end_time, 
        total_duration, interactions, page_views, 
        completed_activities, engagement_score, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    
    const result = await this.query(query, [
      id, user_id, course_id, start_time, end_time,
      total_duration, interactions, page_views,
      completed_activities, engagement_score, JSON.stringify(metadata)
    ]);
    
    return result.rows[0];
  }

  async getUserEngagementStats(userId, timeframe = '7d') {
    const days = parseInt(timeframe.replace('d', ''));
    const query = `
      SELECT 
        AVG(engagement_score) as average_engagement,
        COUNT(*) as total_sessions,
        AVG(total_duration)/60 as average_session_duration,
        AVG(CASE WHEN completed_activities > 0 THEN 1.0 ELSE 0.0 END) as completion_rate
      FROM user_sessions 
      WHERE user_id = $1 
        AND start_time >= NOW() - INTERVAL '${days} days'
        AND end_time IS NOT NULL;
    `;
    
    const result = await this.query(query, [userId]);
    return result.rows[0];
  }

  async getAtRiskUsers(threshold = 0.3, limit = 10) {
    const query = `
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        s.engagement_score as current_engagement_score,
        s.start_time as last_activity,
        s.course_id,
        c.name as course_name,
        CASE 
          WHEN s.engagement_score < 0.2 THEN 'high'
          WHEN s.engagement_score < 0.3 THEN 'medium'
          ELSE 'low'
        END as risk_level
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      JOIN courses c ON s.course_id = c.id
      WHERE s.engagement_score < $1
        AND s.start_time >= NOW() - INTERVAL '24 hours'
      ORDER BY s.engagement_score ASC, s.start_time DESC
      LIMIT $2;
    `;
    
    const result = await this.query(query, [threshold, limit]);
    return result.rows;
  }
}

const database = new Database();

// Initialize database connection
if (process.env.NODE_ENV !== 'test') {
  database.connect().catch(err => {
    logger.error('Failed to initialize database connection:', err);
  });
}

module.exports = database;
