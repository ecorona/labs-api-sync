import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SysLogger extends ConsoleLogger {
  private consoleLogger: ConsoleLogger;

  @Inject(EventEmitter2)
  private eventEmitter: EventEmitter2;

  constructor(name: string) {
    super();
    this.consoleLogger = new ConsoleLogger(name);
    this.eventEmitter = new EventEmitter2();
  }
  log(message: any, ...optionalParams: any[]) {
    this.eventEmitter.emit('syslog', { level: 'log', message });
    this.consoleLogger.log(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.eventEmitter.emit('syslog', { level: 'error', message });
    this.consoleLogger.error(message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.eventEmitter.emit('syslog', { level: 'warn', message });
    this.consoleLogger.warn(message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.eventEmitter.emit('syslog', { level: 'debug', message });
    this.consoleLogger.debug(message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.eventEmitter.emit('syslog', { level: 'verbose', message });
    this.consoleLogger.verbose(message, ...optionalParams);
  }
}
