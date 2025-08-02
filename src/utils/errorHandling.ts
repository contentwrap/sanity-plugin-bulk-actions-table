/**
 * Error handling utilities for the bulk actions table plugin
 */

export interface PluginError extends Error {
  context?: string;
  operation?: string;
  documentIds?: string[];
}

/**
 * Creates a standardized plugin error
 */
export function createPluginError(
  message: string,
  context?: string,
  operation?: string,
  documentIds?: string[],
): PluginError {
  const error = new Error(message) as PluginError;
  error.context = context;
  error.operation = operation;
  error.documentIds = documentIds;
  return error;
}

/**
 * Logs errors in a consistent format for the plugin
 * In production, this could be enhanced to send to external logging services
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...(error instanceof Error &&
      'context' in error && { pluginContext: error.context }),
    ...(error instanceof Error &&
      'operation' in error && { operation: error.operation }),
    ...(error instanceof Error &&
      'documentIds' in error && { documentIds: error.documentIds }),
  };

  // For development/debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('[Sanity Bulk Actions Table Plugin] Error:', errorInfo);
  }

  // In production, you might want to send this to an external service
  // Example: sendToLogService(errorInfo);
}

/**
 * Handles errors that occur during bulk operations
 */
export function handleBulkOperationError(
  error: unknown,
  operation: string,
  documentIds?: string[],
): PluginError {
  const pluginError = createPluginError(
    `Bulk ${operation} operation failed`,
    'BulkActionsMenu',
    operation,
    documentIds,
  );

  logError(error, `Bulk ${operation} operation`);

  return pluginError;
}

/**
 * Handles errors that occur during data fetching
 */
export function handleDataFetchError(
  error: unknown,
  context: string,
): PluginError {
  const pluginError = createPluginError(
    `Data fetch failed: ${error instanceof Error ? error.message : String(error)}`,
    context,
    'fetch',
  );

  logError(error, context);

  return pluginError;
}
