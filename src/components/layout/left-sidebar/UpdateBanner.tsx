import { useState } from 'react';
import { HugeiconsIcon } from '@/components/ui/icon';
import { RefreshIcon } from '@hugeicons/core-free-icons';
import { installUpdate } from '@/flows/ui/install-update';

interface UpdateInfo {
	version: string;
	releaseName?: string;
}

export function UpdateBanner() {
	const [pending] = useState<UpdateInfo>({
		version: '0.1.8',
		releaseName: 'Test Update',
	});

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
			<HugeiconsIcon icon={RefreshIcon} className="size-3" />
			<span className="flex-1 truncate text-left">
				Update ready — v{pending.version}
			</span>
			<span className="text-[9px] uppercase tracking-wider opacity-80">
				Restart
			</span>
		</button>
	);
}
