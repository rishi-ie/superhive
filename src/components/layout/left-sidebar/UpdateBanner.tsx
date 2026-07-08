import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@/components/ui/icon';
import { RefreshIcon } from '@hugeicons/core-free-icons';
import { installUpdate } from '@/flows/ui/install-update';

interface UpdateInfo {
	version: string;
	releaseName?: string;
}

export function UpdateBanner() {
	const [pending, setPending] = useState<UpdateInfo | null>(null);

	useEffect(() => {
		const offAvail = window.api.app.onUpdateAvailable(() => {
			// autoDownload = true in main process; no UI until downloaded
		});
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
			className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg bg-sidebar-primary px-2 text-sm font-medium text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary/40 transition-opacity hover:opacity-90"
		>
			<HugeiconsIcon icon={RefreshIcon} className="size-4" />
			<span className="flex-1 truncate text-left">
				Update ready — v{pending.version}
			</span>
			<span className="text-[10px] uppercase tracking-wider opacity-80">
				Restart
			</span>
		</button>
	);
}
