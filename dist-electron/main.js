import { createRequire as e } from "node:module";
import { BrowserWindow as t, app as n, ipcMain as r } from "electron";
import { dirname as i, join as a } from "path";
import { fileURLToPath as o } from "url";
import { existsSync as s } from "node:fs";
import { chmod as c, cp as l, mkdir as u, readFile as d, rename as f, writeFile as p } from "node:fs/promises";
import { basename as m, dirname as h, join as g } from "node:path";
import { fileURLToPath as _ } from "node:url";
import { execFile as v, spawn as ee } from "node:child_process";
import { randomUUID as te } from "node:crypto";
import { promisify as ne } from "node:util";
import { homedir as y } from "node:os";
//#region \0rolldown/runtime.js
var re = Object.create, b = Object.defineProperty, ie = Object.getOwnPropertyDescriptor, x = Object.getOwnPropertyNames, S = Object.getPrototypeOf, ae = Object.prototype.hasOwnProperty, C = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), oe = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = x(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !ae.call(e, s) && s !== n && b(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = ie(t, s)) || r.enumerable
	});
	return e;
}, se = (e, t, n) => (n = e == null ? {} : re(S(e)), oe(t || !e || !e.__esModule ? b(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), w = /* @__PURE__ */ e(import.meta.url), ce = /* @__PURE__ */ C(((e, t) => {
	var n = w("fs"), r = w("path");
	t.exports = {
		findAndReadPackageJson: i,
		tryReadJsonAt: a
	};
	function i() {
		return a(c()) || a(s()) || a(process.resourcesPath, "app.asar") || a(process.resourcesPath, "app") || a(process.cwd()) || {
			name: void 0,
			version: void 0
		};
	}
	function a(...e) {
		if (e[0]) try {
			let t = o("package.json", r.join(...e));
			if (!t) return;
			let i = JSON.parse(n.readFileSync(t, "utf8")), a = i?.productName || i?.name;
			return !a || a.toLowerCase() === "electron" ? void 0 : a ? {
				name: a,
				version: i?.version
			} : void 0;
		} catch {
			return;
		}
	}
	function o(e, t) {
		let i = t;
		for (;;) {
			let t = r.parse(i), a = t.root, o = t.dir;
			if (n.existsSync(r.join(i, e))) return r.resolve(r.join(i, e));
			if (i === a) return null;
			i = o;
		}
	}
	function s() {
		let e = process.argv.filter((e) => e.indexOf("--user-data-dir=") === 0);
		return e.length === 0 || typeof e[0] != "string" ? null : e[0].replace("--user-data-dir=", "");
	}
	function c() {
		try {
			return w.main?.filename;
		} catch {
			return;
		}
	}
})), le = /* @__PURE__ */ C(((e, t) => {
	var n = w("child_process"), r = w("os"), i = w("path"), a = ce();
	t.exports = class {
		appName = void 0;
		appPackageJson = void 0;
		platform = process.platform;
		getAppLogPath(e = this.getAppName()) {
			return this.platform === "darwin" ? i.join(this.getSystemPathHome(), "Library/Logs", e) : i.join(this.getAppUserDataPath(e), "logs");
		}
		getAppName() {
			let e = this.appName || this.getAppPackageJson()?.name;
			if (!e) throw Error("electron-log can't determine the app name. It tried these methods:\n1. Use `electron.app.name`\n2. Use productName or name from the nearest package.json`\nYou can also set it through log.transports.file.setAppName()");
			return e;
		}
		getAppPackageJson() {
			return typeof this.appPackageJson != "object" && (this.appPackageJson = a.findAndReadPackageJson()), this.appPackageJson;
		}
		getAppUserDataPath(e = this.getAppName()) {
			return e ? i.join(this.getSystemPathAppData(), e) : void 0;
		}
		getAppVersion() {
			return this.getAppPackageJson()?.version;
		}
		getElectronLogPath() {
			return this.getAppLogPath();
		}
		getMacOsVersion() {
			let e = Number(r.release().split(".")[0]);
			return e <= 19 ? `10.${e - 4}` : e - 9;
		}
		getOsVersion() {
			let e = r.type().replace("_", " "), t = r.release();
			return e === "Darwin" && (e = "macOS", t = this.getMacOsVersion()), `${e} ${t}`;
		}
		getPathVariables() {
			let e = this.getAppName(), t = this.getAppVersion(), n = this;
			return {
				appData: this.getSystemPathAppData(),
				appName: e,
				appVersion: t,
				get electronDefaultDir() {
					return n.getElectronLogPath();
				},
				home: this.getSystemPathHome(),
				libraryDefaultDir: this.getAppLogPath(e),
				libraryTemplate: this.getAppLogPath("{appName}"),
				temp: this.getSystemPathTemp(),
				userData: this.getAppUserDataPath(e)
			};
		}
		getSystemPathAppData() {
			let e = this.getSystemPathHome();
			switch (this.platform) {
				case "darwin": return i.join(e, "Library/Application Support");
				case "win32": return process.env.APPDATA || i.join(e, "AppData/Roaming");
				default: return process.env.XDG_CONFIG_HOME || i.join(e, ".config");
			}
		}
		getSystemPathHome() {
			return r.homedir?.() || process.env.HOME;
		}
		getSystemPathTemp() {
			return r.tmpdir();
		}
		getVersions() {
			return {
				app: `${this.getAppName()} ${this.getAppVersion()}`,
				electron: void 0,
				os: this.getOsVersion()
			};
		}
		isDev() {
			return process.env.NODE_ENV === "development" || process.env.ELECTRON_IS_DEV === "1";
		}
		isElectron() {
			return !!process.versions.electron;
		}
		onAppEvent(e, t) {}
		onAppReady(e) {
			e();
		}
		onEveryWebContentsEvent(e, t) {}
		onIpc(e, t) {}
		onIpcInvoke(e, t) {}
		openUrl(e, t = console.error) {
			let r = {
				darwin: "open",
				win32: "start",
				linux: "xdg-open"
			}[process.platform] || "xdg-open";
			n.exec(`${r} ${e}`, {}, (e) => {
				e && t(e);
			});
		}
		setAppName(e) {
			this.appName = e;
		}
		setPlatform(e) {
			this.platform = e;
		}
		setPreloadFileForSessions({ filePath: e, includeFutureSession: t = !0, getSessions: n = () => [] }) {}
		sendIpc(e, t) {}
		showErrorBox(e, t) {}
	};
})), ue = /* @__PURE__ */ C(((e, t) => {
	var n = w("path"), r = le();
	t.exports = class extends r {
		electron = void 0;
		constructor({ electron: e } = {}) {
			super(), this.electron = e;
		}
		getAppName() {
			let e;
			try {
				e = this.appName || this.electron.app?.name || this.electron.app?.getName();
			} catch {}
			return e || super.getAppName();
		}
		getAppUserDataPath(e) {
			return this.getPath("userData") || super.getAppUserDataPath(e);
		}
		getAppVersion() {
			let e;
			try {
				e = this.electron.app?.getVersion();
			} catch {}
			return e || super.getAppVersion();
		}
		getElectronLogPath() {
			return this.getPath("logs") || super.getElectronLogPath();
		}
		getPath(e) {
			try {
				return this.electron.app?.getPath(e);
			} catch {
				return;
			}
		}
		getVersions() {
			return {
				app: `${this.getAppName()} ${this.getAppVersion()}`,
				electron: `Electron ${process.versions.electron}`,
				os: this.getOsVersion()
			};
		}
		getSystemPathAppData() {
			return this.getPath("appData") || super.getSystemPathAppData();
		}
		isDev() {
			return this.electron.app?.isPackaged === void 0 ? typeof process.execPath == "string" ? n.basename(process.execPath).toLowerCase().startsWith("electron") : super.isDev() : !this.electron.app.isPackaged;
		}
		onAppEvent(e, t) {
			return this.electron.app?.on(e, t), () => {
				this.electron.app?.off(e, t);
			};
		}
		onAppReady(e) {
			this.electron.app?.isReady() ? e() : this.electron.app?.once ? this.electron.app?.once("ready", e) : e();
		}
		onEveryWebContentsEvent(e, t) {
			return this.electron.webContents?.getAllWebContents()?.forEach((n) => {
				n.on(e, t);
			}), this.electron.app?.on("web-contents-created", n), () => {
				this.electron.webContents?.getAllWebContents().forEach((n) => {
					n.off(e, t);
				}), this.electron.app?.off("web-contents-created", n);
			};
			function n(n, r) {
				r.on(e, t);
			}
		}
		onIpc(e, t) {
			this.electron.ipcMain?.on(e, t);
		}
		onIpcInvoke(e, t) {
			this.electron.ipcMain?.handle?.(e, t);
		}
		openUrl(e, t = console.error) {
			this.electron.shell?.openExternal(e).catch(t);
		}
		setPreloadFileForSessions({ filePath: e, includeFutureSession: t = !0, getSessions: n = () => [this.electron.session?.defaultSession] }) {
			for (let e of n().filter(Boolean)) r(e);
			t && this.onAppEvent("session-created", (e) => {
				r(e);
			});
			function r(t) {
				typeof t.registerPreloadScript == "function" ? t.registerPreloadScript({
					filePath: e,
					id: "electron-log-preload",
					type: "frame"
				}) : t.setPreloads([...t.getPreloads(), e]);
			}
		}
		sendIpc(e, t) {
			this.electron.BrowserWindow?.getAllWindows()?.forEach((n) => {
				n.webContents?.isDestroyed() === !1 && n.webContents?.isCrashed() === !1 && n.webContents.send(e, t);
			});
		}
		showErrorBox(e, t) {
			this.electron.dialog?.showErrorBox(e, t);
		}
	};
})), de = /* @__PURE__ */ C(((e, t) => {
	var n = {};
	try {
		n = w("electron");
	} catch {}
	n.ipcRenderer && r(n), typeof t == "object" && (t.exports = r);
	function r({ contextBridge: e, ipcRenderer: t }) {
		if (!t) return;
		t.on("__ELECTRON_LOG_IPC__", (e, t) => {
			window.postMessage({
				cmd: "message",
				...t
			});
		}), t.invoke("__ELECTRON_LOG__", { cmd: "getOptions" }).catch((e) => console.error(/* @__PURE__ */ Error(`electron-log isn't initialized in the main process. Please call log.initialize() before. ${e.message}`)));
		let n = {
			sendToMain(e) {
				try {
					t.send("__ELECTRON_LOG__", e);
				} catch (n) {
					console.error("electronLog.sendToMain ", n, "data:", e), t.send("__ELECTRON_LOG__", {
						cmd: "errorHandler",
						error: {
							message: n?.message,
							stack: n?.stack
						},
						errorName: "sendToMain"
					});
				}
			},
			log(...e) {
				n.sendToMain({
					data: e,
					level: "info"
				});
			}
		};
		for (let e of [
			"error",
			"warn",
			"info",
			"verbose",
			"debug",
			"silly"
		]) n[e] = (...t) => n.sendToMain({
			data: t,
			level: e
		});
		if (e && process.contextIsolated) try {
			e.exposeInMainWorld("__electronLog", n);
		} catch {}
		typeof window == "object" ? window.__electronLog = n : __electronLog = n;
	}
})), fe = /* @__PURE__ */ C(((e, t) => {
	var n = w("fs"), r = w("os"), i = w("path"), a = de(), o = !1, s = !1;
	t.exports = { initialize({ externalApi: e, getSessions: t, includeFutureSession: n, logger: r, preload: i = !0, spyRendererConsole: a = !1 }) {
		e.onAppReady(() => {
			try {
				i && c({
					externalApi: e,
					getSessions: t,
					includeFutureSession: n,
					logger: r,
					preloadOption: i
				}), a && l({
					externalApi: e,
					logger: r
				});
			} catch (e) {
				r.warn(e);
			}
		});
	} };
	function c({ externalApi: e, getSessions: t, includeFutureSession: s, logger: c, preloadOption: l }) {
		let u = typeof l == "string" ? l : void 0;
		if (o) {
			c.warn((/* @__PURE__ */ Error("log.initialize({ preload }) already called")).stack);
			return;
		}
		o = !0;
		try {
			u = i.resolve(__dirname, "../renderer/electron-log-preload.js");
		} catch {}
		if (!u || !n.existsSync(u)) {
			u = i.join(e.getAppUserDataPath() || r.tmpdir(), "electron-log-preload.js");
			let t = `
      try {
        (${a.toString()})(require('electron'));
      } catch(e) {
        console.error(e);
      }
    `;
			n.writeFileSync(u, t, "utf8");
		}
		e.setPreloadFileForSessions({
			filePath: u,
			includeFutureSession: s,
			getSessions: t
		});
	}
	function l({ externalApi: e, logger: t }) {
		if (s) {
			t.warn((/* @__PURE__ */ Error("log.initialize({ spyRendererConsole }) already called")).stack);
			return;
		}
		s = !0;
		let n = [
			"debug",
			"info",
			"warn",
			"error"
		];
		e.onEveryWebContentsEvent("console-message", (e, r, i) => {
			t.processMessage({
				data: [i],
				level: n[r],
				variables: { processType: "renderer" }
			});
		});
	}
})), pe = /* @__PURE__ */ C(((e, t) => {
	t.exports = n;
	function n(e) {
		return Object.defineProperties(t, {
			defaultLabel: {
				value: "",
				writable: !0
			},
			labelPadding: {
				value: !0,
				writable: !0
			},
			maxLabelLength: {
				value: 0,
				writable: !0
			},
			labelLength: { get() {
				switch (typeof t.labelPadding) {
					case "boolean": return t.labelPadding ? t.maxLabelLength : 0;
					case "number": return t.labelPadding;
					default: return 0;
				}
			} }
		});
		function t(n) {
			t.maxLabelLength = Math.max(t.maxLabelLength, n.length);
			let r = {};
			for (let t of e.levels) r[t] = (...r) => e.logData(r, {
				level: t,
				scope: n
			});
			return r.log = r.info, r;
		}
	}
})), me = /* @__PURE__ */ C(((e, t) => {
	t.exports = class {
		constructor({ processMessage: e }) {
			this.processMessage = e, this.buffer = [], this.enabled = !1, this.begin = this.begin.bind(this), this.commit = this.commit.bind(this), this.reject = this.reject.bind(this);
		}
		addMessage(e) {
			this.buffer.push(e);
		}
		begin() {
			this.enabled = [];
		}
		commit() {
			this.enabled = !1, this.buffer.forEach((e) => this.processMessage(e)), this.buffer = [];
		}
		reject() {
			this.enabled = !1, this.buffer = [];
		}
	};
})), he = /* @__PURE__ */ C(((e, t) => {
	var n = pe(), r = me();
	t.exports = class e {
		static instances = {};
		dependencies = {};
		errorHandler = null;
		eventLogger = null;
		functions = {};
		hooks = [];
		isDev = !1;
		levels = null;
		logId = null;
		scope = null;
		transports = {};
		variables = {};
		constructor({ allowUnknownLevel: t = !1, dependencies: i = {}, errorHandler: a, eventLogger: o, initializeFn: s, isDev: c = !1, levels: l = [
			"error",
			"warn",
			"info",
			"verbose",
			"debug",
			"silly"
		], logId: u, transportFactories: d = {}, variables: f } = {}) {
			this.addLevel = this.addLevel.bind(this), this.create = this.create.bind(this), this.initialize = this.initialize.bind(this), this.logData = this.logData.bind(this), this.processMessage = this.processMessage.bind(this), this.allowUnknownLevel = t, this.buffering = new r(this), this.dependencies = i, this.initializeFn = s, this.isDev = c, this.levels = l, this.logId = u, this.scope = n(this), this.transportFactories = d, this.variables = f || {};
			for (let e of this.levels) this.addLevel(e, !1);
			this.log = this.info, this.functions.log = this.log, this.errorHandler = a, a?.setOptions({
				...i,
				logFn: this.error
			}), this.eventLogger = o, o?.setOptions({
				...i,
				logger: this
			});
			for (let [e, t] of Object.entries(d)) this.transports[e] = t(this, i);
			e.instances[u] = this;
		}
		static getInstance({ logId: e }) {
			return this.instances[e] || this.instances.default;
		}
		addLevel(e, t = this.levels.length) {
			t !== !1 && this.levels.splice(t, 0, e), this[e] = (...t) => this.logData(t, { level: e }), this.functions[e] = this[e];
		}
		catchErrors(e) {
			return this.processMessage({
				data: ["log.catchErrors is deprecated. Use log.errorHandler instead"],
				level: "warn"
			}, { transports: ["console"] }), this.errorHandler.startCatching(e);
		}
		create(t) {
			return typeof t == "string" && (t = { logId: t }), new e({
				dependencies: this.dependencies,
				errorHandler: this.errorHandler,
				initializeFn: this.initializeFn,
				isDev: this.isDev,
				transportFactories: this.transportFactories,
				variables: { ...this.variables },
				...t
			});
		}
		compareLevels(e, t, n = this.levels) {
			let r = n.indexOf(e), i = n.indexOf(t);
			return i === -1 || r === -1 ? !0 : i <= r;
		}
		initialize(e = {}) {
			this.initializeFn({
				logger: this,
				...this.dependencies,
				...e
			});
		}
		logData(e, t = {}) {
			this.buffering.enabled ? this.buffering.addMessage({
				data: e,
				date: /* @__PURE__ */ new Date(),
				...t
			}) : this.processMessage({
				data: e,
				...t
			});
		}
		processMessage(e, { transports: t = this.transports } = {}) {
			if (e.cmd === "errorHandler") {
				this.errorHandler.handle(e.error, {
					errorName: e.errorName,
					processType: "renderer",
					showDialog: !!e.showDialog
				});
				return;
			}
			let n = e.level;
			this.allowUnknownLevel || (n = this.levels.includes(e.level) ? e.level : "info");
			let r = {
				date: /* @__PURE__ */ new Date(),
				logId: this.logId,
				...e,
				level: n,
				variables: {
					...this.variables,
					...e.variables
				}
			};
			for (let [n, i] of this.transportEntries(t)) if (!(typeof i != "function" || i.level === !1) && this.compareLevels(i.level, e.level)) try {
				let e = this.hooks.reduce((e, t) => e && t(e, i, n), r);
				e && i({
					...e,
					data: [...e.data]
				});
			} catch (e) {
				this.processInternalErrorFn(e);
			}
		}
		processInternalErrorFn(e) {}
		transportEntries(e = this.transports) {
			return (Array.isArray(e) ? e : Object.entries(e)).map((e) => {
				switch (typeof e) {
					case "string": return this.transports[e] ? [e, this.transports[e]] : null;
					case "function": return [e.name, e];
					default: return Array.isArray(e) ? e : null;
				}
			}).filter(Boolean);
		}
	};
})), ge = /* @__PURE__ */ C(((e, t) => {
	var n = class {
		externalApi = void 0;
		isActive = !1;
		logFn = void 0;
		onError = void 0;
		showDialog = !0;
		constructor({ externalApi: e, logFn: t = void 0, onError: n = void 0, showDialog: r = void 0 } = {}) {
			this.createIssue = this.createIssue.bind(this), this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.setOptions({
				externalApi: e,
				logFn: t,
				onError: n,
				showDialog: r
			}), this.startCatching = this.startCatching.bind(this), this.stopCatching = this.stopCatching.bind(this);
		}
		handle(e, { logFn: t = this.logFn, onError: n = this.onError, processType: i = "browser", showDialog: a = this.showDialog, errorName: o = "" } = {}) {
			e = r(e);
			try {
				if (typeof n == "function") {
					let t = this.externalApi?.getVersions() || {}, r = this.createIssue;
					if (n({
						createIssue: r,
						error: e,
						errorName: o,
						processType: i,
						versions: t
					}) === !1) return;
				}
				o ? t(o, e) : t(e), a && !o.includes("rejection") && this.externalApi && this.externalApi.showErrorBox(`A JavaScript error occurred in the ${i} process`, e.stack);
			} catch {
				console.error(e);
			}
		}
		setOptions({ externalApi: e, logFn: t, onError: n, showDialog: r }) {
			typeof e == "object" && (this.externalApi = e), typeof t == "function" && (this.logFn = t), typeof n == "function" && (this.onError = n), typeof r == "boolean" && (this.showDialog = r);
		}
		startCatching({ onError: e, showDialog: t } = {}) {
			this.isActive || (this.isActive = !0, this.setOptions({
				onError: e,
				showDialog: t
			}), process.on("uncaughtException", this.handleError), process.on("unhandledRejection", this.handleRejection));
		}
		stopCatching() {
			this.isActive = !1, process.removeListener("uncaughtException", this.handleError), process.removeListener("unhandledRejection", this.handleRejection);
		}
		createIssue(e, t) {
			this.externalApi?.openUrl(`${e}?${new URLSearchParams(t).toString()}`);
		}
		handleError(e) {
			this.handle(e, { errorName: "Unhandled" });
		}
		handleRejection(e) {
			let t = e instanceof Error ? e : Error(JSON.stringify(e));
			this.handle(t, { errorName: "Unhandled rejection" });
		}
	};
	function r(e) {
		if (e instanceof Error) return e;
		if (e && typeof e == "object") {
			if (e.message) return Object.assign(Error(e.message), e);
			try {
				return Error(JSON.stringify(e));
			} catch (t) {
				return /* @__PURE__ */ Error(`Couldn't normalize error ${String(e)}: ${t}`);
			}
		}
		return /* @__PURE__ */ Error(`Can't normalize error ${String(e)}`);
	}
	t.exports = n;
})), _e = /* @__PURE__ */ C(((e, t) => {
	t.exports = class {
		disposers = [];
		format = "{eventSource}#{eventName}:";
		formatters = {
			app: {
				"certificate-error": ({ args: e }) => this.arrayToObject(e.slice(1, 4), [
					"url",
					"error",
					"certificate"
				]),
				"child-process-gone": ({ args: e }) => e.length === 1 ? e[0] : e,
				"render-process-gone": ({ args: [e, t] }) => t && typeof t == "object" ? {
					...t,
					...this.getWebContentsDetails(e)
				} : []
			},
			webContents: {
				"console-message": ({ args: [e, t, n, r] }) => {
					if (!(e < 3)) return {
						message: t,
						source: `${r}:${n}`
					};
				},
				"did-fail-load": ({ args: e }) => this.arrayToObject(e, [
					"errorCode",
					"errorDescription",
					"validatedURL",
					"isMainFrame",
					"frameProcessId",
					"frameRoutingId"
				]),
				"did-fail-provisional-load": ({ args: e }) => this.arrayToObject(e, [
					"errorCode",
					"errorDescription",
					"validatedURL",
					"isMainFrame",
					"frameProcessId",
					"frameRoutingId"
				]),
				"plugin-crashed": ({ args: e }) => this.arrayToObject(e, ["name", "version"]),
				"preload-error": ({ args: e }) => this.arrayToObject(e, ["preloadPath", "error"])
			}
		};
		events = {
			app: {
				"certificate-error": !0,
				"child-process-gone": !0,
				"render-process-gone": !0
			},
			webContents: {
				"did-fail-load": !0,
				"did-fail-provisional-load": !0,
				"plugin-crashed": !0,
				"preload-error": !0,
				unresponsive: !0
			}
		};
		externalApi = void 0;
		level = "error";
		scope = "";
		constructor(e = {}) {
			this.setOptions(e);
		}
		setOptions({ events: e, externalApi: t, level: n, logger: r, format: i, formatters: a, scope: o }) {
			typeof e == "object" && (this.events = e), typeof t == "object" && (this.externalApi = t), typeof n == "string" && (this.level = n), typeof r == "object" && (this.logger = r), (typeof i == "string" || typeof i == "function") && (this.format = i), typeof a == "object" && (this.formatters = a), typeof o == "string" && (this.scope = o);
		}
		startLogging(e = {}) {
			this.setOptions(e), this.disposeListeners();
			for (let e of this.getEventNames(this.events.app)) this.disposers.push(this.externalApi.onAppEvent(e, (...t) => {
				this.handleEvent({
					eventSource: "app",
					eventName: e,
					handlerArgs: t
				});
			}));
			for (let e of this.getEventNames(this.events.webContents)) this.disposers.push(this.externalApi.onEveryWebContentsEvent(e, (...t) => {
				this.handleEvent({
					eventSource: "webContents",
					eventName: e,
					handlerArgs: t
				});
			}));
		}
		stopLogging() {
			this.disposeListeners();
		}
		arrayToObject(e, t) {
			let n = {};
			return t.forEach((t, r) => {
				n[t] = e[r];
			}), e.length > t.length && (n.unknownArgs = e.slice(t.length)), n;
		}
		disposeListeners() {
			this.disposers.forEach((e) => e()), this.disposers = [];
		}
		formatEventLog({ eventName: e, eventSource: t, handlerArgs: n }) {
			let [r, ...i] = n;
			if (typeof this.format == "function") return this.format({
				args: i,
				event: r,
				eventName: e,
				eventSource: t
			});
			let a = this.formatters[t]?.[e], o = i;
			if (typeof a == "function" && (o = a({
				args: i,
				event: r,
				eventName: e,
				eventSource: t
			})), !o) return;
			let s = {};
			return Array.isArray(o) ? s.args = o : typeof o == "object" && Object.assign(s, o), t === "webContents" && Object.assign(s, this.getWebContentsDetails(r?.sender)), [this.format.replace("{eventSource}", t === "app" ? "App" : "WebContents").replace("{eventName}", e), s];
		}
		getEventNames(e) {
			return !e || typeof e != "object" ? [] : Object.entries(e).filter(([e, t]) => t).map(([e]) => e);
		}
		getWebContentsDetails(e) {
			if (!e?.loadURL) return {};
			try {
				return { webContents: {
					id: e.id,
					url: e.getURL()
				} };
			} catch {
				return {};
			}
		}
		handleEvent({ eventName: e, eventSource: t, handlerArgs: n }) {
			let r = this.formatEventLog({
				eventName: e,
				eventSource: t,
				handlerArgs: n
			});
			r && (this.scope ? this.logger.scope(this.scope) : this.logger)?.[this.level]?.(...r);
		}
	};
})), T = /* @__PURE__ */ C(((e, t) => {
	t.exports = { transform: n };
	function n({ logger: e, message: t, transport: n, initialData: r = t?.data || [], transforms: i = n?.transforms }) {
		return i.reduce((r, i) => typeof i == "function" ? i({
			data: r,
			logger: e,
			message: t,
			transport: n
		}) : r, r);
	}
})), E = /* @__PURE__ */ C(((e, t) => {
	var { transform: n } = T();
	t.exports = {
		concatFirstStringElements: r,
		formatScope: a,
		formatText: s,
		formatVariables: o,
		timeZoneFromOffset: i,
		format({ message: e, logger: t, transport: r, data: i = e?.data }) {
			switch (typeof r.format) {
				case "string": return n({
					message: e,
					logger: t,
					transforms: [
						o,
						a,
						s
					],
					transport: r,
					initialData: [r.format, ...i]
				});
				case "function": return r.format({
					data: i,
					level: e?.level || "info",
					logger: t,
					message: e,
					transport: r
				});
				default: return i;
			}
		}
	};
	function r({ data: e }) {
		return typeof e[0] != "string" || typeof e[1] != "string" || e[0].match(/%[1cdfiOos]/) ? e : [`${e[0]} ${e[1]}`, ...e.slice(2)];
	}
	function i(e) {
		let t = Math.abs(e);
		return `${e > 0 ? "-" : "+"}${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;
	}
	function a({ data: e, logger: t, message: n }) {
		let { defaultLabel: r, labelLength: i } = t?.scope || {}, a = e[0], o = n.scope;
		o ||= r;
		let s;
		return s = o === "" ? i > 0 ? "".padEnd(i + 3) : "" : typeof o == "string" ? ` (${o})`.padEnd(i + 3) : "", e[0] = a.replace("{scope}", s), e;
	}
	function o({ data: e, message: t }) {
		let n = e[0];
		if (typeof n != "string") return e;
		n = n.replace("{level}]", `${t.level}]`.padEnd(6, " "));
		let r = t.date || /* @__PURE__ */ new Date();
		return e[0] = n.replace(/\{(\w+)}/g, (e, n) => {
			switch (n) {
				case "level": return t.level || "info";
				case "logId": return t.logId;
				case "y": return r.getFullYear().toString(10);
				case "m": return (r.getMonth() + 1).toString(10).padStart(2, "0");
				case "d": return r.getDate().toString(10).padStart(2, "0");
				case "h": return r.getHours().toString(10).padStart(2, "0");
				case "i": return r.getMinutes().toString(10).padStart(2, "0");
				case "s": return r.getSeconds().toString(10).padStart(2, "0");
				case "ms": return r.getMilliseconds().toString(10).padStart(3, "0");
				case "z": return i(r.getTimezoneOffset());
				case "iso": return r.toISOString();
				default: return t.variables?.[n] || e;
			}
		}).trim(), e;
	}
	function s({ data: e }) {
		let t = e[0];
		if (typeof t != "string") return e;
		if (t.lastIndexOf("{text}") === t.length - 6) return e[0] = t.replace(/\s?{text}/, ""), e[0] === "" && e.shift(), e;
		let n = t.split("{text}"), r = [];
		return n[0] !== "" && r.push(n[0]), r = r.concat(e.slice(1)), n[1] !== "" && r.push(n[1]), r;
	}
})), D = /* @__PURE__ */ C(((e, t) => {
	var n = w("util");
	t.exports = {
		serialize: i,
		maxDepth({ data: e, transport: n, depth: r = n?.depth ?? 6 }) {
			if (!e) return e;
			if (r < 1) return Array.isArray(e) ? "[array]" : typeof e == "object" && e ? "[object]" : e;
			if (Array.isArray(e)) return e.map((e) => t.exports.maxDepth({
				data: e,
				depth: r - 1
			}));
			if (typeof e != "object" || e && typeof e.toISOString == "function") return e;
			if (e === null) return null;
			if (e instanceof Error) return e;
			let i = {};
			for (let n in e) Object.prototype.hasOwnProperty.call(e, n) && (i[n] = t.exports.maxDepth({
				data: e[n],
				depth: r - 1
			}));
			return i;
		},
		toJSON({ data: e }) {
			return JSON.parse(JSON.stringify(e, r()));
		},
		toString({ data: e, transport: t }) {
			let i = t?.inspectOptions || {}, a = e.map((e) => {
				if (e !== void 0) try {
					let t = JSON.stringify(e, r(), "  ");
					return t === void 0 ? void 0 : JSON.parse(t);
				} catch {
					return e;
				}
			});
			return n.formatWithOptions(i, ...a);
		}
	};
	function r(e = {}) {
		let t = /* @__PURE__ */ new WeakSet();
		return function(n, r) {
			if (typeof r == "object" && r) {
				if (t.has(r)) return;
				t.add(r);
			}
			return i(n, r, e);
		};
	}
	function i(e, t, n = {}) {
		let r = n?.serializeMapAndSet !== !1;
		return t instanceof Error ? t.stack : t && (typeof t == "function" ? `[function] ${t.toString()}` : t instanceof Date ? t.toISOString() : r && t instanceof Map && Object.fromEntries ? Object.fromEntries(t) : r && t instanceof Set && Array.from ? Array.from(t) : t);
	}
})), O = /* @__PURE__ */ C(((e, t) => {
	t.exports = {
		transformStyles: a,
		applyAnsiStyles({ data: e }) {
			return a(e, r, i);
		},
		removeStyles({ data: e }) {
			return a(e, () => "");
		}
	};
	var n = {
		unset: "\x1B[0m",
		black: "\x1B[30m",
		red: "\x1B[31m",
		green: "\x1B[32m",
		yellow: "\x1B[33m",
		blue: "\x1B[34m",
		magenta: "\x1B[35m",
		cyan: "\x1B[36m",
		white: "\x1B[37m",
		gray: "\x1B[90m"
	};
	function r(e) {
		return n[e.replace(/color:\s*(\w+).*/, "$1").toLowerCase()] || "";
	}
	function i(e) {
		return e + n.unset;
	}
	function a(e, t, n) {
		let r = {};
		return e.reduce((e, i, a, o) => {
			if (r[a]) return e;
			if (typeof i == "string") {
				let e = a, s = !1;
				i = i.replace(/%[1cdfiOos]/g, (n) => {
					if (e += 1, n !== "%c") return n;
					let a = o[e];
					return typeof a == "string" ? (r[e] = !0, s = !0, t(a, i)) : n;
				}), s && n && (i = n(i));
			}
			return e.push(i), e;
		}, []);
	}
})), k = /* @__PURE__ */ C(((e, t) => {
	var { concatFirstStringElements: n, format: r } = E(), { maxDepth: i, toJSON: a } = D(), { applyAnsiStyles: o, removeStyles: s } = O(), { transform: c } = T(), l = {
		error: console.error,
		warn: console.warn,
		info: console.info,
		verbose: console.info,
		debug: console.debug,
		silly: console.debug,
		log: console.log
	};
	t.exports = d;
	var u = `%c{h}:{i}:{s}.{ms}{scope}%c ${process.platform === "win32" ? ">" : "›"} {text}`;
	Object.assign(d, { DEFAULT_FORMAT: u });
	function d(e) {
		return Object.assign(t, {
			colorMap: {
				error: "red",
				warn: "yellow",
				info: "cyan",
				verbose: "unset",
				debug: "gray",
				silly: "gray",
				default: "unset"
			},
			format: u,
			level: "silly",
			transforms: [
				f,
				r,
				m,
				n,
				i,
				a
			],
			useStyles: process.env.FORCE_STYLES,
			writeFn({ message: e }) {
				(l[e.level] || l.info)(...e.data);
			}
		});
		function t(n) {
			let r = c({
				logger: e,
				message: n,
				transport: t
			});
			t.writeFn({ message: {
				...n,
				data: r
			} });
		}
	}
	function f({ data: e, message: t, transport: n }) {
		return typeof n.format != "string" || !n.format.includes("%c") ? e : [
			`color:${h(t.level, n)}`,
			"color:unset",
			...e
		];
	}
	function p(e, t) {
		if (typeof e == "boolean") return e;
		let n = t === "error" || t === "warn" ? process.stderr : process.stdout;
		return n && n.isTTY;
	}
	function m(e) {
		let { message: t, transport: n } = e;
		return (p(n.useStyles, t.level) ? o : s)(e);
	}
	function h(e, t) {
		return t.colorMap[e] || t.colorMap.default;
	}
})), A = /* @__PURE__ */ C(((e, t) => {
	var n = w("events"), r = w("fs"), i = w("os");
	t.exports = class extends n {
		asyncWriteQueue = [];
		bytesWritten = 0;
		hasActiveAsyncWriting = !1;
		path = null;
		initialSize = void 0;
		writeOptions = null;
		writeAsync = !1;
		constructor({ path: e, writeOptions: t = {
			encoding: "utf8",
			flag: "a",
			mode: 438
		}, writeAsync: n = !1 }) {
			super(), this.path = e, this.writeOptions = t, this.writeAsync = n;
		}
		get size() {
			return this.getSize();
		}
		clear() {
			try {
				return r.writeFileSync(this.path, "", {
					mode: this.writeOptions.mode,
					flag: "w"
				}), this.reset(), !0;
			} catch (e) {
				return e.code === "ENOENT" ? !0 : (this.emit("error", e, this), !1);
			}
		}
		crop(e) {
			try {
				let t = a(this.path, e || 4096);
				this.clear(), this.writeLine(`[log cropped]${i.EOL}${t}`);
			} catch (e) {
				this.emit("error", /* @__PURE__ */ Error(`Couldn't crop file ${this.path}. ${e.message}`), this);
			}
		}
		getSize() {
			if (this.initialSize === void 0) try {
				let e = r.statSync(this.path);
				this.initialSize = e.size;
			} catch {
				this.initialSize = 0;
			}
			return this.initialSize + this.bytesWritten;
		}
		increaseBytesWrittenCounter(e) {
			this.bytesWritten += Buffer.byteLength(e, this.writeOptions.encoding);
		}
		isNull() {
			return !1;
		}
		nextAsyncWrite() {
			let e = this;
			if (this.hasActiveAsyncWriting || this.asyncWriteQueue.length === 0) return;
			let t = this.asyncWriteQueue.join("");
			this.asyncWriteQueue = [], this.hasActiveAsyncWriting = !0, r.writeFile(this.path, t, this.writeOptions, (n) => {
				e.hasActiveAsyncWriting = !1, n ? e.emit("error", /* @__PURE__ */ Error(`Couldn't write to ${e.path}. ${n.message}`), this) : e.increaseBytesWrittenCounter(t), e.nextAsyncWrite();
			});
		}
		reset() {
			this.initialSize = void 0, this.bytesWritten = 0;
		}
		toString() {
			return this.path;
		}
		writeLine(e) {
			if (e += i.EOL, this.writeAsync) {
				this.asyncWriteQueue.push(e), this.nextAsyncWrite();
				return;
			}
			try {
				r.writeFileSync(this.path, e, this.writeOptions), this.increaseBytesWrittenCounter(e);
			} catch (e) {
				this.emit("error", /* @__PURE__ */ Error(`Couldn't write to ${this.path}. ${e.message}`), this);
			}
		}
	};
	function a(e, t) {
		let n = Buffer.alloc(t), i = r.statSync(e), a = Math.min(i.size, t), o = Math.max(0, i.size - t), s = r.openSync(e, "r"), c = r.readSync(s, n, 0, a, o);
		return r.closeSync(s), n.toString("utf8", 0, c);
	}
})), j = /* @__PURE__ */ C(((e, t) => {
	var n = A();
	t.exports = class extends n {
		clear() {}
		crop() {}
		getSize() {
			return 0;
		}
		isNull() {
			return !0;
		}
		writeLine() {}
	};
})), M = /* @__PURE__ */ C(((e, t) => {
	var n = w("events"), r = w("fs"), i = w("path"), a = A(), o = j();
	t.exports = class extends n {
		store = {};
		constructor() {
			super(), this.emitError = this.emitError.bind(this);
		}
		provide({ filePath: e, writeOptions: t = {}, writeAsync: n = !1 }) {
			let r;
			try {
				if (e = i.resolve(e), this.store[e]) return this.store[e];
				r = this.createFile({
					filePath: e,
					writeOptions: t,
					writeAsync: n
				});
			} catch (t) {
				r = new o({ path: e }), this.emitError(t, r);
			}
			return r.on("error", this.emitError), this.store[e] = r, r;
		}
		createFile({ filePath: e, writeOptions: t, writeAsync: n }) {
			return this.testFileWriting({
				filePath: e,
				writeOptions: t
			}), new a({
				path: e,
				writeOptions: t,
				writeAsync: n
			});
		}
		emitError(e, t) {
			this.emit("error", e, t);
		}
		testFileWriting({ filePath: e, writeOptions: t }) {
			r.mkdirSync(i.dirname(e), { recursive: !0 }), r.writeFileSync(e, "", {
				flag: "a",
				mode: t.mode
			});
		}
	};
})), N = /* @__PURE__ */ C(((e, t) => {
	var n = w("fs"), r = w("os"), i = w("path"), a = M(), { transform: o } = T(), { removeStyles: s } = O(), { format: c, concatFirstStringElements: l } = E(), { toString: u } = D();
	t.exports = f;
	var d = new a();
	function f(e, { registry: t = d, externalApi: a } = {}) {
		let f;
		return t.listenerCount("error") < 1 && t.on("error", (e, t) => {
			g(`Can't write to ${t}`, e);
		}), Object.assign(m, {
			fileName: p(e.variables.processType),
			format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
			getFile: _,
			inspectOptions: { depth: 5 },
			level: "silly",
			maxSize: 1024 ** 2,
			readAllLogs: v,
			sync: !0,
			transforms: [
				s,
				c,
				l,
				u
			],
			writeOptions: {
				flag: "a",
				mode: 438,
				encoding: "utf8"
			},
			archiveLogFn(e) {
				let t = e.toString(), r = i.parse(t);
				try {
					n.renameSync(t, i.join(r.dir, `${r.name}.old${r.ext}`));
				} catch (t) {
					g("Could not rotate log", t);
					let n = Math.round(m.maxSize / 4);
					e.crop(Math.min(n, 256 * 1024));
				}
			},
			resolvePathFn(e) {
				return i.join(e.libraryDefaultDir, e.fileName);
			},
			setAppName(t) {
				e.dependencies.externalApi.setAppName(t);
			}
		});
		function m(t) {
			let n = _(t);
			m.maxSize > 0 && n.size > m.maxSize && (m.archiveLogFn(n), n.reset());
			let r = o({
				logger: e,
				message: t,
				transport: m
			});
			n.writeLine(r);
		}
		function h() {
			f || (f = Object.create(Object.prototype, {
				...Object.getOwnPropertyDescriptors(a.getPathVariables()),
				fileName: {
					get() {
						return m.fileName;
					},
					enumerable: !0
				}
			}), typeof m.archiveLog == "function" && (m.archiveLogFn = m.archiveLog, g("archiveLog is deprecated. Use archiveLogFn instead")), typeof m.resolvePath == "function" && (m.resolvePathFn = m.resolvePath, g("resolvePath is deprecated. Use resolvePathFn instead")));
		}
		function g(t, n = null, r = "error") {
			let i = [`electron-log.transports.file: ${t}`];
			n && i.push(n), e.transports.console({
				data: i,
				date: /* @__PURE__ */ new Date(),
				level: r
			});
		}
		function _(e) {
			h();
			let n = m.resolvePathFn(f, e);
			return t.provide({
				filePath: n,
				writeAsync: !m.sync,
				writeOptions: m.writeOptions
			});
		}
		function v({ fileFilter: e = (e) => e.endsWith(".log") } = {}) {
			h();
			let t = i.dirname(m.resolvePathFn(f));
			return n.existsSync(t) ? n.readdirSync(t).map((e) => i.join(t, e)).filter(e).map((e) => {
				try {
					return {
						path: e,
						lines: n.readFileSync(e, "utf8").split(r.EOL)
					};
				} catch {
					return null;
				}
			}).filter(Boolean) : [];
		}
	}
	function p(e = process.type) {
		switch (e) {
			case "renderer": return "renderer.log";
			case "worker": return "worker.log";
			default: return "main.log";
		}
	}
})), P = /* @__PURE__ */ C(((e, t) => {
	var { maxDepth: n, toJSON: r } = D(), { transform: i } = T();
	t.exports = a;
	function a(e, { externalApi: t }) {
		return Object.assign(a, {
			depth: 3,
			eventId: "__ELECTRON_LOG_IPC__",
			level: e.isDev ? "silly" : !1,
			transforms: [r, n]
		}), t?.isElectron() ? a : void 0;
		function a(n) {
			n?.variables?.processType !== "renderer" && t?.sendIpc(a.eventId, {
				...n,
				data: i({
					logger: e,
					message: n,
					transport: a
				})
			});
		}
	}
})), F = /* @__PURE__ */ C(((e, t) => {
	var n = w("http"), r = w("https"), { transform: i } = T(), { removeStyles: a } = O(), { toJSON: o, maxDepth: s } = D();
	t.exports = c;
	function c(e) {
		return Object.assign(t, {
			client: { name: "electron-application" },
			depth: 6,
			level: !1,
			requestOptions: {},
			transforms: [
				a,
				o,
				s
			],
			makeBodyFn({ message: e }) {
				return JSON.stringify({
					client: t.client,
					data: e.data,
					date: e.date.getTime(),
					level: e.level,
					scope: e.scope,
					variables: e.variables
				});
			},
			processErrorFn({ error: n }) {
				e.processMessage({
					data: [`electron-log: can't POST ${t.url}`, n],
					level: "warn"
				}, { transports: ["console", "file"] });
			},
			sendRequestFn({ serverUrl: e, requestOptions: t, body: i }) {
				let a = (e.startsWith("https:") ? r : n).request(e, {
					method: "POST",
					...t,
					headers: {
						"Content-Type": "application/json",
						"Content-Length": i.length,
						...t.headers
					}
				});
				return a.write(i), a.end(), a;
			}
		});
		function t(n) {
			if (!t.url) return;
			let r = t.makeBodyFn({
				logger: e,
				message: {
					...n,
					data: i({
						logger: e,
						message: n,
						transport: t
					})
				},
				transport: t
			}), a = t.sendRequestFn({
				serverUrl: t.url,
				requestOptions: t.requestOptions,
				body: Buffer.from(r, "utf8")
			});
			a.on("error", (r) => t.processErrorFn({
				error: r,
				logger: e,
				message: n,
				request: a,
				transport: t
			}));
		}
	}
})), I = /* @__PURE__ */ C(((e, t) => {
	var n = he(), r = ge(), i = _e(), a = k(), o = N(), s = P(), c = F();
	t.exports = l;
	function l({ dependencies: e, initializeFn: t }) {
		let l = new n({
			dependencies: e,
			errorHandler: new r(),
			eventLogger: new i(),
			initializeFn: t,
			isDev: e.externalApi?.isDev(),
			logId: "default",
			transportFactories: {
				console: a,
				file: o,
				ipc: s,
				remote: c
			},
			variables: { processType: "main" }
		});
		return l.default = l, l.Logger = n, l.processInternalErrorFn = (e) => {
			l.transports.console.writeFn({ message: {
				data: ["Unhandled electron-log error", e],
				level: "error"
			} });
		}, l;
	}
})), ve = /* @__PURE__ */ C(((e, t) => {
	var n = w("electron"), r = ue(), { initialize: i } = fe(), a = I(), o = new r({ electron: n }), s = a({
		dependencies: { externalApi: o },
		initializeFn: i
	});
	t.exports = s, o.onIpc("__ELECTRON_LOG__", (e, t) => {
		t.scope && s.Logger.getInstance(t).scope(t.scope);
		let n = new Date(t.date);
		c({
			...t,
			date: n.getTime() ? n : /* @__PURE__ */ new Date()
		});
	}), o.onIpcInvoke("__ELECTRON_LOG__", (e, { cmd: t = "", logId: n }) => {
		switch (t) {
			case "getOptions": return {
				levels: s.Logger.getInstance({ logId: n }).levels,
				logId: n
			};
			default: return c({
				data: [`Unknown cmd '${t}'`],
				level: "error"
			}), {};
		}
	});
	function c(e) {
		s.Logger.getInstance(e)?.processMessage(e);
	}
})), ye = /* @__PURE__ */ C(((e, t) => {
	t.exports = ve();
}));
//#endregion
//#region node_modules/steno/lib/index.js
function be(e) {
	let t = e instanceof URL ? _(e) : e.toString();
	return g(h(t), `.${m(t)}.tmp`);
}
async function xe(e, t, n) {
	for (let r = 0; r < t; r++) try {
		return await e();
	} catch (e) {
		if (r < t - 1) await new Promise((e) => setTimeout(e, n));
		else throw e;
	}
}
var Se = class {
	#e;
	#t;
	#n = !1;
	#r = null;
	#i = null;
	#a = null;
	#o = null;
	#s(e) {
		return this.#o = e, this.#a ||= new Promise((e, t) => {
			this.#i = [e, t];
		}), new Promise((e, t) => {
			this.#a?.then(e).catch(t);
		});
	}
	async #c(e) {
		this.#n = !0;
		try {
			await p(this.#t, e, "utf-8"), await xe(async () => {
				await f(this.#t, this.#e);
			}, 10, 100), this.#r?.[0]();
		} catch (e) {
			throw e instanceof Error && this.#r?.[1](e), e;
		} finally {
			if (this.#n = !1, this.#r = this.#i, this.#i = this.#a = null, this.#o !== null) {
				let e = this.#o;
				this.#o = null, await this.write(e);
			}
		}
	}
	constructor(e) {
		this.#e = e, this.#t = be(e);
	}
	async write(e) {
		return this.#n ? this.#s(e) : this.#c(e);
	}
}, Ce = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e, this.#t = new Se(e);
	}
	async read() {
		let e;
		try {
			e = await d(this.#e, "utf-8");
		} catch (e) {
			if (e.code === "ENOENT") return null;
			throw e;
		}
		return e;
	}
	write(e) {
		return this.#t.write(e);
	}
}, we = class {
	#e;
	#t;
	#n;
	constructor(e, { parse: t, stringify: n }) {
		this.#e = new Ce(e), this.#t = t, this.#n = n;
	}
	async read() {
		let e = await this.#e.read();
		return e === null ? null : this.#t(e);
	}
	write(e) {
		return this.#e.write(this.#n(e));
	}
}, Te = class extends we {
	constructor(e) {
		super(e, {
			parse: JSON.parse,
			stringify: (e) => JSON.stringify(e, null, 2)
		});
	}
}, Ee = class {
	#e = null;
	read() {
		return Promise.resolve(this.#e);
	}
	write(e) {
		return this.#e = e, Promise.resolve();
	}
};
//#endregion
//#region node_modules/lowdb/lib/core/Low.js
function De(e, t) {
	if (e === void 0) throw Error("lowdb: missing adapter");
	if (t === void 0) throw Error("lowdb: missing default data");
}
var Oe = class {
	adapter;
	data;
	constructor(e, t) {
		De(e, t), this.adapter = e, this.data = t;
	}
	async read() {
		let e = await this.adapter.read();
		e && (this.data = e);
	}
	async write() {
		this.data && await this.adapter.write(this.data);
	}
	async update(e) {
		e(this.data), await this.write();
	}
};
//#endregion
//#region node_modules/lowdb/lib/presets/node.js
async function ke(e, t) {
	let n = new Oe(process.env.NODE_ENV === "test" ? new Ee() : new Te(e), t);
	return await n.read(), n;
}
//#endregion
//#region src/storage/database.ts
var L = /* @__PURE__ */ se(ye(), 1), R = null;
function Ae(e) {
	R = e;
}
async function z(e, t) {
	if (!R) throw Error("User data path not set. Call setUserDataPath() first.");
	return ke(R + "/" + e, t);
}
//#endregion
//#region src/storage/seed.ts
async function je(e = "My Workspace") {
	let t = await z("db.workspaces.json", []), n = Date.now(), r = t.data.find((t) => t.name === e);
	if (r) return r;
	let i = {
		id: crypto.randomUUID(),
		name: e,
		createdAt: n,
		updatedAt: n
	};
	return t.data.push(i), await t.write(), i;
}
//#endregion
//#region src/storage/repositories/AgentRepository.ts
var B = null;
async function V() {
	return B ||= await z("db.agents.json", []), B;
}
var H = {
	async create(e) {
		let t = await V(), n = Date.now(), r = {
			id: crypto.randomUUID(),
			name: e.name,
			role: e.role,
			description: e.description,
			localPath: e.localPath,
			manifestPiSource: e.manifestPiSource,
			avatar: e.avatar,
			status: e.status,
			lastError: e.lastError,
			projectIds: [],
			taskIds: [],
			sessionIds: [],
			createdAt: n,
			updatedAt: n
		};
		return t.data.push(r), await t.write(), r;
	},
	async getById(e) {
		return (await V()).data.find((t) => t.id === e);
	},
	async getAll() {
		return (await V()).data;
	},
	async getByProject(e) {
		return (await V()).data.filter((t) => t.projectIds.includes(e));
	},
	async update(e, t) {
		let n = await V(), r = n.data.findIndex((t) => t.id === e);
		if (r === -1) return;
		let i = {
			...n.data[r],
			...t,
			updatedAt: Date.now()
		};
		return n.data[r] = i, await n.write(), i;
	},
	async delete(e) {
		let t = await V(), n = t.data.length;
		if (t.data = t.data.filter((t) => t.id !== e), t.data.length === n) return !1;
		let r = await z("db.projects.json", []);
		r.data.forEach((t) => {
			t.agentIds = t.agentIds.filter((t) => t !== e);
		}), await r.write();
		let i = await z("db.tasks.json", []);
		i.data.forEach((t) => {
			t.assignedAgentId === e && (t.assignedAgentId = void 0);
		}), await i.write();
		let a = await z("db.sessions.json", []);
		return a.data = a.data.filter((t) => t.agentId !== e), await a.write(), await t.write(), !0;
	},
	async getProjects(e) {
		let t = await this.getById(e);
		return t ? (await z("db.projects.json", [])).data.filter((e) => t.projectIds.includes(e.id)) : [];
	},
	async getTasks(e) {
		let t = await this.getById(e);
		return t ? (await z("db.tasks.json", [])).data.filter((e) => t.taskIds.includes(e.id)) : [];
	},
	async getSessions(e) {
		return await this.getById(e) ? (await z("db.sessions.json", [])).data.filter((t) => t.agentId === e) : [];
	},
	async assignToProject(e, t) {
		let n = await V(), r = await z("db.projects.json", []), i = n.data.find((t) => t.id === e), a = r.data.find((e) => e.id === t);
		!i || !a || (i.projectIds.includes(t) || (i.projectIds.push(t), i.updatedAt = Date.now()), a.agentIds.includes(e) || (a.agentIds.push(e), a.updatedAt = Date.now()), await n.write(), await r.write());
	},
	async removeFromProject(e, t) {
		let n = await V(), r = await z("db.projects.json", []), i = n.data.find((t) => t.id === e), a = r.data.find((e) => e.id === t);
		i && (i.projectIds = i.projectIds.filter((e) => e !== t), i.updatedAt = Date.now()), a && (a.agentIds = a.agentIds.filter((t) => t !== e), a.updatedAt = Date.now()), await n.write(), await r.write();
	},
	async addTask(e, t) {
		let n = await V(), r = n.data.find((t) => t.id === e);
		r && !r.taskIds.includes(t) && (r.taskIds.push(t), r.updatedAt = Date.now(), await n.write());
	},
	async removeTask(e, t) {
		let n = await V(), r = n.data.find((t) => t.id === e);
		r && (r.taskIds = r.taskIds.filter((e) => e !== t), r.updatedAt = Date.now(), await n.write());
	},
	async addSession(e, t) {
		let n = await V(), r = n.data.find((t) => t.id === e);
		r && !r.sessionIds.includes(t) && (r.sessionIds.push(t), r.updatedAt = Date.now(), await n.write());
	},
	async removeSession(e, t) {
		let n = await V(), r = n.data.find((t) => t.id === e);
		r && (r.sessionIds = r.sessionIds.filter((e) => e !== t), r.updatedAt = Date.now(), await n.write());
	}
};
//#endregion
//#region electron/ipc/agents.ts
function Me() {
	r.handle(X.AGENTS.LIST, () => H.getAll()), r.handle(X.AGENTS.GET, async (e, t) => await H.getById(t) ?? null), r.handle(X.AGENTS.CREATE, async (e, t) => {
		if (!t.name?.trim()) throw Error("Agent name is required");
		if (!t.folderName?.trim()) throw Error("Agent folder name is required");
		if (!t.parentDir?.trim()) throw Error("Parent directory is required");
		if (!t.manifestPiSource?.trim()) throw Error("Manifest Pi source is required");
		let n = t.folderName.trim(), r = t.parentDir.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? ""), i = t.manifestPiSource.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? "");
		if (!/^[a-z0-9][a-z0-9-]*$/.test(n)) throw Error("Folder name must be lowercase letters, digits, and hyphens (start with letter/digit)");
		if (L.default.info(`[agents:create] ensuring parent dir ${r}`), await u(r, { recursive: !0 }), !s(g(i, "agent.sh"))) throw Error(`Manifest Pi source invalid (missing agent.sh): ${i}`);
		let a = g(r, n);
		if (s(a)) throw Error(`Agent folder already exists: ${a}`);
		return L.default.info(`[agents:create] creating agent dir ${a}`), await u(a, { recursive: !0 }), await l(g(i, "agent.sh"), g(a, "agent.sh")), await c(g(a, "agent.sh"), 493), await p(g(a, "agent.json"), JSON.stringify({
			version: 1,
			name: t.name.trim(),
			description: t.description?.trim() ?? "",
			workspace: "./workspace",
			model: {
				provider: "minimax",
				name: "MiniMax-M2.7"
			},
			systemPrompt: "",
			environment: { MINIMAX_API_KEY: "sk-cp-GwASo9pAInPri5qnJiIh_BxWu5K18O_VjoUD8dFRN09aKvUDaseH2VnnEMG3RJk8191Lb7gMN9nmbCwHbPyH5FOHC9OZImpYcL58bHbZQzQgmcp9xmi1Og8" },
			skills: [],
			extensions: [],
			prompts: [],
			permissions: {
				filesystem: !0,
				terminal: !0,
				network: !0
			},
			memory: {},
			context: {},
			logging: { enabled: !0 }
		}, null, 2) + "\n", "utf8"), await p(g(a, ".agent-initialized"), "", "utf8"), await H.create({
			name: t.name.trim(),
			role: t.role?.trim() || void 0,
			description: t.description?.trim() || void 0,
			localPath: a,
			manifestPiSource: i,
			status: "initializing"
		});
	}), r.handle(X.AGENTS.UPDATE_STATUS, async (e, t, n, r) => H.update(t, {
		status: n,
		lastError: r
	})), r.handle(X.AGENTS.DELETE, async (e, t) => H.delete(t));
}
//#endregion
//#region src/storage/repositories/ProjectRepository.ts
var U = null;
async function W() {
	return U ||= await z("db.projects.json", []), U;
}
var G = {
	async create(e) {
		let t = await W(), n = Date.now(), r = {
			id: crypto.randomUUID(),
			name: e.name,
			description: e.description,
			localPath: e.localPath,
			okfFolderPath: e.okfFolderPath,
			color: e.color,
			icon: e.icon,
			archived: !1,
			agentIds: [],
			taskIds: [],
			channelIds: [],
			childProjectIds: [],
			createdAt: n,
			updatedAt: n
		};
		return t.data.push(r), await t.write(), r;
	},
	async getById(e) {
		return (await W()).data.find((t) => t.id === e);
	},
	async getAll() {
		return (await W()).data;
	},
	async getChildProjects(e) {
		return (await W()).data.filter((t) => t.parentProjectId === e);
	},
	async getRootProjects() {
		return (await W()).data.filter((e) => !e.parentProjectId);
	},
	async update(e, t) {
		let n = await W(), r = n.data.findIndex((t) => t.id === e);
		if (r === -1) return;
		let i = {
			...n.data[r],
			...t,
			updatedAt: Date.now()
		};
		return n.data[r] = i, await n.write(), i;
	},
	async delete(e) {
		let t = await W(), n = t.data.length;
		if (t.data = t.data.filter((t) => t.id !== e), t.data.length === n) return !1;
		let r = t.data.findIndex((t) => t.childProjectIds.includes(e));
		r !== -1 && t.data[r] && (t.data[r].childProjectIds = t.data[r].childProjectIds.filter((t) => t !== e)), await t.write();
		let i = await z("db.agents.json", []);
		i.data.forEach((t) => {
			t.projectIds = t.projectIds.filter((t) => t !== e);
		}), await i.write();
		let a = await z("db.channels.json", []);
		a.data = a.data.filter((t) => t.projectId !== e), await a.write();
		let o = await z("db.tasks.json", []);
		return o.data = o.data.filter((t) => t.projectId !== e), await o.write(), !0;
	},
	async getAgents(e) {
		let t = await this.getById(e);
		return t ? (await z("db.agents.json", [])).data.filter((e) => t.agentIds.includes(e.id)) : [];
	},
	async getTasks(e) {
		let t = await this.getById(e);
		return t ? (await z("db.tasks.json", [])).data.filter((e) => t.taskIds.includes(e.id)) : [];
	},
	async getChannels(e) {
		let t = await this.getById(e);
		return t ? (await z("db.channels.json", [])).data.filter((e) => t.channelIds.includes(e.id)) : [];
	},
	async addAgent(e, t) {
		let n = await W(), r = await z("db.agents.json", []), i = n.data.find((t) => t.id === e), a = r.data.find((e) => e.id === t);
		!i || !a || (i.agentIds.includes(t) || (i.agentIds.push(t), i.updatedAt = Date.now()), a.projectIds.includes(e) || (a.projectIds.push(e), a.updatedAt = Date.now()), await n.write(), await r.write());
	},
	async removeAgent(e, t) {
		let n = await W(), r = await z("db.agents.json", []), i = n.data.find((t) => t.id === e), a = r.data.find((e) => e.id === t);
		i && (i.agentIds = i.agentIds.filter((e) => e !== t), i.updatedAt = Date.now()), a && (a.projectIds = a.projectIds.filter((t) => t !== e), a.updatedAt = Date.now()), await n.write(), await r.write();
	},
	async addTask(e, t) {
		let n = await W(), r = n.data.find((t) => t.id === e);
		r && !r.taskIds.includes(t) && (r.taskIds.push(t), r.updatedAt = Date.now(), await n.write());
	},
	async removeTask(e, t) {
		let n = await W(), r = n.data.find((t) => t.id === e);
		r && (r.taskIds = r.taskIds.filter((e) => e !== t), r.updatedAt = Date.now(), await n.write());
	},
	async addChannel(e, t) {
		let n = await W(), r = n.data.find((t) => t.id === e);
		r && !r.channelIds.includes(t) && (r.channelIds.push(t), r.updatedAt = Date.now(), await n.write());
	},
	async removeChannel(e, t) {
		let n = await W(), r = n.data.find((t) => t.id === e);
		r && (r.channelIds = r.channelIds.filter((e) => e !== t), r.updatedAt = Date.now(), await n.write());
	},
	async addChildProject(e, t) {
		let n = await W(), r = n.data.find((t) => t.id === e), i = n.data.find((e) => e.id === t);
		!r || !i || (r.childProjectIds.includes(t) || (r.childProjectIds.push(t), r.updatedAt = Date.now()), i.parentProjectId || (i.parentProjectId = e, i.updatedAt = Date.now()), await n.write());
	},
	async removeChildProject(e, t) {
		let n = await W(), r = n.data.find((t) => t.id === e), i = n.data.find((e) => e.id === t);
		r && (r.childProjectIds = r.childProjectIds.filter((e) => e !== t), r.updatedAt = Date.now()), i && (i.parentProjectId = void 0, i.updatedAt = Date.now()), await n.write();
	}
};
//#endregion
//#region electron/ipc/projects.ts
function Ne() {
	r.handle(X.PROJECTS.LIST, () => G.getAll()), r.handle(X.PROJECTS.GET, async (e, t) => await G.getById(t) ?? null), r.handle(X.PROJECTS.CREATE, async (e, t) => {
		if (!t.name?.trim()) throw Error("Project name is required");
		return G.create({
			name: t.name.trim(),
			description: t.description?.trim() || void 0
		});
	});
}
//#endregion
//#region electron/pi-protocol/types.ts
function Pe(e) {
	let t = e.toLowerCase();
	return t.includes("installing pi dependencies") || t.includes("npm install") ? "installing-deps" : t.includes("building pi workspace") || t.includes("npm run build") || t.includes("building") ? "building-runtime" : t.includes("creating default manifest") || t.includes("agent.json") ? "generating-manifest" : t.includes("workspace") || t.includes("creating workspace") ? "creating-workspace" : t.includes("launching") || t.includes("starting runtime") ? "launching-runtime" : t.includes("connecting") || t.includes("connecting chat") ? "connecting-chat" : null;
}
//#endregion
//#region electron/pi-protocol/raw-text-adapter.ts
var Fe = class {
	lineBuffer = "";
	currentMessageId = null;
	onStdout(e, t) {
		this.lineBuffer += e;
		let n = this.lineBuffer.split("\n");
		this.lineBuffer = n.pop() ?? "";
		for (let e of n) {
			let n = e.trim();
			if (!n) continue;
			let r = null;
			try {
				r = JSON.parse(n);
			} catch {
				t({
					type: "log",
					stream: "stdout",
					line: n
				});
			}
			if (r && typeof r == "object") {
				let e = r;
				e.type === "message_update" && e.assistantMessageEvent?.type === "text_delta" ? (this.currentMessageId || (this.currentMessageId = te(), t({
					type: "message-start",
					messageId: this.currentMessageId,
					role: "assistant"
				})), t({
					type: "text-delta",
					messageId: this.currentMessageId,
					delta: e.assistantMessageEvent?.delta ?? ""
				})) : e.type === "agent_end" || e.type === "message_end" ? this.currentMessageId &&= (t({
					type: "message-end",
					messageId: this.currentMessageId
				}), null) : e.type === "response" && e.success === !1 && t({
					type: "error",
					message: e.error ?? "Unknown error from Pi",
					recoverable: !0
				});
			}
		}
	}
	onStderr(e, t) {
		for (let n of e.split("\n")) {
			let e = n.trim();
			if (!e) continue;
			t({
				type: "log",
				stream: "stderr",
				line: e
			});
			let r = Pe(e);
			r && t({
				type: "boot-step",
				step: r
			});
		}
	}
	serializeInput(e) {
		return JSON.stringify({
			type: "prompt",
			message: e
		}) + "\n";
	}
	reset() {
		this.lineBuffer = "", this.currentMessageId = null;
	}
}, Ie = 500, Le = 2e3, K = new class {
	entries = /* @__PURE__ */ new Map();
	adapterFactories = /* @__PURE__ */ new Map();
	silenceTimers = /* @__PURE__ */ new Map();
	readyEmitted = /* @__PURE__ */ new Set();
	registerAdapterFactory(e, t) {
		this.adapterFactories.set(e, t);
	}
	getState(e) {
		return this.entries.get(e) ?? null;
	}
	getStatusPayload(e) {
		let t = this.entries.get(e);
		return t ? {
			agentId: t.agentId,
			status: t.status,
			pid: t.pid,
			startedAt: t.startedAt,
			endedAt: t.endedAt,
			lastError: t.lastError,
			bootStep: t.bootStep
		} : null;
	}
	listAgents() {
		return Array.from(this.entries.keys());
	}
	isRunning(e) {
		let t = this.entries.get(e);
		return !!t?.process && t.status !== "stopped" && t.status !== "error";
	}
	start(e, t, n) {
		if (this.isRunning(e)) {
			L.default.info(`[runtime] agent ${e} already running, ignoring start`);
			return;
		}
		let r = this.entries.get(e), i = (this.adapterFactories.get(e) ?? (() => new Fe()))(), a = r ?? {
			agentId: e,
			agentDir: t,
			manifestPiSource: n,
			process: null,
			status: "initializing",
			messages: [],
			stderrLog: [],
			adapter: i
		};
		a.adapter = i, a.agentDir = t, a.manifestPiSource = n, a.status = "initializing", a.startedAt = Date.now(), a.endedAt = void 0, a.lastError = void 0, a.bootStep = void 0, a.stderrLog = [], i.reset(), this.entries.set(e, a), this.emitStatus(e), this.spawnProcess(a);
	}
	stop(e) {
		this.clearSilenceTimer(e), this.readyEmitted.delete(e);
		let t = this.entries.get(e);
		if (!t?.process) {
			t && this.transitionStatus(t, "stopped");
			return;
		}
		this.terminateProcess(t.process), setTimeout(() => {
			t.process?.killed || t.process?.kill("SIGTERM");
		}, 500);
	}
	restart(e) {
		let t = this.entries.get(e);
		t && (this.stop(e), setTimeout(() => this.start(e, t.agentDir, t.manifestPiSource), 800));
	}
	send(e, t) {
		let n = this.entries.get(e);
		if (!n?.process || !t.trim()) return !1;
		let r = {
			id: crypto.randomUUID(),
			role: "user",
			content: t,
			ts: Date.now()
		};
		n.messages.push(r), this.transitionStatus(n, "busy"), this.emitMessages(e), console.log(`[runtime.send] agent=${e} wire=${n.adapter.serializeInput(t).replace(/\n$/, "")}`);
		try {
			let e = n.adapter.serializeInput(t);
			return n.process.stdin?.write(e), !0;
		} catch (t) {
			return L.default.error(`[runtime] send failed for ${e}:`, t), n.lastError = t instanceof Error ? t.message : String(t), this.transitionStatus(n, "error"), !1;
		}
	}
	shutdownAll() {
		for (let e of Array.from(this.silenceTimers.keys())) this.clearSilenceTimer(e);
		this.readyEmitted.clear();
		for (let [, e] of this.entries) e.process && (this.terminateProcess(e.process), e.status = "stopped", L.default.info(`[runtime] shutdown agent ${e.agentId}`));
		setTimeout(() => {
			for (let [, e] of this.entries) if (e.process && !e.process.killed) {
				try {
					e.process.kill("SIGKILL");
				} catch {}
				L.default.warn(`[runtime] SIGKILL agent ${e.agentId}`);
			}
		}, 3e3);
	}
	removeEntry(e) {
		this.clearSilenceTimer(e), this.readyEmitted.delete(e), this.stop(e), this.entries.delete(e);
	}
	spawnProcess(e) {
		let { agentId: t, agentDir: n, manifestPiSource: r } = e, i = g(n, "agent.sh"), a = g(r, "pi");
		L.default.info(`[runtime] spawning ${i} (PI_DIR=${a})`);
		let o;
		try {
			o = ee("/bin/bash", [
				i,
				"--mode",
				"rpc",
				"--no-session"
			], {
				cwd: n,
				stdio: [
					"pipe",
					"pipe",
					"pipe"
				],
				env: {
					...process.env,
					PI_DIR: a
				}
			});
		} catch (n) {
			L.default.error(`[runtime] spawn failed for ${t}:`, n), e.lastError = n instanceof Error ? n.message : String(n), this.transitionStatus(e, "error");
			return;
		}
		e.process = o, e.pid = o.pid, this.readyEmitted.delete(t), this.resetSilenceTimer(e), o.stdout?.on("data", (n) => {
			let r = n.toString("utf8"), i = r.length > 200 ? r.slice(0, 200) + "..." : r;
			console.log(`[runtime.stdout] agent=${t} len=${n.length} preview=${JSON.stringify(i)}`), e.adapter.onStdout(r, (e) => this.handleAdapterEvent(t, e)), this.resetSilenceTimer(e);
		}), o.stderr?.on("data", (n) => {
			let r = n.toString("utf8");
			for (let t of r.split("\n")) {
				let n = t.trim();
				n && (e.stderrLog.push(n), e.stderrLog.length > Ie && e.stderrLog.shift());
			}
			let i = r.length > 200 ? r.slice(0, 200) + "..." : r;
			console.log(`[runtime.stderr] agent=${t} len=${n.length} preview=${JSON.stringify(i)}`), e.adapter.onStderr(r, (e) => this.handleAdapterEvent(t, e)), this.resetSilenceTimer(e);
		}), o.on("exit", (n, r) => {
			L.default.info(`[runtime] agent ${t} exited code=${n} signal=${r}`), this.clearSilenceTimer(t), e.process = null, e.pid = void 0, e.endedAt = Date.now(), n === 0 || r === "SIGTERM" || r === "SIGKILL" ? this.transitionStatus(e, "stopped") : (e.lastError = e.stderrLog.slice(-3).join(" | ") || `Process exited with code ${n}`, this.transitionStatus(e, "error")), this.emitStatus(t), this.sendExitEvent(t, n, r);
		}), o.on("error", (n) => {
			L.default.error(`[runtime] agent ${t} error:`, n), e.lastError = n.message, this.transitionStatus(e, "error");
		});
	}
	terminateProcess(e) {
		try {
			e.stdin?.write(JSON.stringify({ type: "abort" }) + "\n");
		} catch {}
		try {
			e.stdin?.end();
		} catch {}
	}
	transitionStatus(e, t, n) {
		let r = e.status;
		r !== t && (e.status = t, console.log(`[runtime.status] agent=${e.agentId} ${r} → ${t}${n ? ` (${n})` : ""}`), this.emitStatus(e.agentId));
	}
	handleAdapterEvent(e, t) {
		let n = this.entries.get(e);
		if (!n) return;
		if (t.type === "boot-step") {
			n.bootStep = t.step, this.emitStatus(e);
			return;
		}
		if (t.type === "ready") {
			this.transitionStatus(n, "running"), console.log(`[runtime.event] agent=${e} type=ready`);
			return;
		}
		if (t.type === "message-start") {
			let r = {
				id: t.messageId,
				role: t.role,
				content: "",
				ts: Date.now()
			};
			n.messages.push(r), this.transitionStatus(n, "busy"), console.log(`[runtime.event] agent=${e} type=message-start role=${t.role}`), this.emitMessages(e);
			return;
		}
		if (t.type === "text-delta") {
			let r = n.messages.find((e) => e.id === t.messageId);
			if (r) {
				r.content += t.delta;
				let n = t.delta.length > 100 ? t.delta.slice(0, 100) + "..." : t.delta;
				console.log(`[runtime.event] agent=${e} type=text-delta delta=${JSON.stringify(n)}`), this.emitEvent(e, t);
			}
			return;
		}
		if (t.type === "message-end") {
			n.messages.find((e) => e.id === t.messageId) && this.emitEvent(e, t), this.transitionStatus(n, "running"), console.log(`[runtime.event] agent=${e} type=message-end`);
			return;
		}
		if (t.type === "log") {
			let n = t.line.length > 200 ? t.line.slice(0, 200) + "..." : t.line;
			console.log(`[runtime.event] agent=${e} type=log stream=${t.stream} line=${JSON.stringify(n)}`), this.emitEvent(e, t);
			return;
		}
		if (t.type === "error") {
			console.log(`[runtime.event] agent=${e} type=error message=${JSON.stringify(t.message)} recoverable=${t.recoverable}`), n.lastError = t.message, this.transitionStatus(n, "running"), this.emitEvent(e, t);
			return;
		}
		let r = JSON.stringify(t), i = r.length > 300 ? r.slice(0, 300) + "..." : r;
		console.log(`[runtime.event] agent=${e} ${i}`), this.emitEvent(e, t);
	}
	getWindow() {
		return t.getAllWindows()[0] ?? null;
	}
	emitEvent(e, t) {
		let n = this.getWindow();
		!n || n.isDestroyed() || n.webContents.send(X.AGENTS.ON_EVENT(e), t);
	}
	emitStatus(e) {
		let t = this.getWindow();
		if (!t || t.isDestroyed()) return;
		let n = this.entries.get(e);
		n && t.webContents.send(X.AGENTS.ON_STATUS(e), {
			agentId: e,
			status: n.status,
			pid: n.pid,
			startedAt: n.startedAt,
			endedAt: n.endedAt,
			lastError: n.lastError,
			bootStep: n.bootStep
		});
	}
	emitMessages(e) {
		let t = this.getWindow();
		if (!t || t.isDestroyed()) return;
		let n = this.entries.get(e);
		n && t.webContents.send(X.AGENTS.ON_MESSAGES(e), n.messages);
	}
	sendExitEvent(e, t, n) {
		let r = this.getWindow();
		if (!r || r.isDestroyed()) return;
		let i = this.entries.get(e);
		r.webContents.send(X.AGENTS.ON_EXIT(e), {
			agentId: e,
			code: t,
			signal: n,
			status: i?.status ?? "stopped"
		});
	}
	resetSilenceTimer(e) {
		let t = e.agentId, n = this.silenceTimers.get(t);
		n && clearTimeout(n);
		let r = setTimeout(() => this.maybeEmitReady(t), Le);
		this.silenceTimers.set(t, r);
	}
	clearSilenceTimer(e) {
		let t = this.silenceTimers.get(e);
		t && (clearTimeout(t), this.silenceTimers.delete(e));
	}
	maybeEmitReady(e) {
		if (this.silenceTimers.delete(e), this.readyEmitted.has(e)) return;
		let t = this.entries.get(e);
		!t || !t.process || (this.readyEmitted.add(e), t.bootStep = "ready", t.status = "running", L.default.info(`[runtime] agent ${e} ready (silence-based)`), this.emitStatus(e), this.emitEvent(e, {
			type: "boot-step",
			step: "ready"
		}), this.emitEvent(e, { type: "ready" }));
	}
}();
//#endregion
//#region electron/ipc/runtime.ts
function Re() {
	r.handle(X.AGENTS.START, async (e, t) => {
		let n = await H.getById(t);
		if (!n) throw Error(`Agent not found: ${t}`);
		if (!n.localPath) throw Error(`Agent has no localPath: ${t}`);
		if (!n.manifestPiSource) throw Error(`Agent has no manifestPiSource: ${t}`);
		return K.start(t, n.localPath, n.manifestPiSource), await H.update(t, {
			status: "initializing",
			lastError: void 0
		}), { ok: !0 };
	}), r.handle(X.AGENTS.STOP, async (e, t) => (K.stop(t), await H.update(t, { status: "stopped" }), { ok: !0 })), r.handle(X.AGENTS.RESTART, async (e, t) => (K.restart(t), await H.update(t, {
		status: "initializing",
		lastError: void 0
	}), { ok: !0 })), r.handle(X.AGENTS.SEND, async (e, t, n) => ({ ok: K.send(t, n) })), r.handle(X.AGENTS.GET_RUNTIME_STATE, (e, t) => K.getStatusPayload(t));
}
//#endregion
//#region electron/ipc/manifest-pi.ts
var ze = ne(v), q = g(y(), ".superhive", "manifest-pi-template"), Be = "https://github.com/rishi-ie/manifest-pi.git", Ve = 18e4;
async function J() {
	return s(g(q, "agent.sh"));
}
function Y() {
	r.handle(X.MANIFEST_PI.ENSURE_TEMPLATE, async () => {
		if (await J()) return {
			ok: !0,
			path: q,
			cloned: !1
		};
		try {
			return await u(g(y(), ".superhive"), { recursive: !0 }), L.default.info(`[manifest-pi] cloning template to ${q}`), await ze("git", [
				"clone",
				Be,
				q
			], { timeout: Ve }), await J() ? {
				ok: !0,
				path: q,
				cloned: !0
			} : {
				ok: !1,
				path: q,
				error: "Clone finished but agent.sh is missing in the result."
			};
		} catch (e) {
			let t = e instanceof Error ? e.message : String(e);
			return L.default.error("[manifest-pi] clone failed:", t), {
				ok: !1,
				path: q,
				error: t
			};
		}
	}), r.handle(X.MANIFEST_PI.CHECK_TEMPLATE, async () => ({
		ok: await J(),
		path: q
	}));
}
//#endregion
//#region electron/ipc/index.ts
var X = {
	AGENTS: {
		LIST: "agents:list",
		GET: "agents:get",
		CREATE: "agents:create",
		DELETE: "agents:delete",
		UPDATE_STATUS: "agents:updateStatus",
		START: "agents:start",
		STOP: "agents:stop",
		RESTART: "agents:restart",
		SEND: "agents:send",
		GET_RUNTIME_STATE: "agents:getRuntimeState",
		ON_EVENT: (e) => `agent:${e}:event`,
		ON_STATUS: (e) => `agent:${e}:status`,
		ON_MESSAGES: (e) => `agent:${e}:messages`,
		ON_EXIT: (e) => `agent:${e}:exit`
	},
	PROJECTS: {
		LIST: "projects:list",
		GET: "projects:get",
		CREATE: "projects:create"
	},
	MANIFEST_PI: {
		ENSURE_TEMPLATE: "manifest-pi:ensureTemplate",
		CHECK_TEMPLATE: "manifest-pi:checkTemplate"
	}
};
function He() {
	Me(), Ne(), Re(), Y();
}
//#endregion
//#region electron/main.ts
var Z = i(o(import.meta.url));
L.default.initialize(), L.default.info("Superhive starting...");
var Q = null;
function $() {
	Q = new t({
		width: 1200,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		title: "Superhive",
		backgroundColor: "#151110",
		frame: !1,
		titleBarStyle: "hidden",
		trafficLightPosition: {
			x: 16,
			y: 16
		},
		show: !1,
		webPreferences: {
			preload: a(Z, "preload.js"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	}), Q.maximize(), Q.show(), process.env.VITE_DEV_SERVER_URL ? (L.default.info("Loading dev server:", process.env.VITE_DEV_SERVER_URL), Q.loadURL(process.env.VITE_DEV_SERVER_URL)) : (L.default.info("Loading production build"), Q.loadFile(a(Z, "../dist/index.html"))), Q.on("closed", () => {
		Q = null;
	});
}
n.whenReady().then(async () => {
	L.default.info("App ready"), Ae(n.getPath("userData")), await je(), He(), $(), n.on("activate", () => {
		t.getAllWindows().length === 0 && $();
	});
}), n.on("window-all-closed", () => {
	L.default.info("All windows closed"), process.platform !== "darwin" && n.quit();
}), n.on("before-quit", () => {
	L.default.info("Shutting down agent runtimes..."), K.shutdownAll();
}), process.on("uncaughtException", (e) => {
	L.default.error("Uncaught exception:", e);
}), process.on("unhandledRejection", (e) => {
	L.default.error("Unhandled rejection:", e);
});
//#endregion
export {};
