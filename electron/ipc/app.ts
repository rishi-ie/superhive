import { ipcMain, app } from 'electron';
import { autoUpdater } from 'electron-updater';
import { IPC } from './index';

export function registerAppIpc(): void {
	ipcMain.handle(IPC.APP.GET_VERSION, () => app.getVersion());

	ipcMain.handle(IPC.APP.INSTALL_UPDATE, () => {
		if (!app.isPackaged) return { ok: false };
		autoUpdater.quitAndInstall();
		return { ok: true };
	});
}
