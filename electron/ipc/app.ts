import { ipcMain, app, clipboard } from 'electron';
import { autoUpdater } from 'electron-updater';
import { IPC } from './index';

export function registerAppIpc(): void {
	ipcMain.handle(IPC.APP.GET_VERSION, () => app.getVersion());

	ipcMain.handle(IPC.APP.COPY_TEXT, (_event, text: unknown) => {
		if (typeof text !== 'string') return { ok: false, error: 'Clipboard text must be a string' };
		if (Buffer.byteLength(text, 'utf8') > 16 * 1024 * 1024) {
			return { ok: false, error: 'Clipboard text exceeds 16 MB' };
		}
		clipboard.writeText(text);
		return { ok: true };
	});

	ipcMain.handle(IPC.APP.INSTALL_UPDATE, () => {
		if (!app.isPackaged) return { ok: false };
		autoUpdater.quitAndInstall();
		return { ok: true };
	});
}
