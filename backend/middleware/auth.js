/**
 * Auth Middleware
 * Protects admin-only routes using JWT token verification
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../data/store');

/**
 * Middleware: verifyAdmin
 * Checks for a valid JWT in the Authorization header.
 * Usage: router.get('/protected', verifyAdmin, (req, res) => {...})
 */
function verifyAdmin(req, res, next) {
  // Extract token from "Bearer <token>" header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // Attach admin info to request
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token. Please login again.' 
    });
  }
}

module.exports = { verifyAdmin };
