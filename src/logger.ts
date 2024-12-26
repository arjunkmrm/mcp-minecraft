import { createWriteStream } from 'fs';
import { format } from 'util';

class Logger {
  private logStream;
  private component: string;

  constructor(component: string) {
    this.component = component;
    this.logStream = createWriteStream('mcp.log', { flags: 'a' });
  }

  private write(level: string, message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}] [${this.component}] ${message}\n`;
    this.logStream.write(logMessage);
    
    // Also write to stderr for console visibility
    process.stderr.write(logMessage);
  }

  info(message: string, ...args: any[]) {
    this.write('INFO', format(message, ...args));
  }

  error(message: string, ...args: any[]) {
    this.write('ERROR', format(message, ...args));
  }

  warn(message: string, ...args: any[]) {
    this.write('WARN', format(message, ...args));
  }
}

export function createLogger(component: string): Logger {
  return new Logger(component);
} 