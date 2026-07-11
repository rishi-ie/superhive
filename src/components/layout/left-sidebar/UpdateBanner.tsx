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
			className="flex h-6 w-full cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium text-white shadow-sm ring-1 ring-black/10 transition-opacity hover:opacity-90"
			style={{ backgroundColor: '#589ce7' }}
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
