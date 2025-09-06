import os
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import redis
import psycopg2
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize connections
redis_client = None
db_connection = None

class EngagementPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'session_duration', 'interactions_per_minute', 'page_views_per_session',
            'time_since_last_session', 'total_sessions', 'avg_engagement_score',
            'completion_rate', 'hour_of_day', 'day_of_week'
        ]
        
    def prepare_features(self, user_data):
        """Extract features from user session data"""
        features = {}
        
        # Session duration in minutes
        features['session_duration'] = user_data.get('session_duration', 0) / 60
        
        # Interactions per minute
        duration_minutes = max(features['session_duration'], 1)
        features['interactions_per_minute'] = user_data.get('interactions', 0) / duration_minutes
        
        # Page views per session
        features['page_views_per_session'] = user_data.get('page_views', 0)
        
        # Time since last session (hours)
        last_session = user_data.get('last_session_time', datetime.now())
        if isinstance(last_session, str):
            last_session = datetime.fromisoformat(last_session.replace('Z', '+00:00'))
        features['time_since_last_session'] = (datetime.now() - last_session).total_seconds() / 3600
        
        # Historical metrics
        features['total_sessions'] = user_data.get('total_sessions', 1)
        features['avg_engagement_score'] = user_data.get('avg_engagement_score', 0.5)
        features['completion_rate'] = user_data.get('completion_rate', 0)
        
        # Temporal features
        now = datetime.now()
        features['hour_of_day'] = now.hour
        features['day_of_week'] = now.weekday()
        
        return [features[name] for name in self.feature_names]
    
    def generate_synthetic_data(self, n_samples=1000):
        """Generate synthetic training data for demonstration"""
        np.random.seed(42)
        data = []
        
        for _ in range(n_samples):
            # Generate realistic user behavior patterns
            session_duration = np.random.exponential(20)  # minutes
            interactions_per_minute = np.random.gamma(2, 2)
            page_views_per_session = np.random.poisson(8)
            time_since_last_session = np.random.exponential(48)  # hours
            total_sessions = np.random.poisson(10) + 1
            avg_engagement_score = np.random.beta(2, 2)
            completion_rate = np.random.beta(3, 2)
            hour_of_day = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            
            # Define drop-off probability based on features
            drop_off_prob = (
                0.4 * (1 - avg_engagement_score) +
                0.3 * (1 / (1 + interactions_per_minute)) +
                0.2 * min(time_since_last_session / 168, 1) +  # 1 week = high risk
                0.1 * (1 - completion_rate)
            )
            
            # Add some noise and ensure probability is between 0 and 1
            drop_off_prob = max(0, min(1, drop_off_prob + np.random.normal(0, 0.1)))
            will_drop_off = np.random.random() < drop_off_prob
            
            data.append([
                session_duration, interactions_per_minute, page_views_per_session,
                time_since_last_session, total_sessions, avg_engagement_score,
                completion_rate, hour_of_day, day_of_week, int(will_drop_off)
            ])
        
        return pd.DataFrame(data, columns=self.feature_names + ['drop_off'])
    
    def train_model(self):
        """Train the engagement prediction model"""
        logger.info("Training engagement prediction model...")
        
        # Generate synthetic training data
        df = self.generate_synthetic_data(2000)
        
        X = df[self.feature_names]
        y = df['drop_off']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        logger.info(f"Model trained - Train accuracy: {train_score:.3f}, Test accuracy: {test_score:.3f}")
        
        # Save model
        self.save_model()
        
        return {
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'feature_importance': dict(zip(self.feature_names, self.model.feature_importances_))
        }
    
    def predict_drop_off_risk(self, user_data):
        """Predict drop-off risk for a user"""
        if self.model is None:
            self.load_model()
            
        if self.model is None:
            logger.warning("No trained model available, training new model...")
            self.train_model()
        
        features = self.prepare_features(user_data)
        features_scaled = self.scaler.transform([features])
        
        # Get probability of drop-off
        drop_off_prob = self.model.predict_proba(features_scaled)[0][1]
        
        # Calculate risk level
        if drop_off_prob > 0.7:
            risk_level = 'high'
        elif drop_off_prob > 0.4:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        # Get feature importance for this prediction
        feature_contributions = dict(zip(self.feature_names, features))
        
        return {
            'drop_off_probability': float(drop_off_prob),
            'risk_level': risk_level,
            'confidence': float(max(self.model.predict_proba(features_scaled)[0])),
            'feature_contributions': feature_contributions,
            'suggested_actions': self._get_suggested_actions(risk_level, feature_contributions)
        }
    
    def _get_suggested_actions(self, risk_level, features):
        """Get suggested actions based on risk level and feature values"""
        actions = []
        
        if risk_level == 'high':
            if features['interactions_per_minute'] < 1:
                actions.append('Send engaging micro-assessment')
            if features['time_since_last_session'] > 48:
                actions.append('Send reminder notification')
            if features['completion_rate'] < 0.3:
                actions.append('Connect with mentor')
            actions.append('Priority intervention required')
        
        elif risk_level == 'medium':
            if features['avg_engagement_score'] < 0.5:
                actions.append('Send motivational message')
            if features['page_views_per_session'] < 3:
                actions.append('Suggest relevant content')
            actions.append('Monitor closely')
        
        else:
            actions.append('Continue current approach')
            if features['completion_rate'] > 0.8:
                actions.append('Consider peer challenge')
        
        return actions
    
    def save_model(self):
        """Save trained model and scaler"""
        try:
            os.makedirs('models', exist_ok=True)
            joblib.dump(self.model, 'models/engagement_model.pkl')
            joblib.dump(self.scaler, 'models/scaler.pkl')
            logger.info("Model saved successfully")
        except Exception as e:
            logger.error(f"Error saving model: {e}")
    
    def load_model(self):
        """Load trained model and scaler"""
        try:
            if os.path.exists('models/engagement_model.pkl'):
                self.model = joblib.load('models/engagement_model.pkl')
                self.scaler = joblib.load('models/scaler.pkl')
                logger.info("Model loaded successfully")
                return True
        except Exception as e:
            logger.error(f"Error loading model: {e}")
        return False

