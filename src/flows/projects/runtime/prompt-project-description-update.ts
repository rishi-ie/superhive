/**
 * Builds the synthetic-user-message payload that the cadence flow ships
 * to the coordinator to nudge it into refreshing its project description.
 *
 * Lives next to `use-project-description-cadence.ts` so the wording is
 * owned by the same flow that decides when to send it. If we ever want to
 * localize or A/B the prompt, this is the single file to edit.
 *
 * The wording is plain prose, no markdown. The coordinator is supposed to
 * interpret it as a system request and call `update_project_description`.
 */

interface BuildProjectDescriptionReminderInput {
  hasExistingDescription: boolean;
  interactions: number;
  threshold: number;
}

export function buildProjectDescriptionReminder({
  hasExistingDescription,
  interactions,
  threshold,
}: BuildProjectDescriptionReminderInput): string {
  const verb = hasExistingDescription ? 'refresh' : 'set';
  return (
    `[system reminder #${interactions}]\n\n` +
    `You've now had ${interactions} interactions with the user on this project ` +
    `(threshold: ${threshold}). Please ${verb} the project description shown in the ` +
    `right sidebar by calling the update_project_description truth tool. ` +
    `Keep it to one or two sentences that capture what this project is about ` +
    `based on the conversation so far. The cap is 280 characters.`
  );
}
