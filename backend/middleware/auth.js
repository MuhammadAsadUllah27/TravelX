const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-secret";

// ── Auth middleware ──
function auth(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token. Access denied." });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token. Access denied." });
    }
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token. Please log in again." });
    }
    return res.status(401).json({ message: "Authentication failed." });
  }
}

// ── Admin middleware (runs after auth) ──
function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  });
}

module.exports = {
  auth,
  adminAuth
};