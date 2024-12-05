const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    if (req.path === "/api/auth/register" || req.path === "/api/auth/login") {
      return next();
    }

    const token = req.headers["authorization"]; // Retrieve the token from the Authorization header
    if (!token) return res.status(401).json({ message: "Access Denied" });

    try {
      const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      res.status(400).json({ message: "Invalid Token" });
    }
  };
};

module.exports = authMiddleware;
