import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from '@/components/ui/command';

interface AssignAgentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAssigned: () => void;
	loadCandidates: () => Promise<Array<{ id: string; name: string }>>;
	onSelect: (agentId: string) => Promise<{ ok: boolean; error?: string }>;
}

export function AssignAgentDialog(props: AssignAgentDialogProps) {
	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign agent</DialogTitle>
					<DialogDescription>Only standard agents with no project are shown.</DialogDescription>
				</DialogHeader>
				<Command>
					<CommandInput placeholder="Search agents…" />
					<CommandList>
						<CommandEmpty>No unassigned agents</CommandEmpty>
						<CommandGroup heading="Available">
							<CommandItem value="placeholder" onSelect={() => undefined}>
								Placeholder
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}