type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  traceId?: string;
  tags?: Record<string, any>;
}

const logHistory: LogEntry[] = [];

export function createLogger(tags?: Record<string, any>) {
  const traceId = generateTraceId();

  function log(level: LogLevel, message: string, extraTags?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      traceId,
      tags: { ...tags, ...extraTags },
    };
    logHistory.push(entry);

    const color = level === 'error' ? 'red' : level === 'warn' ? 'orange' : 'inherit';
    console.log(`%c[${level.toUpperCase()}] [${traceId}] ${message}`, `color: ${color}`, entry);
  }

  return { 
    debug: (msg: string, t?: any) => log('debug', msg, t), 
    info: (msg: string, t?: any) => log('info', msg, t), 
    warn: (msg: string, t?: any) => log('warn', msg, t), 
    error: (msg: string, t?: any) => log('error', msg, t) 
  };
}

function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Access log history for dev panel
export function getLogHistory() {
  return logHistory;
}