import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteAgentDialogProps {
	open: boolean;
	agentName: string | null;
	onConfirm: () => void;
	onCancel: () => void;
}

export function DeleteAgentDialog(props: DeleteAgentDialogProps) {
	return (
		<AlertDialog open={props.open} onOpenChange={(o) => { if (!o) props.onCancel(); }}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete agent?</AlertDialogTitle>
					<AlertDialogDescription>
						This will stop {props.agentName ?? 'this agent'}, remove its DB row,
						and delete its local folder. Conversation history is lost permanently.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={props.onCancel}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={props.onConfirm}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
