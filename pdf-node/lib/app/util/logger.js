"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const winston_1 = __importDefault(require("winston"));
const os_1 = __importDefault(require("os"));
const hostname = os_1.default.hostname();
const loggerFormat = winston_1.default.format.printf(({message}) => message.toString());
const myErrorFormat = winston_1.default.format.printf(({message}) => {
    const timestamp = (0, moment_timezone_1.default)(new Date()).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:SS');
    return `{'timestamp': '${timestamp}', 'service':'pdf-node-server', 'level':'ERROR', 'meta': '${message}'}`;
});
const newrelicLogger = (level) => winston_1.default.createLogger({
    level: level !== null && level !== void 0 ? level : 'info',
    format: loggerFormat,
    transports: [
        new winston_1.default.transports.File({
            filename: `./logs/${hostname}-pdf-node-server-newrelic-insights.log`,
        }),
    ],
});
const errorLogger = winston_1.default.createLogger({
    level: 'error',
    format: myErrorFormat,
    transports: [
        new winston_1.default.transports.File({
            filename: `./logs/${hostname}-pdf-node-server-service-monitor.log`,
        }),
    ],
});
exports.error = (message) => {
    errorLogger.error(message);
};
exports.newrelic = ({error, transactionSubType, message, level}) => {
    const newrelicInsights = {
        level: level,
        appName: 'pdf-node-server',
        transactionSubType,
        eventType: 'Transaction',
        dateTime: (0, moment_timezone_1.default)(new Date()).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:SS'),
        message,
        error,
        pod: hostname,
    };
    newrelicLogger(level).info(JSON.stringify(newrelicInsights));
};
//# sourceMappingURL=logger.js.map
