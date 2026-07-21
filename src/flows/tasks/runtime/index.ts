/**
 * Public surface of the tasks runtime flow.
 *
 * UI components import `useTasksByProject` (and the helpers below) from
 * this barrel. Lower-level modules (the watcher pub-sub, the sort
 * comparator) are exported here for direct use by the right-panel
 * `Active tasks` accordion.
 */

export { useTasksVersion, sortTasksByStatus, useTasksByProject } from './use-tasks-by-project'
