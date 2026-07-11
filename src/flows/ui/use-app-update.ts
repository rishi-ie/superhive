import { useEffect, useState } from 'react';
import { installUpdate } from './install-update';

export interface UpdateInfo {
	version: string;
	releaseName?: string;
}

export function useAppUpdate(): {
	pendingUpdate: UpdateInfo | null;
	installUpdate: () => Promise<{ ok: boolean }>;
} {
	const [pending, setPending] = useState<UpdateInfo | null>(null);

	useEffect(() => {
		const offDone = window.api.app.onUpdateDownloaded((info) => {
			setPending(info);
		});
		return () => {
			offDone();
		};
	}, []);

	return {
		pendingUpdate: pending,
		installUpdate,
	};
}
