import { ipcMain } from 'electron'
import { getComposerCommands } from '../composer-command-config'
import { IPC } from './index'

export function registerComposerCommandsIpc(): void {
  ipcMain.handle(IPC.COMPOSER_COMMANDS.GET, () => getComposerCommands())
}
