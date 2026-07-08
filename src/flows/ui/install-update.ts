export async function installUpdate(): Promise<{ ok: boolean }> {
	try {
		return await window.api.app.installUpdate();
	} catch {
		return { ok: false };
	}
}
