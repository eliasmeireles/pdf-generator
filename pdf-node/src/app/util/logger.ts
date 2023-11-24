import moment from "moment-timezone";

import winston from "winston";

import os from "os";

const hostname = os.hostname()

const loggerFormat = winston.format.printf(({message}) => message.toString())

const myErrorFormat = winston.format.printf(({message}) => {
    const timestamp = moment(new Date()).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:SS')
    return `{'timestamp': '${timestamp}', 'service':'pdf-node-server', 'level':'ERROR', 'meta': '${message}'}`
})

export  type LoggerLevel = {
    level: 'INFO' | 'WARN' | 'ERROR',
}

const newrelicLogger = ({level}: LoggerLevel) => winston.createLogger({
    level: level ?? 'INFO',
    format: loggerFormat,
    transports: [
        new winston.transports.File({
            filename: `./logs/${hostname}-pdf-node-server-newrelic-insights.log`,
        }),
    ],
})

const errorLogger = winston.createLogger({
    level: 'error',
    format: myErrorFormat,
    transports: [
        new winston.transports.File({
            filename: `./logs/${hostname}-pdf-node-server-service-monitor.log`,
        }),
    ],
})

exports.error = (message: string) => {
    errorLogger.error(message)
}

exports.newrelic = ({error, transactionSubType, message, level}: {
    level: LoggerLevel,
    transactionSubType: string,
    message: string,
    error?: any
}) => {

    const newrelicInsights = {
        level: level,
        appName: 'pdf-node-server',
        transactionSubType,
        eventType: 'Transaction',
        dateTime: moment(new Date()).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:SS'),
        message,
        error,
        pod: hostname,
    }

    newrelicLogger(level).info(JSON.stringify(newrelicInsights))
}
