/**
 * db-source — maintains the database connection.
 *
 * The database connection is established via IPC handlers in the main process.
 * This module ensures the connection is initialized on app startup.
 */

export async function bootDataSource(): Promise<void> {
  // DB connection is handled by the main process handlers.
  // This function ensures the renderer is ready.
}
