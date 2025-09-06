const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt:', { 
        token: token.substring(0, 20) + '...', 
        error: err.message 
      });
      
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        message: 'The provided token is invalid or has expired'
      });
    }

    req.user = user;
    next();
  });
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Generate JWT token
const generateToken = (userData) => {
  const payload = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Verify and decode token without middleware
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
};

// Role-based authorization middleware
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    const userRoles = req.user.roles || ['user'];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      logger.warn('Insufficient permissions:', { 
        userId: req.user.id, 
        requiredRoles, 
        userRoles 
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${requiredRoles.join(', ')}`
      });
    }

    next();
  };
};

// Rate limiting middleware for sensitive operations
const rateLimitByUser = (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const userRequests = requests.get(userId) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded:', { 
        userId, 
        requestCount: validRequests.length, 
        maxRequests 
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Maximum ${maxRequests} requests per ${Math.floor(windowMs / 60000)} minutes.`,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }

    validRequests.push(now);
    requests.set(userId, validRequests);
    next();
  };
};

// API key authentication for external services
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide a valid API key in headers or query parameters'
    });
  }

  // TODO: Implement proper API key validation from database
  const validApiKeys = [
    process.env.ML_SERVICE_API_KEY,
    process.env.EXTERNAL_API_KEY
  ].filter(Boolean);

  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempt:', { 
      apiKey: apiKey.substring(0, 8) + '...', 
      ip: req.ip 
    });
    
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  req.apiKey = apiKey;
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken,
  requireRole,
  rateLimitByUser,
  authenticateApiKey
};
