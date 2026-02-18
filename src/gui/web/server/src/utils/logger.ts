import winston from 'winston'

/**
 * Custom log format for winston logger.
 *
 * Configured to output logs with:
 * - Timestamp in YYYY-MM-DD HH:mm:ss format
 * - Error stack traces when available
 * - Colorized output for console
 * - Format: "YYYY-MM-DD HH:mm:ss [LEVEL]: message"
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`
  })
)

/**
 * Application-wide winston logger instance.
 *
 * Configured with:
 * - Log level from LOG_LEVEL environment variable (default: "info")
 * - Console transport with colorized output
 * - Custom format including timestamps and stack traces
 *
 * Available log levels (in order): error, warn, info, http, verbose, debug, silly
 *
 * @example
 * logger.info('Server started on port 5000')
 * logger.error('Failed to connect to database:', error)
 * logger.debug('Request payload:', data)
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
})
