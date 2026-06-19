"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error(`[${new Date().toISOString()}] Error: ${err.message}`, err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        data: null
    });
}
//# sourceMappingURL=errorHandler.js.map