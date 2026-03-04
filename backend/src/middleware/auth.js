"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.checkRole = checkRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access token required');
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).send('Server misconfigured');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (e) {
        return res.status(403).send('Invalid or expired token');
    }
}
function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send('Authentication required');
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).send('Insufficient permissions');
        }
        next();
    };
}
