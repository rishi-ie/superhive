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

interface AgentAssignToProjectDialogProps {
	open: boolean;
	agentId: string;
	onOpenChange: (open: boolean) => void;
	loadProjects: () => Promise<Array<{ id: string; name: string }>>;
	excludeProjectIds?: string[];
	onSelect: (projectId: string) => Promise<{ ok: boolean; error?: string }>;
}

interface ProjectRef {
	id: string;
	name: string;
}

export function AgentAssignToProjectDialog(props: AgentAssignToProjectDialogProps) {
	const [projects, setProjects] = useState<ProjectRef[]>([]);

	useEffect(() => {
		if (props.open) {
			props.loadProjects().then(setProjects);
		}
	}, [props.open, props.loadProjects]);

	const excluded = new Set(props.excludeProjectIds ?? []);
	const available = projects.filter((p) => !excluded.has(p.id));

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign to project</DialogTitle>
					<DialogDescription>
						Pick a project to add this agent to. ({available.length} found)
					</DialogDescription>
				</DialogHeader>
				<Command>
					<CommandInput placeholder="Search projects…" />
					<CommandList>
						<CommandEmpty>No projects found</CommandEmpty>
						<CommandGroup heading="Available">
							{available.map((p) => (
								<CommandItem
									key={p.id}
									value={p.name}
									onSelect={async () => {
										const result = await props.onSelect(p.id);
										if (result.ok) {
											props.onOpenChange(false);
										}
									}}
								>
									{p.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}