# Initialize predictor
predictor = EngagementPredictor()

def init_connections():
    """Initialize Redis and database connections"""
    global redis_client, db_connection
    
    try:
        # Redis connection
        redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            db=int(os.getenv('REDIS_DB', 0)),
            decode_responses=True
        )
        redis_client.ping()
        logger.info("Connected to Redis")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None
    
    try:
        # Database connection
        db_connection = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432),
            database=os.getenv('DB_NAME', 'engagement_intelligence'),
            user=os.getenv('DB_USER', 'admin'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        logger.info("Connected to database")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        db_connection = None

# API Routes
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'ML Engagement Prediction Service',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': predictor.model is not None,
        'redis_connected': redis_client is not None,
        'db_connected': db_connection is not None
    })

@app.route('/predict/drop-off', methods=['POST'])
def predict_drop_off():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        prediction = predictor.predict_drop_off_risk(data)
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/model/train', methods=['POST'])
def train_model():
    try:
        results = predictor.train_model()
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    return jsonify({
        'model_loaded': predictor.model is not None,
        'feature_names': predictor.feature_names,
        'model_type': 'RandomForestClassifier',
        'last_trained': 'On startup' if predictor.model else 'Never'
    })

@app.route('/analytics/engagement-trends', methods=['GET'])
def engagement_trends():
    """Analyze engagement trends from historical data"""
    try:
        # This would normally query the database
        # For now, return mock trend data
        trends = {
            'hourly_patterns': [
                {'hour': i, 'avg_engagement': 0.3 + 0.4 * np.sin((i - 6) * np.pi / 12)}
                for i in range(24)
            ],
            'weekly_patterns': [
                {'day': i, 'avg_engagement': 0.5 + 0.2 * np.sin(i * np.pi / 3.5)}
                for i in range(7)
            ],
            'risk_distribution': {
                'high_risk': 15,
                'medium_risk': 35,
                'low_risk': 50
            }
        }
        
        return jsonify({
            'success': True,
            'trends': trends,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_connections()
    
    # Load or train model on startup
    if not predictor.load_model():
        logger.info("No existing model found, training new model...")
        try:
            predictor.train_model()
        except Exception as e:
            logger.error(f"Failed to train model on startup: {e}")
    
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
