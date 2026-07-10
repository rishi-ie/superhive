import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { installUpdate } from '@/flows/ui/install-update';

interface UpdateInfo {
	version: string;
	releaseName?: string;
}

export function UpdateBanner() {
	const [pending, setPending] = useState<UpdateInfo | null>(null);

	useEffect(() => {
		const offAvail = window.api.app.onUpdateAvailable(() => {});
		const offDone = window.api.app.onUpdateDownloaded((info) => {
			setPending(info);
		});
		return () => {
			offAvail();
			offDone();
		};
	}, []);

	if (!pending) return null;

	const onInstall = () => {
		void installUpdate();
	};

	return (
		<button
			type="button"
			onClick={onInstall}
			className="flex h-6 w-full cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium text-white shadow-sm ring-1 ring-black/10 transition-opacity hover:opacity-90"
			style={{ backgroundColor: '#589ce7' }}
		>
			<Icon icon={ArrowsClockwiseIcon} className="size-3" />
			<span className="flex-1 truncate text-left">
				Update ready — v{pending.version}
			</span>
			<span className="text-[9px] uppercase tracking-wider opacity-80">
				Restart
			</span>
		</button>
	);
}
