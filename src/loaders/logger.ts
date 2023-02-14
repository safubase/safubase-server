'use strict';

// MODULES
import winston from 'winston';

// CONFIG
import config from '../config';

function load_logger(options: any) {
  const transports = [];

  if (config.env.NODE_ENV !== 'development') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.cli(), winston.format.splat()),
      }),
      new winston.transports.File({
        filename: 'logs.log',
        level: 'info',
      }),
    );
  } else {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.cli(), winston.format.splat()),
      }),
    );
  }

  const logger = winston.createLogger({
    level: 'info',
    levels: winston.config.npm.levels,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors(), winston.format.json()),
    transports,
  });

  return logger;
}

export default load_logger;
