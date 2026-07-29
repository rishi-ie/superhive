import type {
  CommandActor,
  CommandHandler,
  CommandHandlerRegistry,
  OrchestrationCommandType,
} from '../domain/commands'
import type { OrchestrationService } from './orchestration-service'

export function registerOrchestrationCommandHandlers(
  registry: CommandHandlerRegistry,
  service: OrchestrationService,
  types: readonly OrchestrationCommandType[],
): void {
  for (const type of types) {
    const handler: CommandHandler = (command, context) => service.execute(command, context.actor)
    registry.register(type, handler)
  }
}

export function commandActor(input: CommandActor): CommandActor {
  return input
}

