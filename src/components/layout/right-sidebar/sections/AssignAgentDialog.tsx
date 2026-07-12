import { useEffect, useState } from 'react';
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

interface Candidate {
	id: string;
	name: string;
}

export function AssignAgentDialog(props: AssignAgentDialogProps) {
	const [candidates, setCandidates] = useState<Candidate[]>([]);

	useEffect(() => {
		if (props.open) {
			props.loadCandidates().then(setCandidates);
		}
	}, [props.open, props.loadCandidates]);

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign agent</DialogTitle>
					<DialogDescription>Only standard agents with no project are shown. ({candidates.length} found)</DialogDescription>
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