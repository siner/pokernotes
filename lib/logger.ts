type LogLevel = 'info' | 'warn' | 'error';

interface LogFields {
  route?: string;
  userId?: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields?: LogFields, error?: unknown) {
  const payload: Record<string, unknown> = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...fields,
  };
  if (error instanceof Error) {
    payload.error = { name: error.name, message: error.message, stack: error.stack };
  } else if (error !== undefined) {
    payload.error = error;
  }
  // wrangler tail / `logs` parses JSON output cleanly. Plain console.* keeps
  // dev output readable too.
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields, error?: unknown) =>
    emit('warn', message, fields, error),
  error: (message: string, fields?: LogFields, error?: unknown) =>
    emit('error', message, fields, error),
};
