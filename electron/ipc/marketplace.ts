import { BrowserWindow, ipcMain } from 'electron'
import { activateMarketplaceItem, getMarketplaceItem, installMarketplaceItem, listMarketplace, removeMarketplaceItem } from '../marketplace'
import { IPC } from './index'

function changed(): void {
	for (const window of BrowserWindow.getAllWindows()) window.webContents.send(IPC.MARKETPLACE.ON_CHANGED)
}

export function registerMarketplaceIpc(): void {
	ipcMain.handle(IPC.MARKETPLACE.LIST, () => listMarketplace())
	ipcMain.handle(IPC.MARKETPLACE.GET, (_event, id: string) => getMarketplaceItem(id))
	ipcMain.handle(IPC.MARKETPLACE.INSTALL, (_event, id: string) => {
		const item = installMarketplaceItem(id)
		changed()
		return item
	})
	ipcMain.handle(IPC.MARKETPLACE.REMOVE, async (_event, id: string) => {
		await removeMarketplaceItem(id)
		changed()
	})
	ipcMain.handle(IPC.MARKETPLACE.ACTIVATE, async (_event, agentId: string, id: string) => {
		const result = await activateMarketplaceItem(agentId, id)
		changed()
		return result
	})
}
