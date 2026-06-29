import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const consoleFormat = isProduction
  ? winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    )
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.simple()
    );

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'acetel-iams-api' },
  // Logs are written to stdout/stderr and captured by the container runtime.
  // File transports are intentionally omitted — the container filesystem is
  // read-only in the app directory and persistent log storage should be
  // handled by a dedicated logging service.
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
  ],
});

export default logger;
