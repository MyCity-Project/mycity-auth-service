import moment = require('moment-timezone');
import * as path from 'path';
import { format } from 'winston';
import * as winston from 'winston';
const DailyRotateFile = require('winston-daily-rotate-file');
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = NODE_ENV === 'development' ? 'debug' : 'info';

type LogLevel = 'error' | 'info' | 'warn' | 'debug';

const LOCAL_TIMEZONE = process.env.LOCAL_TIMEZONE || 'Europe/Helsinki';
export default class Logger {
    public static appendTimestamp = format((info, opts) => {
        if (opts.tz) {
            info.timestamp = moment().tz(opts.tz).format();
        }
        return info;
    });
    public static buildLogger = ({
        domain,
        logInConsole = true,
    }): winston.Logger => {
        const logPath = path.join(__dirname, '../../../public/log');
        const errorTransport = Logger.getErrorTransport(logPath);
        const infoTransport = Logger.getInfoTransport(logPath);
        const debugTransport = Logger.getDebugTransport(logPath);

        const transports = [errorTransport, infoTransport, debugTransport];
        if (logInConsole) {
            transports.push(Logger.getConsoleTransport(LOG_LEVEL));
        }

        return winston.createLogger({
            format: Logger.getFormat(domain),
            transports,
        });
    }
    public static getFormat = (domain: string) => {
        return format.combine(
            // format.colorize(),
            Logger.appendTimestamp({ tz: LOCAL_TIMEZONE }),
            format.timestamp(),
            format.align(),
            format.printf(
                info => {
                    const ts = info.timestamp.slice(0, 19).replace('T', ' ');
                    return `${ts} [${info.level}] [${domain}] ${info.message}`;
                },
            ),
        );
    }
    public static getInfoTransport = (logPath: string) => {
        return Logger.getFileTransport(logPath, 'info');
    }
    public static getDebugTransport = (logPath: string) => {
        return Logger.getFileTransport(logPath, 'debug');
    }
    public static getErrorTransport = (logPath: string) => {
        return Logger.getFileTransport(logPath, 'error');
    }
    public static getConsoleTransport(level: LogLevel) {
        return new winston.transports.Console(
            {
                format: winston.format.combine(
                    winston.format.colorize(),
                ),
                level,
            },
        );
    }
    public static getFileTransport = (logPath: string, level: string, config = {
        datePattern: 'YYYY-MM-DD',
        maxFiles: '3d',
        maxSize: '10m',
        zippedArchive: true,
    }) => {
        return new DailyRotateFile(Object.assign({
            filename: path.join(logPath, level, `%DATE%.log`),
            level,
        }, config));
    }
    private winston: winston.Logger;

    constructor(private domain: string) {
        this.winston = Logger.buildLogger({ domain });
    }

    public error = (message: string, trace: string) => {
        this.log('error', message);
    }

    public warn = (message: string) => {
        this.log('warn', message);
    }

    public info = (message: string) => {
        this.log('info', message);
    }
    public debug = (message: string) => {
        this.log('debug', message);
    }


    public log = (level: LogLevel, message: string) => {
        this.winston.log({ level, message });
    }
}