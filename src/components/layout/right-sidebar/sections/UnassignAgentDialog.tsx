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

interface UnassignAgentDialogProps {
	open: boolean;
	agentName: string | null;
	onConfirm: () => void;
	onCancel: () => void;
}

export function UnassignAgentDialog(props: UnassignAgentDialogProps) {
	return (
		<AlertDialog open={props.open} onOpenChange={(o) => { if (!o) props.onCancel(); }}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Unlink running agent?</AlertDialogTitle>
					<AlertDialogDescription>
						{props.agentName ?? 'This agent'} is currently running. Unlinking will stop its
						current runtime so it cannot continue with stale project context.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={props.onConfirm}>Unlink anyway</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
