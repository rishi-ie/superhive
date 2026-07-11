import { Icon } from '@/components/ui/icon';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { useAppUpdate } from '@/flows/ui/use-app-update';

export function UpdateBanner() {
	const { pendingUpdate, installUpdate } = useAppUpdate();

	if (!pendingUpdate) return null;

	return (
		<button
			type="button"
			onClick={() => void installUpdate()}
			className="flex h-6 w-full cursor-pointer items-center gap-gap-tight.5 rounded-full bg-info px-button-x text-xs font-medium text-info-foreground shadow-sm ring-1 ring-border transition-opacity hover:opacity-90"
		>
			<Icon icon={ArrowsClockwiseIcon} className="size-3" />
			<span className="flex-1 truncate text-left">
				Update ready — v{pendingUpdate.version}
			</span>
			<span className="text-[9px] uppercase tracking-wider opacity-80">
				Restart
			</span>
		</button>
	);
}
