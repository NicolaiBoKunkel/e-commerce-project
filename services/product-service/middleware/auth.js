const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/**
 * Express middleware to authenticate requests using a JWT token.
 * 
 * The token is expected in the Authorization header as a Bearer token.
 * If valid, the decoded user object is attached to `req.user`.
 *
 * @function authenticateToken
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = user;
    next();
  });
};

/**
 * Express middleware to authorize admin-only routes.
 * 
 * Requires `req.user.role` to be "admin".
 *
 * @function requireAdmin
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
