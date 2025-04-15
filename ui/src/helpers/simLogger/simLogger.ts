export class SimLogger {
    private static instance = new Map<string, SimLogger>();
    private scope: string;
    private logLevel: LogLevel;

    // ANSI color codes for terminal/console coloring
    private colors = {
        reset: "\x1b[0m",
        bright: "\x1b[1m",
        dim: "\x1b[2m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        gray: "\x1b[90m"
    };

    // Browser CSS styling for console
    private browserStyles = {
        error: "color: #ff0000; font-weight: bold",
        warn: "color: #ff9900; font-weight: bold",
        info: "color: #0099ff",
        debug: "color: #00cc00",
        trace: "color: #999999",
        timestamp: "color: #666666; font-style: italic"
    };

    private constructor(scope: string, level: LogLevel = LogLevel.INFO) {
        // level = LogLevel.DEBUG;
        this.scope = scope;
        this.logLevel = level;
    }

    public static getInstance(scope: string, level?: LogLevel): SimLogger {
        if (!SimLogger.instance.has(scope)) {
            SimLogger.instance.set(scope, new SimLogger(scope, level));
        }
        return SimLogger.instance.get(scope) as SimLogger;
    }

    public setLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    public getLevel(): LogLevel {
        return this.logLevel;
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.logLevel;
    }

    private formatMessage(level: LogLevel, message: any, ...args: any[]): string {
        const timestamp = new Date().toISOString();
        const levelStr = LogLevel[level].padEnd(5);
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);

        // Format additional arguments
        const formattedArgs = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        return `[${timestamp}] [${levelStr}] [${this.scope}] ${formattedMessage} ${formattedArgs}`;
    }

    private logWithLevel(level: LogLevel, message: any, ...args: any[]): void {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, ...args);

        // Determine if browser or Node.js environment
        const isBrowser = typeof window !== 'undefined';

        if (isBrowser) {
            this.logBrowser(level, formattedMessage, ...args);
        } else {
            this.logNode(level, formattedMessage);
        }
    }

    private logBrowser(level: LogLevel, message: string, ...originalArgs: any[]): void {
        const timestamp = new Date().toISOString();
        const levelStr = LogLevel[level];

        // Extract objects for console inspection
        const objects = originalArgs.filter(arg => typeof arg === 'object' && arg !== null);

        switch (level) {
            case LogLevel.ERROR:
                console.error(
                    `%c${timestamp}%c [${levelStr}] [${this.scope}]`,
                    this.browserStyles.timestamp,
                    this.browserStyles.error,
                    message,
                    ...objects
                );
                break;
            case LogLevel.WARN:
                console.warn(
                    `%c${timestamp}%c [${levelStr}] [${this.scope}]`,
                    this.browserStyles.timestamp,
                    this.browserStyles.warn,
                    message,
                    ...objects
                );
                break;
            case LogLevel.INFO:
                console.log(
                    `%c${timestamp}%c [${levelStr}] [${this.scope}]`,
                    this.browserStyles.timestamp,
                    this.browserStyles.info,
                    message,
                    ...objects
                );
                break;
            case LogLevel.DEBUG:
                console.log(
                    `%c${timestamp}%c [${levelStr}] [${this.scope}]`,
                    this.browserStyles.timestamp,
                    this.browserStyles.debug,
                    message,
                    ...objects
                );
                break;
            case LogLevel.TRACE:
                console.trace(
                    `%c${timestamp}%c [${levelStr}] [${this.scope}]`,
                    this.browserStyles.timestamp,
                    this.browserStyles.trace,
                    message,
                    ...objects
                );
                break;
        }
    }

    private logNode(level: LogLevel, formattedMessage: string): void {
        switch (level) {
            case LogLevel.ERROR:
                console.error(`${this.colors.red}${formattedMessage}${this.colors.reset}`);
                break;
            case LogLevel.WARN:
                console.warn(`${this.colors.yellow}${formattedMessage}${this.colors.reset}`);
                break;
            case LogLevel.INFO:
                console.info(`${this.colors.blue}${formattedMessage}${this.colors.reset}`);
                break;
            case LogLevel.DEBUG:
                console.debug(`${this.colors.green}${formattedMessage}${this.colors.reset}`);
                break;
            case LogLevel.TRACE:
                console.trace(`${this.colors.gray}${formattedMessage}${this.colors.reset}`);
                break;
        }
    }

    // Public logging methods that match console API
    public error(message: any, ...args: any[]): void {
        this.logWithLevel(LogLevel.ERROR, message, ...args);
    }

    public warn(message: any, ...args: any[]): void {
        this.logWithLevel(LogLevel.WARN, message, ...args);
    }

    public info(message: any, ...args: any[]): void {
        this.logWithLevel(LogLevel.INFO, message, ...args);
    }

    public debug(message: any, ...args: any[]): void {
        this.logWithLevel(LogLevel.DEBUG, message, ...args);
    }

    public trace(message: any, ...args: any[]): void {
        this.logWithLevel(LogLevel.TRACE, message, ...args);
    }

    public log(message: any, ...args: any[]): void {
        this.info(message, ...args);
    }
}

// Enum for log levels
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}