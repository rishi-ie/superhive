import { createRequire as e } from "node:module";
import { BrowserWindow as t, app as n, ipcMain as r } from "electron";
import { dirname as i, join as a } from "path";
import { fileURLToPath as o } from "url";
import * as s from "fs";
import { Buffer as c } from "node:buffer";
//#region \0rolldown/runtime.js
var l = Object.create, u = Object.defineProperty, d = Object.getOwnPropertyDescriptor, f = Object.getOwnPropertyNames, p = Object.getPrototypeOf, m = Object.prototype.hasOwnProperty, h = (e, t) => () => (e && (t = e(e = 0)), t), g = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), _ = (e, t) => {
	let n = {};
	for (var r in e) u(n, r, {
		get: e[r],
		enumerable: !0
	});
	return t || u(n, Symbol.toStringTag, { value: "Module" }), n;
}, v = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = f(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !m.call(e, s) && s !== n && u(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = d(t, s)) || r.enumerable
	});
	return e;
}, y = (e, t, n) => (n = e == null ? {} : l(p(e)), v(t || !e || !e.__esModule ? u(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), b = (e) => m.call(e, "module.exports") ? e["module.exports"] : v(u({}, "__esModule", { value: !0 }), e), x = /* @__PURE__ */ e(import.meta.url), S = /* @__PURE__ */ g(((e, t) => {
	var n = x("fs"), r = x("path");
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
			return x.main?.filename;
		} catch {
			return;
		}
	}
})), ee = /* @__PURE__ */ g(((e, t) => {
	var n = x("child_process"), r = x("os"), i = x("path"), a = S();
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
})), C = /* @__PURE__ */ g(((e, t) => {
	var n = x("path"), r = ee();
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
})), te = /* @__PURE__ */ g(((e, t) => {
	var n = {};
	try {
		n = x("electron");
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
})), ne = /* @__PURE__ */ g(((e, t) => {
	var n = x("fs"), r = x("os"), i = x("path"), a = te(), o = !1, s = !1;
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
})), re = /* @__PURE__ */ g(((e, t) => {
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
})), ie = /* @__PURE__ */ g(((e, t) => {
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
})), ae = /* @__PURE__ */ g(((e, t) => {
	var n = re(), r = ie();
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
})), oe = /* @__PURE__ */ g(((e, t) => {
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
})), se = /* @__PURE__ */ g(((e, t) => {
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
})), w = /* @__PURE__ */ g(((e, t) => {
	t.exports = { transform: n };
	function n({ logger: e, message: t, transport: n, initialData: r = t?.data || [], transforms: i = n?.transforms }) {
		return i.reduce((r, i) => typeof i == "function" ? i({
			data: r,
			logger: e,
			message: t,
			transport: n
		}) : r, r);
	}
})), T = /* @__PURE__ */ g(((e, t) => {
	var { transform: n } = w();
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
})), E = /* @__PURE__ */ g(((e, t) => {
	var n = x("util");
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
})), D = /* @__PURE__ */ g(((e, t) => {
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
})), ce = /* @__PURE__ */ g(((e, t) => {
	var { concatFirstStringElements: n, format: r } = T(), { maxDepth: i, toJSON: a } = E(), { applyAnsiStyles: o, removeStyles: s } = D(), { transform: c } = w(), l = {
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
})), le = /* @__PURE__ */ g(((e, t) => {
	var n = x("events"), r = x("fs"), i = x("os");
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
})), ue = /* @__PURE__ */ g(((e, t) => {
	var n = le();
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
})), de = /* @__PURE__ */ g(((e, t) => {
	var n = x("events"), r = x("fs"), i = x("path"), a = le(), o = ue();
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
})), O = /* @__PURE__ */ g(((e, t) => {
	var n = x("fs"), r = x("os"), i = x("path"), a = de(), { transform: o } = w(), { removeStyles: s } = D(), { format: c, concatFirstStringElements: l } = T(), { toString: u } = E();
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
})), fe = /* @__PURE__ */ g(((e, t) => {
	var { maxDepth: n, toJSON: r } = E(), { transform: i } = w();
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
})), pe = /* @__PURE__ */ g(((e, t) => {
	var n = x("http"), r = x("https"), { transform: i } = w(), { removeStyles: a } = D(), { toJSON: o, maxDepth: s } = E();
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
})), me = /* @__PURE__ */ g(((e, t) => {
	var n = ae(), r = oe(), i = se(), a = ce(), o = O(), s = fe(), c = pe();
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
})), he = /* @__PURE__ */ g(((e, t) => {
	var n = x("electron"), r = C(), { initialize: i } = ne(), a = me(), o = new r({ electron: n }), s = a({
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
})), k = /* @__PURE__ */ y((/* @__PURE__ */ g(((e, t) => {
	t.exports = he();
})))(), 1), A = class extends Error {
	code;
	extendedCode;
	rawCode;
	constructor(e, t, n, r, i) {
		t !== void 0 && (e = `${t}: ${e}`), super(e, { cause: i }), this.code = t, this.extendedCode = n, this.rawCode = r, this.name = "LibsqlError";
	}
}, j = class extends A {
	statementIndex;
	constructor(e, t, n, r, i, a) {
		super(e, n, r, i, a), this.statementIndex = t, this.name = "LibsqlBatchError";
	}
};
//#endregion
//#region node_modules/@libsql/core/lib-esm/uri.js
function ge(e) {
	let t = _e.exec(e);
	if (t === null) throw new A(`The URL '${e}' is not in a valid format`, "URL_INVALID");
	let n = t.groups;
	return {
		scheme: n.scheme,
		authority: n.authority === void 0 ? void 0 : ve(n.authority),
		path: M(n.path),
		query: n.query === void 0 ? void 0 : be(n.query),
		fragment: n.fragment === void 0 ? void 0 : M(n.fragment)
	};
}
var _e = /* @__PURE__ */ RegExp("^(?<scheme>[A-Za-z][A-Za-z.+-]*):(//(?<authority>[^/?#]*))?(?<path>[^?#]*)(\\?(?<query>[^#]*))?(#(?<fragment>.*))?$", "su");
function ve(e) {
	let t = ye.exec(e);
	if (t === null) throw new A("The authority part of the URL is not in a valid format", "URL_INVALID");
	let n = t.groups;
	return {
		host: M(n.host_br ?? n.host),
		port: n.port ? parseInt(n.port, 10) : void 0,
		userinfo: n.username === void 0 ? void 0 : {
			username: M(n.username),
			password: n.password === void 0 ? void 0 : M(n.password)
		}
	};
}
var ye = /* @__PURE__ */ RegExp("^((?<username>[^:]*)(:(?<password>.*))?@)?((?<host>[^:\\[\\]]*)|(\\[(?<host_br>[^\\[\\]]*)\\]))(:(?<port>[0-9]*))?$", "su");
function be(e) {
	let t = e.split("&"), n = [];
	for (let e of t) {
		if (e === "") continue;
		let t, r, i = e.indexOf("=");
		i < 0 ? (t = e, r = "") : (t = e.substring(0, i), r = e.substring(i + 1)), n.push({
			key: M(t.replaceAll("+", " ")),
			value: M(r.replaceAll("+", " "))
		});
	}
	return { pairs: n };
}
function M(e) {
	try {
		return decodeURIComponent(e);
	} catch (e) {
		throw e instanceof URIError ? new A(`URL component has invalid percent encoding: ${e}`, "URL_INVALID", void 0, void 0, e) : e;
	}
}
function xe(e, t, n) {
	if (t === void 0) throw new A(`URL with scheme ${JSON.stringify(e + ":")} requires authority (the "//" part)`, "URL_INVALID");
	let r = `${e}:`, i = Se(t.host), a = Ce(t.port), o = `//${we(t.userinfo)}${i}${a}`, s = n.split("/").map(encodeURIComponent).join("/");
	return s !== "" && !s.startsWith("/") && (s = "/" + s), new URL(`${r}${o}${s}`);
}
function Se(e) {
	return e.includes(":") ? `[${encodeURI(e)}]` : encodeURI(e);
}
function Ce(e) {
	return e === void 0 ? "" : `:${e}`;
}
function we(e) {
	return e === void 0 ? "" : `${encodeURIComponent(e.username)}${e.password === void 0 ? "" : `:${encodeURIComponent(e.password)}`}@`;
}
//#endregion
//#region node_modules/js-base64/base64.mjs
var Te = "3.8.0", Ee = Te, De = typeof Buffer == "function", Oe = typeof TextDecoder == "function" ? new TextDecoder("utf-8", { ignoreBOM: !0 }) : void 0, ke = typeof TextEncoder == "function" ? new TextEncoder() : void 0, Ae = Array.prototype.slice.call("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="), je = ((e) => {
	let t = {};
	return e.forEach((e, n) => t[e] = n), t;
})(Ae), Me = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/, N = String.fromCharCode.bind(String), Ne = typeof Uint8Array.from == "function" ? Uint8Array.from.bind(Uint8Array) : (e) => new Uint8Array(Array.prototype.slice.call(e, 0)), Pe = (e) => e.replace(/=/g, "").replace(/[+\/]/g, (e) => e == "+" ? "-" : "_"), Fe = (e) => e.replace(/[^A-Za-z0-9\+\/]/g, ""), Ie = (e) => {
	let t, n, r, i, a = "", o = e.length % 3;
	for (let o = 0; o < e.length;) {
		if ((n = e.charCodeAt(o++)) > 255 || (r = e.charCodeAt(o++)) > 255 || (i = e.charCodeAt(o++)) > 255) throw TypeError("invalid character found");
		t = n << 16 | r << 8 | i, a += Ae[t >> 18 & 63] + Ae[t >> 12 & 63] + Ae[t >> 6 & 63] + Ae[t & 63];
	}
	return o ? a.slice(0, o - 3) + "===".substring(o) : a;
}, Le = typeof btoa == "function" ? (e) => btoa(e) : De ? (e) => Buffer.from(e, "binary").toString("base64") : Ie, Re = De ? (e) => Buffer.from(e).toString("base64") : (e) => {
	let t = 4096, n = [];
	for (let r = 0, i = e.length; r < i; r += t) n.push(N.apply(null, e.subarray(r, r + t)));
	return Le(n.join(""));
}, ze = (e, t = !1) => t ? Pe(Re(e)) : Re(e), Be = (e) => {
	if (e.length < 2) {
		var t = e.charCodeAt(0);
		return t < 128 ? e : t < 2048 ? N(192 | t >>> 6) + N(128 | t & 63) : N(224 | t >>> 12 & 15) + N(128 | t >>> 6 & 63) + N(128 | t & 63);
	} else {
		var t = 65536 + (e.charCodeAt(0) - 55296) * 1024 + (e.charCodeAt(1) - 56320);
		return N(240 | t >>> 18 & 7) + N(128 | t >>> 12 & 63) + N(128 | t >>> 6 & 63) + N(128 | t & 63);
	}
}, Ve = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g, He = (e) => e.replace(Ve, Be), Ue = De ? (e) => Buffer.from(e, "utf8").toString("base64") : ke ? (e) => Re(ke.encode(e)) : (e) => Le(He(e)), We = (e, t = !1) => t ? Pe(Ue(e)) : Ue(e), Ge = (e) => We(e, !0), Ke = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g, qe = (e) => {
	switch (e.length) {
		case 4:
			var t = ((7 & e.charCodeAt(0)) << 18 | (63 & e.charCodeAt(1)) << 12 | (63 & e.charCodeAt(2)) << 6 | 63 & e.charCodeAt(3)) - 65536;
			return N((t >>> 10) + 55296) + N((t & 1023) + 56320);
		case 3: return N((15 & e.charCodeAt(0)) << 12 | (63 & e.charCodeAt(1)) << 6 | 63 & e.charCodeAt(2));
		default: return N((31 & e.charCodeAt(0)) << 6 | 63 & e.charCodeAt(1));
	}
}, Je = (e) => e.replace(Ke, qe), Ye = (e) => {
	if (e = e.replace(/\s+/g, ""), !Me.test(e)) throw TypeError("malformed base64.");
	e += "==".slice(2 - (e.length & 3));
	let t, n, r, i = [];
	for (let a = 0; a < e.length;) t = je[e.charAt(a++)] << 18 | je[e.charAt(a++)] << 12 | (n = je[e.charAt(a++)]) << 6 | (r = je[e.charAt(a++)]), n === 64 ? i.push(N(t >> 16 & 255)) : r === 64 ? i.push(N(t >> 16 & 255, t >> 8 & 255)) : i.push(N(t >> 16 & 255, t >> 8 & 255, t & 255));
	return i.join("");
}, Xe = typeof atob == "function" ? (e) => atob(Fe(e)) : De ? (e) => Buffer.from(e, "base64").toString("binary") : Ye, Ze = De ? (e) => Ne(Buffer.from(e, "base64")) : (e) => Ne(Xe(e).split("").map((e) => e.charCodeAt(0))), Qe = (e) => Ze(et(e)), $e = De ? (e) => Buffer.from(e, "base64").toString("utf8") : Oe ? (e) => Oe.decode(Ze(e)) : (e) => Je(Xe(e)), et = (e) => Fe(e.replace(/[-_]/g, (e) => e == "-" ? "+" : "/")), tt = (e) => $e(et(e)), nt = (e) => {
	if (typeof e != "string") return !1;
	let t = e.replace(/\s+/g, "").replace(/={0,2}$/, "");
	return !/[^\s0-9a-zA-Z\+/]/.test(t) || !/[^\s0-9a-zA-Z\-_]/.test(t);
}, rt = (e) => ({
	value: e,
	enumerable: !1,
	writable: !0,
	configurable: !0
}), it = function() {
	let e = (e, t) => Object.defineProperty(String.prototype, e, rt(t));
	e("fromBase64", function() {
		return tt(this);
	}), e("toBase64", function(e) {
		return We(this, e);
	}), e("toBase64URI", function() {
		return We(this, !0);
	}), e("toBase64URL", function() {
		return We(this, !0);
	}), e("toUint8Array", function() {
		return Qe(this);
	});
}, at = function() {
	let e = (e, t) => Object.defineProperty(Uint8Array.prototype, e, rt(t));
	e("toBase64", function(e) {
		return ze(this, e);
	}), e("toBase64URI", function() {
		return ze(this, !0);
	}), e("toBase64URL", function() {
		return ze(this, !0);
	});
}, ot = {
	version: Te,
	VERSION: Ee,
	atob: Xe,
	atobPolyfill: Ye,
	btoa: Le,
	btoaPolyfill: Ie,
	fromBase64: tt,
	toBase64: We,
	encode: We,
	encodeURI: Ge,
	encodeURL: Ge,
	utob: He,
	btou: Je,
	decode: tt,
	isValid: nt,
	fromUint8Array: ze,
	toUint8Array: Qe,
	extendString: it,
	extendUint8Array: at,
	extendBuiltins: () => {
		it(), at();
	}
}, st = "https://github.com/libsql/libsql-client-ts#supported-urls";
function P(e) {
	if (e === "write") return "BEGIN IMMEDIATE";
	if (e === "read") return "BEGIN TRANSACTION READONLY";
	if (e === "deferred") return "BEGIN DEFERRED";
	throw RangeError("Unknown transaction mode, supported values are \"write\", \"read\" and \"deferred\"");
}
var ct = class {
	columns;
	columnTypes;
	rows;
	rowsAffected;
	lastInsertRowid;
	constructor(e, t, n, r, i) {
		this.columns = e, this.columnTypes = t, this.rows = n, this.rowsAffected = r, this.lastInsertRowid = i;
	}
	toJSON() {
		return {
			columns: this.columns,
			columnTypes: this.columnTypes,
			rows: this.rows.map(lt),
			rowsAffected: this.rowsAffected,
			lastInsertRowid: this.lastInsertRowid === void 0 ? null : "" + this.lastInsertRowid
		};
	}
};
function lt(e) {
	return Array.prototype.map.call(e, ut);
}
function ut(e) {
	return typeof e == "bigint" ? "" + e : e instanceof ArrayBuffer ? ot.fromUint8Array(new Uint8Array(e)) : e;
}
//#endregion
//#region node_modules/@libsql/core/lib-esm/config.js
var dt = ":memory:";
function ft(e) {
	return e.scheme === "file" && (e.path === ":memory:" || e.path.startsWith(":memory:?"));
}
function pt(e, t) {
	if (typeof e != "object") throw TypeError(`Expected client configuration as object, got ${typeof e}`);
	let { url: n, authToken: r, tls: i, intMode: a, concurrency: o } = e;
	o = Math.max(0, o || 20), a ??= "number";
	let s = [];
	n === dt && (n = "file::memory:");
	let c = ge(n), l = c.scheme.toLowerCase(), u = l === "file" && c.path === dt && c.authority === void 0, d;
	d = u ? { cache: {
		values: ["shared", "private"],
		update: (e, t) => s.push(`${e}=${t}`)
	} } : {
		tls: {
			values: ["0", "1"],
			update: (e, t) => i = t === "1"
		},
		authToken: { update: (e, t) => r = t }
	};
	for (let { key: e, value: t } of c.query?.pairs ?? []) {
		if (!Object.hasOwn(d, e)) throw new A(`Unsupported URL query parameter ${JSON.stringify(e)}`, "URL_PARAM_NOT_SUPPORTED");
		let n = d[e];
		if (n.values !== void 0 && !n.values.includes(t)) throw new A(`Unknown value for the "${e}" query argument: ${JSON.stringify(t)}. Supported values are: [${n.values.map((e) => "\"" + e + "\"").join(", ")}]`, "URL_INVALID");
		n.update !== void 0 && n?.update(e, t);
	}
	let f = s.length === 0 ? "" : `?${s.join("&")}`, p = c.path + f, m;
	if (l === "libsql") if (i === !1) {
		if (c.authority?.port === void 0) throw new A("A \"libsql:\" URL with ?tls=0 must specify an explicit port", "URL_INVALID");
		m = t ? "http" : "ws";
	} else m = t ? "https" : "wss";
	else m = l;
	if (m === "http" || m === "ws" ? i ??= !1 : i ??= !0, m !== "http" && m !== "ws" && m !== "https" && m !== "wss" && m !== "file") throw new A(`The client supports only "libsql:", "wss:", "ws:", "https:", "http:" and "file:" URLs, got ${JSON.stringify(c.scheme + ":")}. For more information, please read ${st}`, "URL_SCHEME_NOT_SUPPORTED");
	if (a !== "number" && a !== "bigint" && a !== "string") throw TypeError(`Invalid value for intMode, expected "number", "bigint" or "string", got ${JSON.stringify(a)}`);
	if (c.fragment !== void 0) throw new A(`URL fragments are not supported: ${JSON.stringify("#" + c.fragment)}`, "URL_INVALID");
	return u ? {
		scheme: "file",
		tls: !1,
		path: p,
		intMode: a,
		concurrency: o,
		syncUrl: e.syncUrl,
		syncInterval: e.syncInterval,
		readYourWrites: e.readYourWrites,
		offline: e.offline,
		fetch: e.fetch,
		timeout: e.timeout,
		authToken: void 0,
		encryptionKey: void 0,
		remoteEncryptionKey: void 0,
		authority: void 0
	} : {
		scheme: m,
		tls: i,
		authority: c.authority,
		path: p,
		authToken: r,
		intMode: a,
		concurrency: o,
		encryptionKey: e.encryptionKey,
		remoteEncryptionKey: e.remoteEncryptionKey,
		syncUrl: e.syncUrl,
		syncInterval: e.syncInterval,
		readYourWrites: e.readYourWrites,
		offline: e.offline,
		fetch: e.fetch,
		timeout: e.timeout
	};
}
//#endregion
//#region node_modules/@neon-rs/load/dist/index.js
var mt = /* @__PURE__ */ g(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__setModuleDefault || (Object.create ? (function(e, t) {
		Object.defineProperty(e, "default", {
			enumerable: !0,
			value: t
		});
	}) : function(e, t) {
		e.default = t;
	}), r = e && e.__importStar || function(e) {
		if (e && e.__esModule) return e;
		var r = {};
		if (e != null) for (var i in e) i !== "default" && Object.prototype.hasOwnProperty.call(e, i) && t(r, e, i);
		return n(r, e), r;
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.load = e.currentTarget = void 0;
	var i = r(x("path")), a = r(x("fs"));
	function o() {
		let e = null;
		switch (process.platform) {
			case "android":
				switch (process.arch) {
					case "arm": return "android-arm-eabi";
					case "arm64": return "android-arm64";
				}
				e = "Android";
				break;
			case "win32":
				switch (process.arch) {
					case "x64": return "win32-x64-msvc";
					case "arm64": return "win32-arm64-msvc";
					case "ia32": return "win32-ia32-msvc";
				}
				e = "Windows";
				break;
			case "darwin":
				switch (process.arch) {
					case "x64": return "darwin-x64";
					case "arm64": return "darwin-arm64";
				}
				e = "macOS";
				break;
			case "linux":
				switch (process.arch) {
					case "x64":
					case "arm64": return s() ? `linux-${process.arch}-gnu` : `linux-${process.arch}-musl`;
					case "arm": return "linux-arm-gnueabihf";
				}
				e = "Linux";
				break;
			case "freebsd":
				if (process.arch === "x64") return "freebsd-x64";
				e = "FreeBSD";
				break;
		}
		throw Error(e ? `Neon: unsupported ${e} architecture: ${process.arch}` : `Neon: unsupported system: ${process.platform}`);
	}
	e.currentTarget = o;
	function s() {
		let e = process.report?.getReport();
		if (typeof e != "object" || !e || !("header" in e)) return !1;
		let t = e.header;
		return typeof t == "object" && !!t && "glibcVersionRuntime" in t;
	}
	function c(e) {
		let t = i.join(e, "index.node");
		return a.existsSync(t) ? x(t) : null;
	}
	e.load = c;
})), ht = /* @__PURE__ */ g(((e, t) => {
	var n = () => process.platform === "linux", r = null;
	t.exports = {
		isLinux: n,
		getReport: () => (r ||= n() && process.report ? process.report.getReport() : {}, r)
	};
})), gt = /* @__PURE__ */ g(((e, t) => {
	var n = x("fs");
	t.exports = {
		LDD_PATH: "/usr/bin/ldd",
		readFileSync: (e) => n.readFileSync(e, "utf-8"),
		readFile: (e) => new Promise((t, r) => {
			n.readFile(e, "utf-8", (e, n) => {
				e ? r(e) : t(n);
			});
		})
	};
})), _t = /* @__PURE__ */ g(((e, t) => {
	var n = x("child_process"), { isLinux: r, getReport: i } = ht(), { LDD_PATH: a, readFile: o, readFileSync: s } = gt(), c, l, u = "getconf GNU_LIBC_VERSION 2>&1 || true; ldd --version 2>&1 || true", d = "", f = () => d || new Promise((e) => {
		n.exec(u, (t, n) => {
			d = t ? " " : n, e(d);
		});
	}), p = () => {
		if (!d) try {
			d = n.execSync(u, { encoding: "utf8" });
		} catch {
			d = " ";
		}
		return d;
	}, m = "glibc", h = /GLIBC\s(\d+\.\d+)/, g = "musl", _ = m.toUpperCase(), v = g.toLowerCase(), y = (e) => e.includes("libc.musl-") || e.includes("ld-musl-"), b = () => {
		let e = i();
		return e.header && e.header.glibcVersionRuntime ? m : Array.isArray(e.sharedObjects) && e.sharedObjects.some(y) ? g : null;
	}, S = (e) => {
		let [t, n] = e.split(/[\r\n]+/);
		return t && t.includes(m) ? m : n && n.includes(g) ? g : null;
	}, ee = (e) => e.includes(v) ? g : e.includes(_) ? m : null, C = async () => {
		if (c !== void 0) return c;
		c = null;
		try {
			c = ee(await o(a));
		} catch {}
		return c;
	}, te = () => {
		if (c !== void 0) return c;
		c = null;
		try {
			c = ee(s(a));
		} catch {}
		return c;
	}, ne = async () => {
		let e = null;
		return r() && (e = await C(), e ||= b(), e ||= S(await f())), e;
	}, re = () => {
		let e = null;
		return r() && (e = te(), e ||= b(), e ||= S(p())), e;
	}, ie = async () => r() && await ne() !== m, ae = () => r() && re() !== m, oe = async () => {
		if (l !== void 0) return l;
		l = null;
		try {
			let e = (await o(a)).match(h);
			e && (l = e[1]);
		} catch {}
		return l;
	}, se = () => {
		if (l !== void 0) return l;
		l = null;
		try {
			let e = s(a).match(h);
			e && (l = e[1]);
		} catch {}
		return l;
	}, w = () => {
		let e = i();
		return e.header && e.header.glibcVersionRuntime ? e.header.glibcVersionRuntime : null;
	}, T = (e) => e.trim().split(/\s+/)[1], E = (e) => {
		let [t, n, r] = e.split(/[\r\n]+/);
		return t && t.includes(m) ? T(t) : n && r && n.includes(g) ? T(r) : null;
	};
	t.exports = {
		GLIBC: m,
		MUSL: g,
		family: ne,
		familySync: re,
		isNonGlibcLinux: ie,
		isNonGlibcLinuxSync: ae,
		version: async () => {
			let e = null;
			return r() && (e = await oe(), e ||= w(), e ||= E(await f())), e;
		},
		versionSync: () => {
			let e = null;
			return r() && (e = se(), e ||= w(), e ||= E(p())), e;
		}
	};
})), vt = /* @__PURE__ */ g(((e, t) => {
	t.exports = {
		ALLOW: 0,
		DENY: 1
	};
})), yt = /* @__PURE__ */ g(((e, t) => {
	var n = {
		value: "SqliteError",
		writable: !0,
		enumerable: !1,
		configurable: !0
	};
	function r(e, t, i) {
		if (new.target !== r) return new r(e, t);
		if (typeof t != "string") throw TypeError("Expected second argument to be a string");
		Error.call(this, e), n.value = "" + e, Object.defineProperty(this, "message", n), Error.captureStackTrace(this, r), this.code = t, this.rawCode = i;
	}
	Object.setPrototypeOf(r, Error), Object.setPrototypeOf(r.prototype, Error.prototype), Object.defineProperty(r.prototype, "name", n), t.exports = r;
})), bt = /* @__PURE__ */ y((/* @__PURE__ */ g(((e, t) => {
	var { load: n, currentTarget: r } = mt(), { familySync: i, GLIBC: a, MUSL: o } = _t();
	function s() {
		if (process.env.LIBSQL_JS_DEV) return n(__dirname);
		let e = r();
		if (i() == a) switch (e) {
			case "linux-x64-musl":
				e = "linux-x64-gnu";
				break;
			case "linux-arm64-musl":
				e = "linux-arm64-gnu";
				break;
		}
		return e === "linux-arm-gnueabihf" && i() == o && (e = "linux-arm-musleabihf"), x(`@libsql/${e}`);
	}
	var { databaseOpen: c, databaseOpenWithSync: l, databaseInTransaction: u, databaseInterrupt: d, databaseClose: f, databaseSyncSync: p, databaseSyncUntilSync: m, databaseExecSync: h, databasePrepareSync: g, databaseDefaultSafeIntegers: _, databaseAuthorizer: v, databaseLoadExtension: y, databaseMaxWriteReplicationIndex: b, statementRaw: S, statementIsReader: ee, statementGet: C, statementRun: te, statementInterrupt: ne, statementRowsSync: re, statementColumns: ie, statementSafeIntegers: ae, rowsNext: oe } = s(), se = vt(), w = yt();
	function T(e) {
		return e.libsqlError ? new w(e.message, e.code, e.rawCode) : e;
	}
	var E = class {
		constructor(e, t) {
			let n = t?.encryptionCipher ?? "aes256cbc";
			if (t && t.syncUrl) {
				var r = "";
				t.syncAuth ? (console.warn("Warning: The `syncAuth` option is deprecated, please use `authToken` option instead."), r = t.syncAuth) : t.authToken && (r = t.authToken);
				let i = t?.encryptionKey ?? "", a = t?.syncPeriod ?? 0, o = t?.readYourWrites ?? !0, s = t?.offline ?? !1, c = t?.remoteEncryptionKey ?? "";
				this.db = l(e, t.syncUrl, r, n, i, a, o, s, c);
			} else {
				let r = t?.authToken ?? "", i = t?.encryptionKey ?? "", a = t?.timeout ?? 0, o = t?.remoteEncryptionKey ?? "";
				this.db = c(e, r, n, i, a, o);
			}
			this.memory = e === ":memory:", this.readonly = !1, this.name = "", this.open = !0;
			let i = this.db;
			Object.defineProperties(this, { inTransaction: { get() {
				return u(i);
			} } });
		}
		sync() {
			return p.call(this.db);
		}
		syncUntil(e) {
			return m.call(this.db, e);
		}
		prepare(e) {
			try {
				return new D(g.call(this.db, e));
			} catch (e) {
				throw T(e);
			}
		}
		transaction(e) {
			if (typeof e != "function") throw TypeError("Expected first argument to be a function");
			let t = this, n = (n) => (...r) => {
				t.exec("BEGIN " + n);
				try {
					let n = e(...r);
					return t.exec("COMMIT"), n;
				} catch (e) {
					throw t.exec("ROLLBACK"), e;
				}
			}, r = {
				default: { value: n("") },
				deferred: { value: n("DEFERRED") },
				immediate: { value: n("IMMEDIATE") },
				exclusive: { value: n("EXCLUSIVE") },
				database: {
					value: this,
					enumerable: !0
				}
			};
			return Object.defineProperties(r.default.value, r), Object.defineProperties(r.deferred.value, r), Object.defineProperties(r.immediate.value, r), Object.defineProperties(r.exclusive.value, r), r.default.value;
		}
		pragma(e, t) {
			if (t ??= {}, typeof e != "string") throw TypeError("Expected first argument to be a string");
			if (typeof t != "object") throw TypeError("Expected second argument to be an options object");
			let n = t.simple, r = this.prepare(`PRAGMA ${e}`, this, !0);
			return n ? r.pluck().get() : r.all();
		}
		backup(e, t) {
			throw Error("not implemented");
		}
		serialize(e) {
			throw Error("not implemented");
		}
		function(e, t, n) {
			throw t ??= {}, typeof t == "function" && (n = t, t = {}), typeof e == "string" ? typeof n == "function" ? typeof t == "object" ? e ? Error("not implemented") : TypeError("User-defined function name cannot be an empty string") : TypeError("Expected second argument to be an options object") : TypeError("Expected last argument to be a function") : TypeError("Expected first argument to be a string");
		}
		aggregate(e, t) {
			throw typeof e == "string" ? typeof t != "object" || !t ? TypeError("Expected second argument to be an options object") : e ? Error("not implemented") : TypeError("User-defined function name cannot be an empty string") : TypeError("Expected first argument to be a string");
		}
		table(e, t) {
			throw typeof e == "string" ? e ? Error("not implemented") : TypeError("Virtual table module name cannot be an empty string") : TypeError("Expected first argument to be a string");
		}
		authorizer(e) {
			v.call(this.db, e);
		}
		loadExtension(...e) {
			y.call(this.db, ...e);
		}
		maxWriteReplicationIndex() {
			return b.call(this.db);
		}
		exec(e) {
			try {
				h.call(this.db, e);
			} catch (e) {
				throw T(e);
			}
		}
		interrupt() {
			d.call(this.db);
		}
		close() {
			f.call(this.db), this.open = !1;
		}
		defaultSafeIntegers(e) {
			return _.call(this.db, e ?? !0), this;
		}
		unsafeMode(...e) {
			throw Error("not implemented");
		}
	}, D = class {
		constructor(e) {
			this.stmt = e, this.pluckMode = !1;
		}
		raw(e) {
			return S.call(this.stmt, e ?? !0), this;
		}
		pluck(e) {
			return this.pluckMode = e ?? !0, this;
		}
		get reader() {
			return ee.call(this.stmt);
		}
		run(...e) {
			try {
				return e.length == 1 && typeof e[0] == "object" ? te.call(this.stmt, e[0]) : te.call(this.stmt, e.flat());
			} catch (e) {
				throw T(e);
			}
		}
		get(...e) {
			try {
				return e.length == 1 && typeof e[0] == "object" ? C.call(this.stmt, e[0]) : C.call(this.stmt, e.flat());
			} catch (e) {
				throw T(e);
			}
		}
		iterate(...e) {
			var t = void 0;
			return t = e.length == 1 && typeof e[0] == "object" ? re.call(this.stmt, e[0]) : re.call(this.stmt, e.flat()), {
				nextRows: Array(100),
				nextRowIndex: 100,
				next() {
					try {
						this.nextRowIndex === 100 && (oe.call(t, this.nextRows), this.nextRowIndex = 0);
						let e = this.nextRows[this.nextRowIndex];
						return this.nextRows[this.nextRowIndex] = void 0, e ? (this.nextRowIndex++, {
							value: e,
							done: !1
						}) : { done: !0 };
					} catch (e) {
						throw T(e);
					}
				},
				[Symbol.iterator]() {
					return this;
				}
			};
		}
		all(...e) {
			try {
				let t = [];
				for (let n of this.iterate(...e)) this.pluckMode ? t.push(n[Object.keys(n)[0]]) : t.push(n);
				return t;
			} catch (e) {
				throw T(e);
			}
		}
		interrupt() {
			ne.call(this.stmt);
		}
		columns() {
			return ie.call(this.stmt);
		}
		safeIntegers(e) {
			return ae.call(this.stmt, e ?? !0), this;
		}
	};
	t.exports = E, t.exports.Authorization = se, t.exports.SqliteError = w;
})))(), 1);
function xt(e) {
	if (e.scheme !== "file") throw new A(`URL scheme ${JSON.stringify(e.scheme + ":")} is not supported by the local sqlite3 client. For more information, please read ${st}`, "URL_SCHEME_NOT_SUPPORTED");
	let t = e.authority;
	if (t !== void 0) {
		let e = t.host.toLowerCase();
		if (e !== "" && e !== "localhost") throw new A(`Invalid host in file URL: ${JSON.stringify(t.host)}. A "file:" URL with an absolute path should start with one slash ("file:/absolute/path.db") or with three slashes ("file:///absolute/path.db"). For more information, please read ${st}`, "URL_INVALID");
		if (t.port !== void 0) throw new A("File URL cannot have a port", "URL_INVALID");
		if (t.userinfo !== void 0) throw new A("File URL cannot have username and password", "URL_INVALID");
	}
	let n = ft(e);
	if (n && e.syncUrl) throw new A(`Embedded replica must use file for local db but URI with in-memory mode were provided instead: ${e.path}`, "URL_INVALID");
	let r = e.path;
	n && (r = `${e.scheme}:${e.path}`);
	let i = {
		authToken: e.authToken,
		encryptionKey: e.encryptionKey,
		remoteEncryptionKey: e.remoteEncryptionKey,
		syncUrl: e.syncUrl,
		syncPeriod: e.syncInterval,
		readYourWrites: e.readYourWrites,
		offline: e.offline,
		timeout: e.timeout
	}, a = new bt.default(r, i);
	return F(a, "SELECT 1 AS checkThatTheDatabaseCanBeOpened", e.intMode), new St(r, i, a, e.intMode);
}
var St = class {
	#e;
	#t;
	#n;
	#r;
	closed;
	protocol;
	constructor(e, t, n, r) {
		this.#e = e, this.#t = t, this.#n = n, this.#r = r, this.closed = !1, this.protocol = "file";
	}
	async execute(e, t) {
		let n;
		return n = typeof e == "string" ? {
			sql: e,
			args: t || []
		} : e, this.#i(), F(this.#a(), n, this.#r);
	}
	async batch(e, t = "deferred") {
		this.#i();
		let n = this.#a();
		try {
			F(n, P(t), this.#r);
			let r = [];
			for (let t = 0; t < e.length; t++) try {
				if (!n.inTransaction) throw new j("The transaction has been rolled back", t, "TRANSACTION_CLOSED");
				let i = e[t], a = Array.isArray(i) ? {
					sql: i[0],
					args: i[1] || []
				} : i;
				r.push(F(n, a, this.#r));
			} catch (e) {
				throw e instanceof j ? e : e instanceof A ? new j(e.message, t, e.code, e.extendedCode, e.rawCode, e.cause instanceof Error ? e.cause : void 0) : e;
			}
			return F(n, "COMMIT", this.#r), r;
		} finally {
			n.inTransaction && F(n, "ROLLBACK", this.#r);
		}
	}
	async migrate(e) {
		this.#i();
		let t = this.#a();
		try {
			F(t, "PRAGMA foreign_keys=off", this.#r), F(t, P("deferred"), this.#r);
			let n = [];
			for (let r = 0; r < e.length; r++) try {
				if (!t.inTransaction) throw new j("The transaction has been rolled back", r, "TRANSACTION_CLOSED");
				n.push(F(t, e[r], this.#r));
			} catch (e) {
				throw e instanceof j ? e : e instanceof A ? new j(e.message, r, e.code, e.extendedCode, e.rawCode, e.cause instanceof Error ? e.cause : void 0) : e;
			}
			return F(t, "COMMIT", this.#r), n;
		} finally {
			t.inTransaction && F(t, "ROLLBACK", this.#r), F(t, "PRAGMA foreign_keys=on", this.#r);
		}
	}
	async transaction(e = "write") {
		let t = this.#a();
		return F(t, P(e), this.#r), this.#n = null, new Ct(t, this.#r);
	}
	async executeMultiple(e) {
		this.#i();
		let t = this.#a();
		try {
			return jt(t, e);
		} finally {
			t.inTransaction && F(t, "ROLLBACK", this.#r);
		}
	}
	async sync() {
		this.#i();
		let e = await this.#a().sync();
		return {
			frames_synced: e.frames_synced,
			frame_no: e.frame_no
		};
	}
	async reconnect() {
		try {
			!this.closed && this.#n !== null && this.#n.close();
		} finally {
			this.#n = new bt.default(this.#e, this.#t), this.closed = !1;
		}
	}
	close() {
		this.closed = !0, this.#n !== null && (this.#n.close(), this.#n = null);
	}
	#i() {
		if (this.closed) throw new A("The client is closed", "CLIENT_CLOSED");
	}
	#a() {
		return this.#n === null && (this.#n = new bt.default(this.#e, this.#t)), this.#n;
	}
}, Ct = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = t;
	}
	async execute(e, t) {
		let n;
		return n = typeof e == "string" ? {
			sql: e,
			args: t || []
		} : e, this.#n(), F(this.#e, n, this.#t);
	}
	async batch(e) {
		let t = [];
		for (let n = 0; n < e.length; n++) try {
			this.#n();
			let r = e[n], i = Array.isArray(r) ? {
				sql: r[0],
				args: r[1] || []
			} : r;
			t.push(F(this.#e, i, this.#t));
		} catch (e) {
			throw e instanceof j ? e : e instanceof A ? new j(e.message, n, e.code, e.extendedCode, e.rawCode, e.cause instanceof Error ? e.cause : void 0) : e;
		}
		return t;
	}
	async executeMultiple(e) {
		return this.#n(), jt(this.#e, e);
	}
	async rollback() {
		this.#e.open && (this.#n(), F(this.#e, "ROLLBACK", this.#t));
	}
	async commit() {
		this.#n(), F(this.#e, "COMMIT", this.#t);
	}
	close() {
		this.#e.inTransaction && F(this.#e, "ROLLBACK", this.#t);
	}
	get closed() {
		return !this.#e.inTransaction;
	}
	#n() {
		if (this.closed) throw new A("The transaction is closed", "TRANSACTION_CLOSED");
	}
};
function F(e, t, n) {
	let r, i;
	if (typeof t == "string") r = t, i = [];
	else if (r = t.sql, Array.isArray(t.args)) i = t.args.map((e) => Ot(e, n));
	else {
		i = {};
		for (let e in t.args) {
			let r = e[0] === "@" || e[0] === "$" || e[0] === ":" ? e.substring(1) : e;
			i[r] = Ot(t.args[e], n);
		}
	}
	try {
		let t = e.prepare(r);
		t.safeIntegers(!0);
		let a = !0;
		try {
			t.raw(!0);
		} catch {
			a = !1;
		}
		if (a) {
			let e = Array.from(t.columns().map((e) => e.name));
			return new ct(e, Array.from(t.columns().map((e) => e.type ?? "")), t.all(i).map((t) => wt(t, e, n)), 0, void 0);
		} else {
			let e = t.run(i), n = e.changes;
			return new ct([], [], [], n, BigInt(e.lastInsertRowid));
		}
	} catch (e) {
		throw Mt(e);
	}
}
function wt(e, t, n) {
	let r = {};
	Object.defineProperty(r, "length", { value: e.length });
	for (let i = 0; i < e.length; ++i) {
		let a = Tt(e[i], n);
		Object.defineProperty(r, i, { value: a });
		let o = t[i];
		Object.hasOwn(r, o) || Object.defineProperty(r, o, {
			value: a,
			enumerable: !0,
			configurable: !0,
			writable: !0
		});
	}
	return r;
}
function Tt(e, t) {
	if (typeof e == "bigint") if (t === "number") {
		if (e < Et || e > Dt) throw RangeError("Received integer which cannot be safely represented as a JavaScript number");
		return Number(e);
	} else if (t === "bigint") return e;
	else if (t === "string") return "" + e;
	else throw Error("Invalid value for IntMode");
	else if (e instanceof c) return e.buffer;
	return e;
}
var Et = -9007199254740991n, Dt = 9007199254740991n;
function Ot(e, t) {
	if (typeof e == "number") {
		if (!Number.isFinite(e)) throw RangeError("Only finite numbers (not Infinity or NaN) can be passed as arguments");
		return e;
	} else if (typeof e == "bigint") {
		if (e < kt || e > At) throw RangeError("bigint is too large to be represented as a 64-bit integer and passed as argument");
		return e;
	} else if (typeof e == "boolean") switch (t) {
		case "bigint": return e ? 1n : 0n;
		case "string": return e ? "1" : "0";
		default: return +!!e;
	}
	else if (e instanceof ArrayBuffer) return c.from(e);
	else if (e instanceof Date) return e.valueOf();
	else if (e === void 0) throw TypeError("undefined cannot be passed as argument to the database");
	else return e;
}
var kt = -9223372036854775808n, At = 9223372036854775807n;
function jt(e, t) {
	try {
		e.exec(t);
	} catch (e) {
		throw Mt(e);
	}
}
function Mt(e) {
	if (e instanceof bt.default.SqliteError) {
		let t = e.code, n = Nt(e.rawCode);
		return new A(e.message, n, t, e.rawCode, e);
	}
	return e;
}
function Nt(e) {
	if (e === void 0) return "SQLITE_UNKNOWN";
	let t = e & 255;
	return Pt[t] ?? `SQLITE_UNKNOWN_${t.toString()}`;
}
var Pt = {
	1: "SQLITE_ERROR",
	2: "SQLITE_INTERNAL",
	3: "SQLITE_PERM",
	4: "SQLITE_ABORT",
	5: "SQLITE_BUSY",
	6: "SQLITE_LOCKED",
	7: "SQLITE_NOMEM",
	8: "SQLITE_READONLY",
	9: "SQLITE_INTERRUPT",
	10: "SQLITE_IOERR",
	11: "SQLITE_CORRUPT",
	12: "SQLITE_NOTFOUND",
	13: "SQLITE_FULL",
	14: "SQLITE_CANTOPEN",
	15: "SQLITE_PROTOCOL",
	16: "SQLITE_EMPTY",
	17: "SQLITE_SCHEMA",
	18: "SQLITE_TOOBIG",
	19: "SQLITE_CONSTRAINT",
	20: "SQLITE_MISMATCH",
	21: "SQLITE_MISUSE",
	22: "SQLITE_NOLFS",
	23: "SQLITE_AUTH",
	24: "SQLITE_FORMAT",
	25: "SQLITE_RANGE",
	26: "SQLITE_NOTADB",
	27: "SQLITE_NOTICE",
	28: "SQLITE_WARNING"
}, I = /* @__PURE__ */ g(((e, t) => {
	var n = [
		"nodebuffer",
		"arraybuffer",
		"fragments"
	], r = typeof Blob < "u";
	r && n.push("blob"), t.exports = {
		BINARY_TYPES: n,
		CLOSE_TIMEOUT: 3e4,
		EMPTY_BUFFER: Buffer.alloc(0),
		GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
		hasBlob: r,
		kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
		kListener: Symbol("kListener"),
		kStatusCode: Symbol("status-code"),
		kWebSocket: Symbol("websocket"),
		NOOP: () => {}
	};
})), Ft = /* @__PURE__ */ _({ default: () => It }), It, Lt = h((() => {
	throw It = {}, Error("Could not resolve \"bufferutil\" imported by \"ws\". Is it installed?");
})), Rt = /* @__PURE__ */ g(((e, t) => {
	var { EMPTY_BUFFER: n } = I(), r = Buffer[Symbol.species];
	function i(e, t) {
		if (e.length === 0) return n;
		if (e.length === 1) return e[0];
		let i = Buffer.allocUnsafe(t), a = 0;
		for (let t = 0; t < e.length; t++) {
			let n = e[t];
			i.set(n, a), a += n.length;
		}
		return a < t ? new r(i.buffer, i.byteOffset, a) : i;
	}
	function a(e, t, n, r, i) {
		for (let a = 0; a < i; a++) n[r + a] = e[a] ^ t[a & 3];
	}
	function o(e, t) {
		for (let n = 0; n < e.length; n++) e[n] ^= t[n & 3];
	}
	function s(e) {
		return e.length === e.buffer.byteLength ? e.buffer : e.buffer.slice(e.byteOffset, e.byteOffset + e.length);
	}
	function c(e) {
		if (c.readOnly = !0, Buffer.isBuffer(e)) return e;
		let t;
		return e instanceof ArrayBuffer ? t = new r(e) : ArrayBuffer.isView(e) ? t = new r(e.buffer, e.byteOffset, e.byteLength) : (t = Buffer.from(e), c.readOnly = !1), t;
	}
	/* istanbul ignore else  */
	if (t.exports = {
		concat: i,
		mask: a,
		toArrayBuffer: s,
		toBuffer: c,
		unmask: o
	}, !process.env.WS_NO_BUFFER_UTIL) try {
		let e = (Lt(), b(Ft));
		t.exports.mask = function(t, n, r, i, o) {
			o < 48 ? a(t, n, r, i, o) : e.mask(t, n, r, i, o);
		}, t.exports.unmask = function(t, n) {
			t.length < 32 ? o(t, n) : e.unmask(t, n);
		};
	} catch {}
})), zt = /* @__PURE__ */ g(((e, t) => {
	var n = Symbol("kDone"), r = Symbol("kRun");
	t.exports = class {
		constructor(e) {
			this[n] = () => {
				this.pending--, this[r]();
			}, this.concurrency = e || Infinity, this.jobs = [], this.pending = 0;
		}
		add(e) {
			this.jobs.push(e), this[r]();
		}
		[r]() {
			if (this.pending !== this.concurrency && this.jobs.length) {
				let e = this.jobs.shift();
				this.pending++, e(this[n]);
			}
		}
	};
})), Bt = /* @__PURE__ */ g(((e, t) => {
	var n = x("zlib"), r = Rt(), i = zt(), { kStatusCode: a } = I(), o = Buffer[Symbol.species], s = Buffer.from([
		0,
		0,
		255,
		255
	]), c = Symbol("permessage-deflate"), l = Symbol("total-length"), u = Symbol("callback"), d = Symbol("buffers"), f = Symbol("error"), p;
	t.exports = class {
		constructor(e) {
			this._options = e || {}, this._threshold = this._options.threshold === void 0 ? 1024 : this._options.threshold, this._maxPayload = this._options.maxPayload | 0, this._isServer = !!this._options.isServer, this._deflate = null, this._inflate = null, this.params = null, p ||= new i(this._options.concurrencyLimit === void 0 ? 10 : this._options.concurrencyLimit);
		}
		static get extensionName() {
			return "permessage-deflate";
		}
		offer() {
			let e = {};
			return this._options.serverNoContextTakeover && (e.server_no_context_takeover = !0), this._options.clientNoContextTakeover && (e.client_no_context_takeover = !0), this._options.serverMaxWindowBits && (e.server_max_window_bits = this._options.serverMaxWindowBits), this._options.clientMaxWindowBits ? e.client_max_window_bits = this._options.clientMaxWindowBits : this._options.clientMaxWindowBits ?? (e.client_max_window_bits = !0), e;
		}
		accept(e) {
			return e = this.normalizeParams(e), this.params = this._isServer ? this.acceptAsServer(e) : this.acceptAsClient(e), this.params;
		}
		cleanup() {
			if (this._inflate &&= (this._inflate.close(), null), this._deflate) {
				let e = this._deflate[u];
				this._deflate.close(), this._deflate = null, e && e(/* @__PURE__ */ Error("The deflate stream was closed while data was being processed"));
			}
		}
		acceptAsServer(e) {
			let t = this._options, n = e.find((e) => !(t.serverNoContextTakeover === !1 && e.server_no_context_takeover || e.server_max_window_bits && (t.serverMaxWindowBits === !1 || typeof t.serverMaxWindowBits == "number" && t.serverMaxWindowBits > e.server_max_window_bits) || typeof t.clientMaxWindowBits == "number" && !e.client_max_window_bits));
			if (!n) throw Error("None of the extension offers can be accepted");
			return t.serverNoContextTakeover && (n.server_no_context_takeover = !0), t.clientNoContextTakeover && (n.client_no_context_takeover = !0), typeof t.serverMaxWindowBits == "number" && (n.server_max_window_bits = t.serverMaxWindowBits), typeof t.clientMaxWindowBits == "number" ? n.client_max_window_bits = t.clientMaxWindowBits : (n.client_max_window_bits === !0 || t.clientMaxWindowBits === !1) && delete n.client_max_window_bits, n;
		}
		acceptAsClient(e) {
			let t = e[0];
			if (this._options.clientNoContextTakeover === !1 && t.client_no_context_takeover) throw Error("Unexpected parameter \"client_no_context_takeover\"");
			if (!t.client_max_window_bits) typeof this._options.clientMaxWindowBits == "number" && (t.client_max_window_bits = this._options.clientMaxWindowBits);
			else if (this._options.clientMaxWindowBits === !1 || typeof this._options.clientMaxWindowBits == "number" && t.client_max_window_bits > this._options.clientMaxWindowBits) throw Error("Unexpected or invalid parameter \"client_max_window_bits\"");
			return t;
		}
		normalizeParams(e) {
			return e.forEach((e) => {
				Object.keys(e).forEach((t) => {
					let n = e[t];
					if (n.length > 1) throw Error(`Parameter "${t}" must have only a single value`);
					if (n = n[0], t === "client_max_window_bits") {
						if (n !== !0) {
							let e = +n;
							if (!Number.isInteger(e) || e < 8 || e > 15) throw TypeError(`Invalid value for parameter "${t}": ${n}`);
							n = e;
						} else if (!this._isServer) throw TypeError(`Invalid value for parameter "${t}": ${n}`);
					} else if (t === "server_max_window_bits") {
						let e = +n;
						if (!Number.isInteger(e) || e < 8 || e > 15) throw TypeError(`Invalid value for parameter "${t}": ${n}`);
						n = e;
					} else if (t === "client_no_context_takeover" || t === "server_no_context_takeover") {
						if (n !== !0) throw TypeError(`Invalid value for parameter "${t}": ${n}`);
					} else throw Error(`Unknown parameter "${t}"`);
					e[t] = n;
				});
			}), e;
		}
		decompress(e, t, n) {
			p.add((r) => {
				this._decompress(e, t, (e, t) => {
					r(), n(e, t);
				});
			});
		}
		compress(e, t, n) {
			p.add((r) => {
				this._compress(e, t, (e, t) => {
					r(), n(e, t);
				});
			});
		}
		_decompress(e, t, i) {
			let a = this._isServer ? "client" : "server";
			if (!this._inflate) {
				let e = `${a}_max_window_bits`, t = typeof this.params[e] == "number" ? this.params[e] : n.Z_DEFAULT_WINDOWBITS;
				this._inflate = n.createInflateRaw({
					...this._options.zlibInflateOptions,
					windowBits: t
				}), this._inflate[c] = this, this._inflate[l] = 0, this._inflate[d] = [], this._inflate.on("error", g), this._inflate.on("data", h);
			}
			this._inflate[u] = i, this._inflate.write(e), t && this._inflate.write(s), this._inflate.flush(() => {
				let e = this._inflate[f];
				if (e) {
					this._inflate.close(), this._inflate = null, i(e);
					return;
				}
				let n = r.concat(this._inflate[d], this._inflate[l]);
				this._inflate._readableState.endEmitted ? (this._inflate.close(), this._inflate = null) : (this._inflate[l] = 0, this._inflate[d] = [], t && this.params[`${a}_no_context_takeover`] && this._inflate.reset()), i(null, n);
			});
		}
		_compress(e, t, i) {
			let a = this._isServer ? "server" : "client";
			if (!this._deflate) {
				let e = `${a}_max_window_bits`, t = typeof this.params[e] == "number" ? this.params[e] : n.Z_DEFAULT_WINDOWBITS;
				this._deflate = n.createDeflateRaw({
					...this._options.zlibDeflateOptions,
					windowBits: t
				}), this._deflate[l] = 0, this._deflate[d] = [], this._deflate.on("data", m);
			}
			this._deflate[u] = i, this._deflate.write(e), this._deflate.flush(n.Z_SYNC_FLUSH, () => {
				if (!this._deflate) return;
				let e = r.concat(this._deflate[d], this._deflate[l]);
				t && (e = new o(e.buffer, e.byteOffset, e.length - 4)), this._deflate[u] = null, this._deflate[l] = 0, this._deflate[d] = [], t && this.params[`${a}_no_context_takeover`] && this._deflate.reset(), i(null, e);
			});
		}
	};
	function m(e) {
		this[d].push(e), this[l] += e.length;
	}
	function h(e) {
		if (this[l] += e.length, this[c]._maxPayload < 1 || this[l] <= this[c]._maxPayload) {
			this[d].push(e);
			return;
		}
		this[f] = /* @__PURE__ */ RangeError("Max payload size exceeded"), this[f].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH", this[f][a] = 1009, this.removeListener("data", h), this.reset();
	}
	function g(e) {
		if (this[c]._inflate = null, this[f]) {
			this[u](this[f]);
			return;
		}
		e[a] = 1007, this[u](e);
	}
})), Vt = /* @__PURE__ */ _({ default: () => Ht }), Ht, Ut = h((() => {
	throw Ht = {}, Error("Could not resolve \"utf-8-validate\" imported by \"ws\". Is it installed?");
})), Wt = /* @__PURE__ */ g(((e, t) => {
	var { isUtf8: n } = x("buffer"), { hasBlob: r } = I(), i = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		0,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		1,
		1,
		0,
		1,
		1,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		1,
		0,
		1,
		0
	];
	function a(e) {
		return e >= 1e3 && e <= 1014 && e !== 1004 && e !== 1005 && e !== 1006 || e >= 3e3 && e <= 4999;
	}
	function o(e) {
		let t = e.length, n = 0;
		for (; n < t;) if (!(e[n] & 128)) n++;
		else if ((e[n] & 224) == 192) {
			if (n + 1 === t || (e[n + 1] & 192) != 128 || (e[n] & 254) == 192) return !1;
			n += 2;
		} else if ((e[n] & 240) == 224) {
			if (n + 2 >= t || (e[n + 1] & 192) != 128 || (e[n + 2] & 192) != 128 || e[n] === 224 && (e[n + 1] & 224) == 128 || e[n] === 237 && (e[n + 1] & 224) == 160) return !1;
			n += 3;
		} else if ((e[n] & 248) == 240) {
			if (n + 3 >= t || (e[n + 1] & 192) != 128 || (e[n + 2] & 192) != 128 || (e[n + 3] & 192) != 128 || e[n] === 240 && (e[n + 1] & 240) == 128 || e[n] === 244 && e[n + 1] > 143 || e[n] > 244) return !1;
			n += 4;
		} else return !1;
		return !0;
	}
	function s(e) {
		return r && typeof e == "object" && typeof e.arrayBuffer == "function" && typeof e.type == "string" && typeof e.stream == "function" && (e[Symbol.toStringTag] === "Blob" || e[Symbol.toStringTag] === "File");
	}
	if (t.exports = {
		isBlob: s,
		isValidStatusCode: a,
		isValidUTF8: o,
		tokenChars: i
	}, n) t.exports.isValidUTF8 = function(e) {
		return e.length < 24 ? o(e) : n(e);
	};
	else if (!process.env.WS_NO_UTF_8_VALIDATE) try {
		let e = (Ut(), b(Vt));
		t.exports.isValidUTF8 = function(t) {
			return t.length < 32 ? o(t) : e(t);
		};
	} catch {}
})), Gt = /* @__PURE__ */ g(((e, t) => {
	var { Writable: n } = x("stream"), r = Bt(), { BINARY_TYPES: i, EMPTY_BUFFER: a, kStatusCode: o, kWebSocket: s } = I(), { concat: c, toArrayBuffer: l, unmask: u } = Rt(), { isValidStatusCode: d, isValidUTF8: f } = Wt(), p = Buffer[Symbol.species], m = 0, h = 1, g = 2, _ = 3, v = 4, y = 5, b = 6;
	t.exports = class extends n {
		constructor(e = {}) {
			super(), this._allowSynchronousEvents = e.allowSynchronousEvents === void 0 ? !0 : e.allowSynchronousEvents, this._binaryType = e.binaryType || i[0], this._extensions = e.extensions || {}, this._isServer = !!e.isServer, this._maxBufferedChunks = e.maxBufferedChunks | 0, this._maxFragments = e.maxFragments | 0, this._maxPayload = e.maxPayload | 0, this._skipUTF8Validation = !!e.skipUTF8Validation, this[s] = void 0, this._bufferedBytes = 0, this._buffers = [], this._compressed = !1, this._payloadLength = 0, this._mask = void 0, this._fragmented = 0, this._masked = !1, this._fin = !1, this._opcode = 0, this._totalPayloadLength = 0, this._messageLength = 0, this._fragments = [], this._errored = !1, this._loop = !1, this._state = m;
		}
		_write(e, t, n) {
			if (this._opcode === 8 && this._state == m) return n();
			if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
				n(this.createError(RangeError, "Too many buffered chunks", !1, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
				return;
			}
			this._bufferedBytes += e.length, this._buffers.push(e), this.startLoop(n);
		}
		consume(e) {
			if (this._bufferedBytes -= e, e === this._buffers[0].length) return this._buffers.shift();
			if (e < this._buffers[0].length) {
				let t = this._buffers[0];
				return this._buffers[0] = new p(t.buffer, t.byteOffset + e, t.length - e), new p(t.buffer, t.byteOffset, e);
			}
			let t = Buffer.allocUnsafe(e);
			do {
				let n = this._buffers[0], r = t.length - e;
				e >= n.length ? t.set(this._buffers.shift(), r) : (t.set(new Uint8Array(n.buffer, n.byteOffset, e), r), this._buffers[0] = new p(n.buffer, n.byteOffset + e, n.length - e)), e -= n.length;
			} while (e > 0);
			return t;
		}
		startLoop(e) {
			this._loop = !0;
			do
				switch (this._state) {
					case m:
						this.getInfo(e);
						break;
					case h:
						this.getPayloadLength16(e);
						break;
					case g:
						this.getPayloadLength64(e);
						break;
					case _:
						this.getMask();
						break;
					case v:
						this.getData(e);
						break;
					case y:
					case b:
						this._loop = !1;
						return;
				}
			while (this._loop);
			this._errored || e();
		}
		getInfo(e) {
			if (this._bufferedBytes < 2) {
				this._loop = !1;
				return;
			}
			let t = this.consume(2);
			if (t[0] & 48) {
				e(this.createError(RangeError, "RSV2 and RSV3 must be clear", !0, 1002, "WS_ERR_UNEXPECTED_RSV_2_3"));
				return;
			}
			let n = (t[0] & 64) == 64;
			if (n && !this._extensions[r.extensionName]) {
				e(this.createError(RangeError, "RSV1 must be clear", !0, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
				return;
			}
			if (this._fin = (t[0] & 128) == 128, this._opcode = t[0] & 15, this._payloadLength = t[1] & 127, this._opcode === 0) {
				if (n) {
					e(this.createError(RangeError, "RSV1 must be clear", !0, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
					return;
				}
				if (!this._fragmented) {
					e(this.createError(RangeError, "invalid opcode 0", !0, 1002, "WS_ERR_INVALID_OPCODE"));
					return;
				}
				this._opcode = this._fragmented;
			} else if (this._opcode === 1 || this._opcode === 2) {
				if (this._fragmented) {
					e(this.createError(RangeError, `invalid opcode ${this._opcode}`, !0, 1002, "WS_ERR_INVALID_OPCODE"));
					return;
				}
				this._compressed = n;
			} else if (this._opcode > 7 && this._opcode < 11) {
				if (!this._fin) {
					e(this.createError(RangeError, "FIN must be set", !0, 1002, "WS_ERR_EXPECTED_FIN"));
					return;
				}
				if (n) {
					e(this.createError(RangeError, "RSV1 must be clear", !0, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
					return;
				}
				if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
					e(this.createError(RangeError, `invalid payload length ${this._payloadLength}`, !0, 1002, "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"));
					return;
				}
			} else {
				e(this.createError(RangeError, `invalid opcode ${this._opcode}`, !0, 1002, "WS_ERR_INVALID_OPCODE"));
				return;
			}
			if (!this._fin && !this._fragmented && (this._fragmented = this._opcode), this._masked = (t[1] & 128) == 128, this._isServer) {
				if (!this._masked) {
					e(this.createError(RangeError, "MASK must be set", !0, 1002, "WS_ERR_EXPECTED_MASK"));
					return;
				}
			} else if (this._masked) {
				e(this.createError(RangeError, "MASK must be clear", !0, 1002, "WS_ERR_UNEXPECTED_MASK"));
				return;
			}
			this._payloadLength === 126 ? this._state = h : this._payloadLength === 127 ? this._state = g : this.haveLength(e);
		}
		getPayloadLength16(e) {
			if (this._bufferedBytes < 2) {
				this._loop = !1;
				return;
			}
			this._payloadLength = this.consume(2).readUInt16BE(0), this.haveLength(e);
		}
		getPayloadLength64(e) {
			if (this._bufferedBytes < 8) {
				this._loop = !1;
				return;
			}
			let t = this.consume(8), n = t.readUInt32BE(0);
			if (n > 2 ** 21 - 1) {
				e(this.createError(RangeError, "Unsupported WebSocket frame: payload length > 2^53 - 1", !1, 1009, "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"));
				return;
			}
			this._payloadLength = n * 2 ** 32 + t.readUInt32BE(4), this.haveLength(e);
		}
		haveLength(e) {
			if (this._payloadLength && this._opcode < 8 && (this._totalPayloadLength += this._payloadLength, this._totalPayloadLength > this._maxPayload && this._maxPayload > 0)) {
				e(this.createError(RangeError, "Max payload size exceeded", !1, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
				return;
			}
			this._masked ? this._state = _ : this._state = v;
		}
		getMask() {
			if (this._bufferedBytes < 4) {
				this._loop = !1;
				return;
			}
			this._mask = this.consume(4), this._state = v;
		}
		getData(e) {
			let t = a;
			if (this._payloadLength) {
				if (this._bufferedBytes < this._payloadLength) {
					this._loop = !1;
					return;
				}
				t = this.consume(this._payloadLength), this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0 && u(t, this._mask);
			}
			if (this._opcode > 7) {
				this.controlMessage(t, e);
				return;
			}
			if (this._compressed) {
				this._state = y, this.decompress(t, e);
				return;
			}
			if (t.length) {
				if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
					e(this.createError(RangeError, "Too many message fragments", !1, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
					return;
				}
				this._messageLength = this._totalPayloadLength, this._fragments.push(t);
			}
			this.dataMessage(e);
		}
		decompress(e, t) {
			this._extensions[r.extensionName].decompress(e, this._fin, (e, n) => {
				if (e) return t(e);
				if (n.length) {
					if (this._messageLength += n.length, this._messageLength > this._maxPayload && this._maxPayload > 0) {
						t(this.createError(RangeError, "Max payload size exceeded", !1, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
						return;
					}
					if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
						t(this.createError(RangeError, "Too many message fragments", !1, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
						return;
					}
					this._fragments.push(n);
				}
				this.dataMessage(t), this._state === m && this.startLoop(t);
			});
		}
		dataMessage(e) {
			if (!this._fin) {
				this._state = m;
				return;
			}
			let t = this._messageLength, n = this._fragments;
			if (this._totalPayloadLength = 0, this._messageLength = 0, this._fragmented = 0, this._fragments = [], this._opcode === 2) {
				let r;
				r = this._binaryType === "nodebuffer" ? c(n, t) : this._binaryType === "arraybuffer" ? l(c(n, t)) : this._binaryType === "blob" ? new Blob(n) : n, this._allowSynchronousEvents ? (this.emit("message", r, !0), this._state = m) : (this._state = b, setImmediate(() => {
					this.emit("message", r, !0), this._state = m, this.startLoop(e);
				}));
			} else {
				let r = c(n, t);
				if (!this._skipUTF8Validation && !f(r)) {
					e(this.createError(Error, "invalid UTF-8 sequence", !0, 1007, "WS_ERR_INVALID_UTF8"));
					return;
				}
				this._state === y || this._allowSynchronousEvents ? (this.emit("message", r, !1), this._state = m) : (this._state = b, setImmediate(() => {
					this.emit("message", r, !1), this._state = m, this.startLoop(e);
				}));
			}
		}
		controlMessage(e, t) {
			if (this._opcode === 8) {
				if (e.length === 0) this._loop = !1, this.emit("conclude", 1005, a), this.end();
				else {
					let n = e.readUInt16BE(0);
					if (!d(n)) {
						t(this.createError(RangeError, `invalid status code ${n}`, !0, 1002, "WS_ERR_INVALID_CLOSE_CODE"));
						return;
					}
					let r = new p(e.buffer, e.byteOffset + 2, e.length - 2);
					if (!this._skipUTF8Validation && !f(r)) {
						t(this.createError(Error, "invalid UTF-8 sequence", !0, 1007, "WS_ERR_INVALID_UTF8"));
						return;
					}
					this._loop = !1, this.emit("conclude", n, r), this.end();
				}
				this._state = m;
				return;
			}
			this._allowSynchronousEvents ? (this.emit(this._opcode === 9 ? "ping" : "pong", e), this._state = m) : (this._state = b, setImmediate(() => {
				this.emit(this._opcode === 9 ? "ping" : "pong", e), this._state = m, this.startLoop(t);
			}));
		}
		createError(e, t, n, r, i) {
			this._loop = !1, this._errored = !0;
			let a = new e(n ? `Invalid WebSocket frame: ${t}` : t);
			return Error.captureStackTrace(a, this.createError), a.code = i, a[o] = r, a;
		}
	};
})), Kt = /* @__PURE__ */ g(((e, t) => {
	var { Duplex: n } = x("stream"), { randomFillSync: r } = x("crypto"), { types: { isUint8Array: i } } = x("util"), a = Bt(), { EMPTY_BUFFER: o, kWebSocket: s, NOOP: c } = I(), { isBlob: l, isValidStatusCode: u } = Wt(), { mask: d, toBuffer: f } = Rt(), p = Symbol("kByteLength"), m = Buffer.alloc(4), h = 8 * 1024, g, _ = h, v = 0, y = 1, b = 2;
	t.exports = class e {
		constructor(e, t, n) {
			this._extensions = t || {}, n && (this._generateMask = n, this._maskBuffer = Buffer.alloc(4)), this._socket = e, this._firstFragment = !0, this._compress = !1, this._bufferedBytes = 0, this._queue = [], this._state = v, this.onerror = c, this[s] = void 0;
		}
		static frame(e, t) {
			let n, i = !1, a = 2, o = !1;
			t.mask && (n = t.maskBuffer || m, t.generateMask ? t.generateMask(n) : (_ === h && (g === void 0 && (g = Buffer.alloc(h)), r(g, 0, h), _ = 0), n[0] = g[_++], n[1] = g[_++], n[2] = g[_++], n[3] = g[_++]), o = (n[0] | n[1] | n[2] | n[3]) === 0, a = 6);
			let s;
			typeof e == "string" ? (!t.mask || o) && t[p] !== void 0 ? s = t[p] : (e = Buffer.from(e), s = e.length) : (s = e.length, i = t.mask && t.readOnly && !o);
			let c = s;
			s >= 65536 ? (a += 8, c = 127) : s > 125 && (a += 2, c = 126);
			let l = Buffer.allocUnsafe(i ? s + a : a);
			return l[0] = t.fin ? t.opcode | 128 : t.opcode, t.rsv1 && (l[0] |= 64), l[1] = c, c === 126 ? l.writeUInt16BE(s, 2) : c === 127 && (l[2] = l[3] = 0, l.writeUIntBE(s, 4, 6)), !t.mask || (l[1] |= 128, l[a - 4] = n[0], l[a - 3] = n[1], l[a - 2] = n[2], l[a - 1] = n[3], o) ? [l, e] : i ? (d(e, n, l, a, s), [l]) : (d(e, n, e, 0, s), [l, e]);
		}
		close(t, n, r, a) {
			let s;
			if (t === void 0) s = o;
			else if (typeof t != "number" || !u(t)) throw TypeError("First argument must be a valid error code number");
			else if (n === void 0 || !n.length) s = Buffer.allocUnsafe(2), s.writeUInt16BE(t, 0);
			else {
				let e = Buffer.byteLength(n);
				if (e > 123) throw RangeError("The message must not be greater than 123 bytes");
				if (s = Buffer.allocUnsafe(2 + e), s.writeUInt16BE(t, 0), typeof n == "string") s.write(n, 2);
				else if (i(n)) s.set(n, 2);
				else throw TypeError("Second argument must be a string or a Uint8Array");
			}
			let c = {
				[p]: s.length,
				fin: !0,
				generateMask: this._generateMask,
				mask: r,
				maskBuffer: this._maskBuffer,
				opcode: 8,
				readOnly: !1,
				rsv1: !1
			};
			this._state === v ? this.sendFrame(e.frame(s, c), a) : this.enqueue([
				this.dispatch,
				s,
				!1,
				c,
				a
			]);
		}
		ping(t, n, r) {
			let i, a;
			if (typeof t == "string" ? (i = Buffer.byteLength(t), a = !1) : l(t) ? (i = t.size, a = !1) : (t = f(t), i = t.length, a = f.readOnly), i > 125) throw RangeError("The data size must not be greater than 125 bytes");
			let o = {
				[p]: i,
				fin: !0,
				generateMask: this._generateMask,
				mask: n,
				maskBuffer: this._maskBuffer,
				opcode: 9,
				readOnly: a,
				rsv1: !1
			};
			l(t) ? this._state === v ? this.getBlobData(t, !1, o, r) : this.enqueue([
				this.getBlobData,
				t,
				!1,
				o,
				r
			]) : this._state === v ? this.sendFrame(e.frame(t, o), r) : this.enqueue([
				this.dispatch,
				t,
				!1,
				o,
				r
			]);
		}
		pong(t, n, r) {
			let i, a;
			if (typeof t == "string" ? (i = Buffer.byteLength(t), a = !1) : l(t) ? (i = t.size, a = !1) : (t = f(t), i = t.length, a = f.readOnly), i > 125) throw RangeError("The data size must not be greater than 125 bytes");
			let o = {
				[p]: i,
				fin: !0,
				generateMask: this._generateMask,
				mask: n,
				maskBuffer: this._maskBuffer,
				opcode: 10,
				readOnly: a,
				rsv1: !1
			};
			l(t) ? this._state === v ? this.getBlobData(t, !1, o, r) : this.enqueue([
				this.getBlobData,
				t,
				!1,
				o,
				r
			]) : this._state === v ? this.sendFrame(e.frame(t, o), r) : this.enqueue([
				this.dispatch,
				t,
				!1,
				o,
				r
			]);
		}
		send(e, t, n) {
			let r = this._extensions[a.extensionName], i = t.binary ? 2 : 1, o = t.compress, s, c;
			typeof e == "string" ? (s = Buffer.byteLength(e), c = !1) : l(e) ? (s = e.size, c = !1) : (e = f(e), s = e.length, c = f.readOnly), this._firstFragment ? (this._firstFragment = !1, o && r && r.params[r._isServer ? "server_no_context_takeover" : "client_no_context_takeover"] && (o = s >= r._threshold), this._compress = o) : (o = !1, i = 0), t.fin && (this._firstFragment = !0);
			let u = {
				[p]: s,
				fin: t.fin,
				generateMask: this._generateMask,
				mask: t.mask,
				maskBuffer: this._maskBuffer,
				opcode: i,
				readOnly: c,
				rsv1: o
			};
			l(e) ? this._state === v ? this.getBlobData(e, this._compress, u, n) : this.enqueue([
				this.getBlobData,
				e,
				this._compress,
				u,
				n
			]) : this._state === v ? this.dispatch(e, this._compress, u, n) : this.enqueue([
				this.dispatch,
				e,
				this._compress,
				u,
				n
			]);
		}
		getBlobData(t, n, r, i) {
			this._bufferedBytes += r[p], this._state = b, t.arrayBuffer().then((t) => {
				if (this._socket.destroyed) {
					let e = /* @__PURE__ */ Error("The socket was closed while the blob was being read");
					process.nextTick(S, this, e, i);
					return;
				}
				this._bufferedBytes -= r[p];
				let a = f(t);
				n ? this.dispatch(a, n, r, i) : (this._state = v, this.sendFrame(e.frame(a, r), i), this.dequeue());
			}).catch((e) => {
				process.nextTick(ee, this, e, i);
			});
		}
		dispatch(t, n, r, i) {
			if (!n) {
				this.sendFrame(e.frame(t, r), i);
				return;
			}
			let o = this._extensions[a.extensionName];
			this._bufferedBytes += r[p], this._state = y, o.compress(t, r.fin, (t, n) => {
				if (this._socket.destroyed) {
					let e = /* @__PURE__ */ Error("The socket was closed while data was being compressed");
					S(this, e, i);
					return;
				}
				this._bufferedBytes -= r[p], this._state = v, r.readOnly = !1, this.sendFrame(e.frame(n, r), i), this.dequeue();
			});
		}
		dequeue() {
			for (; this._state === v && this._queue.length;) {
				let e = this._queue.shift();
				this._bufferedBytes -= e[3][p], Reflect.apply(e[0], this, e.slice(1));
			}
		}
		enqueue(e) {
			this._bufferedBytes += e[3][p], this._queue.push(e);
		}
		sendFrame(e, t) {
			e.length === 2 ? (this._socket.cork(), this._socket.write(e[0]), this._socket.write(e[1], t), this._socket.uncork()) : this._socket.write(e[0], t);
		}
	};
	function S(e, t, n) {
		typeof n == "function" && n(t);
		for (let n = 0; n < e._queue.length; n++) {
			let r = e._queue[n], i = r[r.length - 1];
			typeof i == "function" && i(t);
		}
	}
	function ee(e, t, n) {
		S(e, t, n), e.onerror(t);
	}
})), qt = /* @__PURE__ */ g(((e, t) => {
	var { kForOnEventAttribute: n, kListener: r } = I(), i = Symbol("kCode"), a = Symbol("kData"), o = Symbol("kError"), s = Symbol("kMessage"), c = Symbol("kReason"), l = Symbol("kTarget"), u = Symbol("kType"), d = Symbol("kWasClean"), f = class {
		constructor(e) {
			this[l] = null, this[u] = e;
		}
		get target() {
			return this[l];
		}
		get type() {
			return this[u];
		}
	};
	Object.defineProperty(f.prototype, "target", { enumerable: !0 }), Object.defineProperty(f.prototype, "type", { enumerable: !0 });
	var p = class extends f {
		constructor(e, t = {}) {
			super(e), this[i] = t.code === void 0 ? 0 : t.code, this[c] = t.reason === void 0 ? "" : t.reason, this[d] = t.wasClean === void 0 ? !1 : t.wasClean;
		}
		get code() {
			return this[i];
		}
		get reason() {
			return this[c];
		}
		get wasClean() {
			return this[d];
		}
	};
	Object.defineProperty(p.prototype, "code", { enumerable: !0 }), Object.defineProperty(p.prototype, "reason", { enumerable: !0 }), Object.defineProperty(p.prototype, "wasClean", { enumerable: !0 });
	var m = class extends f {
		constructor(e, t = {}) {
			super(e), this[o] = t.error === void 0 ? null : t.error, this[s] = t.message === void 0 ? "" : t.message;
		}
		get error() {
			return this[o];
		}
		get message() {
			return this[s];
		}
	};
	Object.defineProperty(m.prototype, "error", { enumerable: !0 }), Object.defineProperty(m.prototype, "message", { enumerable: !0 });
	var h = class extends f {
		constructor(e, t = {}) {
			super(e), this[a] = t.data === void 0 ? null : t.data;
		}
		get data() {
			return this[a];
		}
	};
	Object.defineProperty(h.prototype, "data", { enumerable: !0 }), t.exports = {
		CloseEvent: p,
		ErrorEvent: m,
		Event: f,
		EventTarget: {
			addEventListener(e, t, i = {}) {
				for (let a of this.listeners(e)) if (!i[n] && a[r] === t && !a[n]) return;
				let a;
				if (e === "message") a = function(e, n) {
					let r = new h("message", { data: n ? e : e.toString() });
					r[l] = this, g(t, this, r);
				};
				else if (e === "close") a = function(e, n) {
					let r = new p("close", {
						code: e,
						reason: n.toString(),
						wasClean: this._closeFrameReceived && this._closeFrameSent
					});
					r[l] = this, g(t, this, r);
				};
				else if (e === "error") a = function(e) {
					let n = new m("error", {
						error: e,
						message: e.message
					});
					n[l] = this, g(t, this, n);
				};
				else if (e === "open") a = function() {
					let e = new f("open");
					e[l] = this, g(t, this, e);
				};
				else return;
				a[n] = !!i[n], a[r] = t, i.once ? this.once(e, a) : this.on(e, a);
			},
			removeEventListener(e, t) {
				for (let i of this.listeners(e)) if (i[r] === t && !i[n]) {
					this.removeListener(e, i);
					break;
				}
			}
		},
		MessageEvent: h
	};
	function g(e, t, n) {
		typeof e == "object" && e.handleEvent ? e.handleEvent.call(e, n) : e.call(t, n);
	}
})), Jt = /* @__PURE__ */ g(((e, t) => {
	var { tokenChars: n } = Wt();
	function r(e, t, n) {
		e[t] === void 0 ? e[t] = [n] : e[t].push(n);
	}
	function i(e) {
		let t = Object.create(null), i = Object.create(null), a = !1, o = !1, s = !1, c, l, u = -1, d = -1, f = -1, p = 0;
		for (; p < e.length; p++) if (d = e.charCodeAt(p), c === void 0) if (f === -1 && n[d] === 1) u === -1 && (u = p);
		else if (p !== 0 && (d === 32 || d === 9)) f === -1 && u !== -1 && (f = p);
		else if (d === 59 || d === 44) {
			if (u === -1) throw SyntaxError(`Unexpected character at index ${p}`);
			f === -1 && (f = p);
			let n = e.slice(u, f);
			d === 44 ? (r(t, n, i), i = Object.create(null)) : c = n, u = f = -1;
		} else throw SyntaxError(`Unexpected character at index ${p}`);
		else if (l === void 0) if (f === -1 && n[d] === 1) u === -1 && (u = p);
		else if (d === 32 || d === 9) f === -1 && u !== -1 && (f = p);
		else if (d === 59 || d === 44) {
			if (u === -1) throw SyntaxError(`Unexpected character at index ${p}`);
			f === -1 && (f = p), r(i, e.slice(u, f), !0), d === 44 && (r(t, c, i), i = Object.create(null), c = void 0), u = f = -1;
		} else if (d === 61 && u !== -1 && f === -1) l = e.slice(u, p), u = f = -1;
		else throw SyntaxError(`Unexpected character at index ${p}`);
		else if (o) {
			if (n[d] !== 1) throw SyntaxError(`Unexpected character at index ${p}`);
			u === -1 ? u = p : a ||= !0, o = !1;
		} else if (s) if (n[d] === 1) u === -1 && (u = p);
		else if (d === 34 && u !== -1) s = !1, f = p;
		else if (d === 92) o = !0;
		else throw SyntaxError(`Unexpected character at index ${p}`);
		else if (d === 34 && e.charCodeAt(p - 1) === 61) s = !0;
		else if (f === -1 && n[d] === 1) u === -1 && (u = p);
		else if (u !== -1 && (d === 32 || d === 9)) f === -1 && (f = p);
		else if (d === 59 || d === 44) {
			if (u === -1) throw SyntaxError(`Unexpected character at index ${p}`);
			f === -1 && (f = p);
			let n = e.slice(u, f);
			a &&= (n = n.replace(/\\/g, ""), !1), r(i, l, n), d === 44 && (r(t, c, i), i = Object.create(null), c = void 0), l = void 0, u = f = -1;
		} else throw SyntaxError(`Unexpected character at index ${p}`);
		if (u === -1 || s || d === 32 || d === 9) throw SyntaxError("Unexpected end of input");
		f === -1 && (f = p);
		let m = e.slice(u, f);
		return c === void 0 ? r(t, m, i) : (l === void 0 ? r(i, m, !0) : a ? r(i, l, m.replace(/\\/g, "")) : r(i, l, m), r(t, c, i)), t;
	}
	function a(e) {
		return Object.keys(e).map((t) => {
			let n = e[t];
			return Array.isArray(n) || (n = [n]), n.map((e) => [t].concat(Object.keys(e).map((t) => {
				let n = e[t];
				return Array.isArray(n) || (n = [n]), n.map((e) => e === !0 ? t : `${t}=${e}`).join("; ");
			})).join("; ")).join(", ");
		}).join(", ");
	}
	t.exports = {
		format: a,
		parse: i
	};
})), Yt = /* @__PURE__ */ g(((e, t) => {
	var n = x("events"), r = x("https"), i = x("http"), a = x("net"), o = x("tls"), { randomBytes: s, createHash: c } = x("crypto"), { Duplex: l, Readable: u } = x("stream"), { URL: d } = x("url"), f = Bt(), p = Gt(), m = Kt(), { isBlob: h } = Wt(), { BINARY_TYPES: g, CLOSE_TIMEOUT: _, EMPTY_BUFFER: v, GUID: y, kForOnEventAttribute: b, kListener: S, kStatusCode: ee, kWebSocket: C, NOOP: te } = I(), { EventTarget: { addEventListener: ne, removeEventListener: re } } = qt(), { format: ie, parse: ae } = Jt(), { toBuffer: oe } = Rt(), se = Symbol("kAborted"), w = [8, 13], T = [
		"CONNECTING",
		"OPEN",
		"CLOSING",
		"CLOSED"
	], E = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/, D = class e extends n {
		constructor(t, n, r) {
			super(), this._binaryType = g[0], this._closeCode = 1006, this._closeFrameReceived = !1, this._closeFrameSent = !1, this._closeMessage = v, this._closeTimer = null, this._errorEmitted = !1, this._extensions = {}, this._paused = !1, this._protocol = "", this._readyState = e.CONNECTING, this._receiver = null, this._sender = null, this._socket = null, t === null ? (this._autoPong = r.autoPong, this._closeTimeout = r.closeTimeout, this._isServer = !0) : (this._bufferedAmount = 0, this._isServer = !1, this._redirects = 0, n === void 0 ? n = [] : Array.isArray(n) || (typeof n == "object" && n ? (r = n, n = []) : n = [n]), ce(this, t, n, r));
		}
		get binaryType() {
			return this._binaryType;
		}
		set binaryType(e) {
			g.includes(e) && (this._binaryType = e, this._receiver && (this._receiver._binaryType = e));
		}
		get bufferedAmount() {
			return this._socket ? this._socket._writableState.length + this._sender._bufferedBytes : this._bufferedAmount;
		}
		get extensions() {
			return Object.keys(this._extensions).join();
		}
		get isPaused() {
			return this._paused;
		}
		/* istanbul ignore next */
		get onclose() {
			return null;
		}
		/* istanbul ignore next */
		get onerror() {
			return null;
		}
		/* istanbul ignore next */
		get onopen() {
			return null;
		}
		/* istanbul ignore next */
		get onmessage() {
			return null;
		}
		get protocol() {
			return this._protocol;
		}
		get readyState() {
			return this._readyState;
		}
		get url() {
			return this._url;
		}
		setSocket(t, n, r) {
			let i = new p({
				allowSynchronousEvents: r.allowSynchronousEvents,
				binaryType: this.binaryType,
				extensions: this._extensions,
				isServer: this._isServer,
				maxBufferedChunks: r.maxBufferedChunks,
				maxFragments: r.maxFragments,
				maxPayload: r.maxPayload,
				skipUTF8Validation: r.skipUTF8Validation
			}), a = new m(t, this._extensions, r.generateMask);
			this._receiver = i, this._sender = a, this._socket = t, i[C] = this, a[C] = this, t[C] = this, i.on("conclude", pe), i.on("drain", me), i.on("error", he), i.on("message", A), i.on("ping", j), i.on("pong", ge), a.onerror = ve, t.setTimeout && t.setTimeout(0), t.setNoDelay && t.setNoDelay(), n.length > 0 && t.unshift(n), t.on("close", be), t.on("data", M), t.on("end", xe), t.on("error", Se), this._readyState = e.OPEN, this.emit("open");
		}
		emitClose() {
			if (!this._socket) {
				this._readyState = e.CLOSED, this.emit("close", this._closeCode, this._closeMessage);
				return;
			}
			this._extensions[f.extensionName] && this._extensions[f.extensionName].cleanup(), this._receiver.removeAllListeners(), this._readyState = e.CLOSED, this.emit("close", this._closeCode, this._closeMessage);
		}
		close(t, n) {
			if (this.readyState !== e.CLOSED) {
				if (this.readyState === e.CONNECTING) {
					O(this, this._req, "WebSocket was closed before the connection was established");
					return;
				}
				if (this.readyState === e.CLOSING) {
					this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted) && this._socket.end();
					return;
				}
				this._readyState = e.CLOSING, this._sender.close(t, n, !this._isServer, (e) => {
					e || (this._closeFrameSent = !0, (this._closeFrameReceived || this._receiver._writableState.errorEmitted) && this._socket.end());
				}), ye(this);
			}
		}
		pause() {
			this.readyState === e.CONNECTING || this.readyState === e.CLOSED || (this._paused = !0, this._socket.pause());
		}
		ping(t, n, r) {
			if (this.readyState === e.CONNECTING) throw Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof t == "function" ? (r = t, t = n = void 0) : typeof n == "function" && (r = n, n = void 0), typeof t == "number" && (t = t.toString()), this.readyState !== e.OPEN) {
				fe(this, t, r);
				return;
			}
			n === void 0 && (n = !this._isServer), this._sender.ping(t || v, n, r);
		}
		pong(t, n, r) {
			if (this.readyState === e.CONNECTING) throw Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof t == "function" ? (r = t, t = n = void 0) : typeof n == "function" && (r = n, n = void 0), typeof t == "number" && (t = t.toString()), this.readyState !== e.OPEN) {
				fe(this, t, r);
				return;
			}
			n === void 0 && (n = !this._isServer), this._sender.pong(t || v, n, r);
		}
		resume() {
			this.readyState === e.CONNECTING || this.readyState === e.CLOSED || (this._paused = !1, this._receiver._writableState.needDrain || this._socket.resume());
		}
		send(t, n, r) {
			if (this.readyState === e.CONNECTING) throw Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof n == "function" && (r = n, n = {}), typeof t == "number" && (t = t.toString()), this.readyState !== e.OPEN) {
				fe(this, t, r);
				return;
			}
			let i = {
				binary: typeof t != "string",
				mask: !this._isServer,
				compress: !0,
				fin: !0,
				...n
			};
			this._extensions[f.extensionName] || (i.compress = !1), this._sender.send(t || v, i, r);
		}
		terminate() {
			if (this.readyState !== e.CLOSED) {
				if (this.readyState === e.CONNECTING) {
					O(this, this._req, "WebSocket was closed before the connection was established");
					return;
				}
				this._socket && (this._readyState = e.CLOSING, this._socket.destroy());
			}
		}
	};
	Object.defineProperty(D, "CONNECTING", {
		enumerable: !0,
		value: T.indexOf("CONNECTING")
	}), Object.defineProperty(D.prototype, "CONNECTING", {
		enumerable: !0,
		value: T.indexOf("CONNECTING")
	}), Object.defineProperty(D, "OPEN", {
		enumerable: !0,
		value: T.indexOf("OPEN")
	}), Object.defineProperty(D.prototype, "OPEN", {
		enumerable: !0,
		value: T.indexOf("OPEN")
	}), Object.defineProperty(D, "CLOSING", {
		enumerable: !0,
		value: T.indexOf("CLOSING")
	}), Object.defineProperty(D.prototype, "CLOSING", {
		enumerable: !0,
		value: T.indexOf("CLOSING")
	}), Object.defineProperty(D, "CLOSED", {
		enumerable: !0,
		value: T.indexOf("CLOSED")
	}), Object.defineProperty(D.prototype, "CLOSED", {
		enumerable: !0,
		value: T.indexOf("CLOSED")
	}), [
		"binaryType",
		"bufferedAmount",
		"extensions",
		"isPaused",
		"protocol",
		"readyState",
		"url"
	].forEach((e) => {
		Object.defineProperty(D.prototype, e, { enumerable: !0 });
	}), [
		"open",
		"error",
		"close",
		"message"
	].forEach((e) => {
		Object.defineProperty(D.prototype, `on${e}`, {
			enumerable: !0,
			get() {
				for (let t of this.listeners(e)) if (t[b]) return t[S];
				return null;
			},
			set(t) {
				for (let t of this.listeners(e)) if (t[b]) {
					this.removeListener(e, t);
					break;
				}
				typeof t == "function" && this.addEventListener(e, t, { [b]: !0 });
			}
		});
	}), D.prototype.addEventListener = ne, D.prototype.removeEventListener = re, t.exports = D;
	function ce(e, t, n, a) {
		let o = {
			allowSynchronousEvents: !0,
			autoPong: !0,
			closeTimeout: _,
			protocolVersion: w[1],
			maxBufferedChunks: 1024 * 1024,
			maxFragments: 128 * 1024,
			maxPayload: 100 * 1024 * 1024,
			skipUTF8Validation: !1,
			perMessageDeflate: !0,
			followRedirects: !1,
			maxRedirects: 10,
			...a,
			socketPath: void 0,
			hostname: void 0,
			protocol: void 0,
			timeout: void 0,
			method: "GET",
			host: void 0,
			path: void 0,
			port: void 0
		};
		if (e._autoPong = o.autoPong, e._closeTimeout = o.closeTimeout, !w.includes(o.protocolVersion)) throw RangeError(`Unsupported protocol version: ${o.protocolVersion} (supported versions: ${w.join(", ")})`);
		let l;
		if (t instanceof d) l = t;
		else try {
			l = new d(t);
		} catch {
			throw SyntaxError(`Invalid URL: ${t}`);
		}
		l.protocol === "http:" ? l.protocol = "ws:" : l.protocol === "https:" && (l.protocol = "wss:"), e._url = l.href;
		let u = l.protocol === "wss:", p = l.protocol === "ws+unix:", m;
		if (l.protocol !== "ws:" && !u && !p ? m = "The URL's protocol must be one of \"ws:\", \"wss:\", \"http:\", \"https:\", or \"ws+unix:\"" : p && !l.pathname ? m = "The URL's pathname is empty" : l.hash && (m = "The URL contains a fragment identifier"), m) {
			let t = SyntaxError(m);
			if (e._redirects === 0) throw t;
			le(e, t);
			return;
		}
		let h = u ? 443 : 80, g = s(16).toString("base64"), v = u ? r.request : i.request, b = /* @__PURE__ */ new Set(), x;
		if (o.createConnection = o.createConnection || (u ? de : ue), o.defaultPort = o.defaultPort || h, o.port = l.port || h, o.host = l.hostname.startsWith("[") ? l.hostname.slice(1, -1) : l.hostname, o.headers = {
			...o.headers,
			"Sec-WebSocket-Version": o.protocolVersion,
			"Sec-WebSocket-Key": g,
			Connection: "Upgrade",
			Upgrade: "websocket"
		}, o.path = l.pathname + l.search, o.timeout = o.handshakeTimeout, o.perMessageDeflate && (x = new f({
			...o.perMessageDeflate,
			isServer: !1,
			maxPayload: o.maxPayload
		}), o.headers["Sec-WebSocket-Extensions"] = ie({ [f.extensionName]: x.offer() })), n.length) {
			for (let e of n) {
				if (typeof e != "string" || !E.test(e) || b.has(e)) throw SyntaxError("An invalid or duplicated subprotocol was specified");
				b.add(e);
			}
			o.headers["Sec-WebSocket-Protocol"] = n.join(",");
		}
		if (o.origin && (o.protocolVersion < 13 ? o.headers["Sec-WebSocket-Origin"] = o.origin : o.headers.Origin = o.origin), (l.username || l.password) && (o.auth = `${l.username}:${l.password}`), p) {
			let e = o.path.split(":");
			o.socketPath = e[0], o.path = e[1];
		}
		let S;
		if (o.followRedirects) {
			if (e._redirects === 0) {
				e._originalIpc = p, e._originalSecure = u, e._originalHostOrSocketPath = p ? o.socketPath : l.host;
				let t = a && a.headers;
				if (a = {
					...a,
					headers: {}
				}, t) for (let [e, n] of Object.entries(t)) a.headers[e.toLowerCase()] = n;
			} else if (e.listenerCount("redirect") === 0) {
				let t = p ? e._originalIpc ? o.socketPath === e._originalHostOrSocketPath : !1 : e._originalIpc ? !1 : l.host === e._originalHostOrSocketPath;
				(!t || e._originalSecure && !u) && (delete o.headers.authorization, delete o.headers.cookie, t || delete o.headers.host, o.auth = void 0);
			}
			o.auth && !a.headers.authorization && (a.headers.authorization = "Basic " + Buffer.from(o.auth).toString("base64")), S = e._req = v(o), e._redirects && e.emit("redirect", e.url, S);
		} else S = e._req = v(o);
		o.timeout && S.on("timeout", () => {
			O(e, S, "Opening handshake has timed out");
		}), S.on("error", (t) => {
			S === null || S[se] || (S = e._req = null, le(e, t));
		}), S.on("response", (r) => {
			let i = r.headers.location, s = r.statusCode;
			if (i && o.followRedirects && s >= 300 && s < 400) {
				if (++e._redirects > o.maxRedirects) {
					O(e, S, "Maximum redirects exceeded");
					return;
				}
				S.abort();
				let r;
				try {
					r = new d(i, t);
				} catch {
					le(e, /* @__PURE__ */ SyntaxError(`Invalid URL: ${i}`));
					return;
				}
				ce(e, r, n, a);
			} else e.emit("unexpected-response", S, r) || O(e, S, `Unexpected server response: ${r.statusCode}`);
		}), S.on("upgrade", (t, n, r) => {
			if (e.emit("upgrade", t), e.readyState !== D.CONNECTING) return;
			S = e._req = null;
			let i = t.headers.upgrade;
			if (i === void 0 || i.toLowerCase() !== "websocket") {
				O(e, n, "Invalid Upgrade header");
				return;
			}
			let a = c("sha1").update(g + y).digest("base64");
			if (t.headers["sec-websocket-accept"] !== a) {
				O(e, n, "Invalid Sec-WebSocket-Accept header");
				return;
			}
			let s = t.headers["sec-websocket-protocol"], l;
			if (s === void 0 ? b.size && (l = "Server sent no subprotocol") : b.size ? b.has(s) || (l = "Server sent an invalid subprotocol") : l = "Server sent a subprotocol but none was requested", l) {
				O(e, n, l);
				return;
			}
			s && (e._protocol = s);
			let u = t.headers["sec-websocket-extensions"];
			if (u !== void 0) {
				if (!x) {
					O(e, n, "Server sent a Sec-WebSocket-Extensions header but no extension was requested");
					return;
				}
				let t;
				try {
					t = ae(u);
				} catch {
					O(e, n, "Invalid Sec-WebSocket-Extensions header");
					return;
				}
				let r = Object.keys(t);
				if (r.length !== 1 || r[0] !== f.extensionName) {
					O(e, n, "Server indicated an extension that was not requested");
					return;
				}
				try {
					x.accept(t[f.extensionName]);
				} catch {
					O(e, n, "Invalid Sec-WebSocket-Extensions header");
					return;
				}
				e._extensions[f.extensionName] = x;
			}
			e.setSocket(n, r, {
				allowSynchronousEvents: o.allowSynchronousEvents,
				generateMask: o.generateMask,
				maxBufferedChunks: o.maxBufferedChunks,
				maxFragments: o.maxFragments,
				maxPayload: o.maxPayload,
				skipUTF8Validation: o.skipUTF8Validation
			});
		}), o.finishRequest ? o.finishRequest(S, e) : S.end();
	}
	function le(e, t) {
		e._readyState = D.CLOSING, e._errorEmitted = !0, e.emit("error", t), e.emitClose();
	}
	function ue(e) {
		return e.path = e.socketPath, a.connect(e);
	}
	function de(e) {
		return e.path = void 0, !e.servername && e.servername !== "" && (e.servername = a.isIP(e.host) ? "" : e.host), o.connect(e);
	}
	function O(e, t, n) {
		e._readyState = D.CLOSING;
		let r = Error(n);
		Error.captureStackTrace(r, O), t.setHeader ? (t[se] = !0, t.abort(), t.socket && !t.socket.destroyed && t.socket.destroy(), process.nextTick(le, e, r)) : (t.destroy(r), t.once("error", e.emit.bind(e, "error")), t.once("close", e.emitClose.bind(e)));
	}
	function fe(e, t, n) {
		if (t) {
			let n = h(t) ? t.size : oe(t).length;
			e._socket ? e._sender._bufferedBytes += n : e._bufferedAmount += n;
		}
		if (n) {
			let t = /* @__PURE__ */ Error(`WebSocket is not open: readyState ${e.readyState} (${T[e.readyState]})`);
			process.nextTick(n, t);
		}
	}
	function pe(e, t) {
		let n = this[C];
		n._closeFrameReceived = !0, n._closeMessage = t, n._closeCode = e, n._socket[C] !== void 0 && (n._socket.removeListener("data", M), process.nextTick(_e, n._socket), e === 1005 ? n.close() : n.close(e, t));
	}
	function me() {
		let e = this[C];
		e.isPaused || e._socket.resume();
	}
	function he(e) {
		let t = this[C];
		t._socket[C] !== void 0 && (t._socket.removeListener("data", M), process.nextTick(_e, t._socket), t.close(e[ee])), t._errorEmitted || (t._errorEmitted = !0, t.emit("error", e));
	}
	function k() {
		this[C].emitClose();
	}
	function A(e, t) {
		this[C].emit("message", e, t);
	}
	function j(e) {
		let t = this[C];
		t._autoPong && t.pong(e, !this._isServer, te), t.emit("ping", e);
	}
	function ge(e) {
		this[C].emit("pong", e);
	}
	function _e(e) {
		e.resume();
	}
	function ve(e) {
		let t = this[C];
		t.readyState !== D.CLOSED && (t.readyState === D.OPEN && (t._readyState = D.CLOSING, ye(t)), this._socket.end(), t._errorEmitted || (t._errorEmitted = !0, t.emit("error", e)));
	}
	function ye(e) {
		e._closeTimer = setTimeout(e._socket.destroy.bind(e._socket), e._closeTimeout);
	}
	function be() {
		let e = this[C];
		if (this.removeListener("close", be), this.removeListener("data", M), this.removeListener("end", xe), e._readyState = D.CLOSING, !this._readableState.endEmitted && !e._closeFrameReceived && !e._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
			let t = this.read(this._readableState.length);
			e._receiver.write(t);
		}
		e._receiver.end(), this[C] = void 0, clearTimeout(e._closeTimer), e._receiver._writableState.finished || e._receiver._writableState.errorEmitted ? e.emitClose() : (e._receiver.on("error", k), e._receiver.on("finish", k));
	}
	function M(e) {
		this[C]._receiver.write(e) || this.pause();
	}
	function xe() {
		let e = this[C];
		e._readyState = D.CLOSING, e._receiver.end(), this.end();
	}
	function Se() {
		let e = this[C];
		this.removeListener("error", Se), this.on("error", te), e && (e._readyState = D.CLOSING, this.destroy());
	}
})), Xt = /* @__PURE__ */ g(((e, t) => {
	Yt();
	var { Duplex: n } = x("stream");
	function r(e) {
		e.emit("close");
	}
	function i() {
		!this.destroyed && this._writableState.finished && this.destroy();
	}
	function a(e) {
		this.removeListener("error", a), this.destroy(), this.listenerCount("error") === 0 && this.emit("error", e);
	}
	function o(e, t) {
		let o = !0, s = new n({
			...t,
			autoDestroy: !1,
			emitClose: !1,
			objectMode: !1,
			writableObjectMode: !1
		});
		return e.on("message", function(t, n) {
			let r = !n && s._readableState.objectMode ? t.toString() : t;
			s.push(r) || e.pause();
		}), e.once("error", function(e) {
			s.destroyed || (o = !1, s.destroy(e));
		}), e.once("close", function() {
			s.destroyed || s.push(null);
		}), s._destroy = function(t, n) {
			if (e.readyState === e.CLOSED) {
				n(t), process.nextTick(r, s);
				return;
			}
			let i = !1;
			e.once("error", function(e) {
				i = !0, n(e);
			}), e.once("close", function() {
				i || n(t), process.nextTick(r, s);
			}), o && e.terminate();
		}, s._final = function(t) {
			if (e.readyState === e.CONNECTING) {
				e.once("open", function() {
					s._final(t);
				});
				return;
			}
			e._socket !== null && (e._socket._writableState.finished ? (t(), s._readableState.endEmitted && s.destroy()) : (e._socket.once("finish", function() {
				t();
			}), e.close()));
		}, s._read = function() {
			e.isPaused && e.resume();
		}, s._write = function(t, n, r) {
			if (e.readyState === e.CONNECTING) {
				e.once("open", function() {
					s._write(t, n, r);
				});
				return;
			}
			e.send(t, r);
		}, s.on("end", i), s.on("error", a), s;
	}
	t.exports = o;
})), Zt = /* @__PURE__ */ g(((e, t) => {
	var { tokenChars: n } = Wt();
	function r(e) {
		let t = /* @__PURE__ */ new Set(), r = -1, i = -1, a = 0;
		for (; a < e.length; a++) {
			let o = e.charCodeAt(a);
			if (i === -1 && n[o] === 1) r === -1 && (r = a);
			else if (a !== 0 && (o === 32 || o === 9)) i === -1 && r !== -1 && (i = a);
			else if (o === 44) {
				if (r === -1) throw SyntaxError(`Unexpected character at index ${a}`);
				i === -1 && (i = a);
				let n = e.slice(r, i);
				if (t.has(n)) throw SyntaxError(`The "${n}" subprotocol is duplicated`);
				t.add(n), r = i = -1;
			} else throw SyntaxError(`Unexpected character at index ${a}`);
		}
		if (r === -1 || i !== -1) throw SyntaxError("Unexpected end of input");
		let o = e.slice(r, a);
		if (t.has(o)) throw SyntaxError(`The "${o}" subprotocol is duplicated`);
		return t.add(o), t;
	}
	t.exports = { parse: r };
})), Qt = /* @__PURE__ */ g(((e, t) => {
	var n = x("events"), r = x("http"), { Duplex: i } = x("stream"), { createHash: a } = x("crypto"), o = Jt(), s = Bt(), c = Zt(), l = Yt(), { CLOSE_TIMEOUT: u, GUID: d, kWebSocket: f } = I(), p = /^[+/0-9A-Za-z]{22}==$/, m = 0, h = 1, g = 2;
	t.exports = class extends n {
		constructor(e, t) {
			if (super(), e = {
				allowSynchronousEvents: !0,
				autoPong: !0,
				maxBufferedChunks: 1024 * 1024,
				maxFragments: 128 * 1024,
				maxPayload: 100 * 1024 * 1024,
				skipUTF8Validation: !1,
				perMessageDeflate: !1,
				handleProtocols: null,
				clientTracking: !0,
				closeTimeout: u,
				verifyClient: null,
				noServer: !1,
				backlog: null,
				server: null,
				host: null,
				path: null,
				port: null,
				WebSocket: l,
				...e
			}, e.port == null && !e.server && !e.noServer || e.port != null && (e.server || e.noServer) || e.server && e.noServer) throw TypeError("One and only one of the \"port\", \"server\", or \"noServer\" options must be specified");
			if (e.port == null ? e.server && (this._server = e.server) : (this._server = r.createServer((e, t) => {
				let n = r.STATUS_CODES[426];
				t.writeHead(426, {
					"Content-Length": n.length,
					"Content-Type": "text/plain"
				}), t.end(n);
			}), this._server.listen(e.port, e.host, e.backlog, t)), this._server) {
				let e = this.emit.bind(this, "connection");
				this._removeListeners = _(this._server, {
					listening: this.emit.bind(this, "listening"),
					error: this.emit.bind(this, "error"),
					upgrade: (t, n, r) => {
						this.handleUpgrade(t, n, r, e);
					}
				});
			}
			e.perMessageDeflate === !0 && (e.perMessageDeflate = {}), e.clientTracking && (this.clients = /* @__PURE__ */ new Set(), this._shouldEmitClose = !1), this.options = e, this._state = m;
		}
		address() {
			if (this.options.noServer) throw Error("The server is operating in \"noServer\" mode");
			return this._server ? this._server.address() : null;
		}
		close(e) {
			if (this._state === g) {
				e && this.once("close", () => {
					e(/* @__PURE__ */ Error("The server is not running"));
				}), process.nextTick(v, this);
				return;
			}
			if (e && this.once("close", e), this._state !== h) if (this._state = h, this.options.noServer || this.options.server) this._server && (this._removeListeners(), this._removeListeners = this._server = null), this.clients && this.clients.size ? this._shouldEmitClose = !0 : process.nextTick(v, this);
			else {
				let e = this._server;
				this._removeListeners(), this._removeListeners = this._server = null, e.close(() => {
					v(this);
				});
			}
		}
		shouldHandle(e) {
			if (this.options.path) {
				let t = e.url.indexOf("?");
				if ((t === -1 ? e.url : e.url.slice(0, t)) !== this.options.path) return !1;
			}
			return !0;
		}
		handleUpgrade(e, t, n, r) {
			t.on("error", y);
			let i = e.headers["sec-websocket-key"], a = e.headers.upgrade, l = +e.headers["sec-websocket-version"];
			if (e.method !== "GET") {
				S(this, e, t, 405, "Invalid HTTP method");
				return;
			}
			if (a === void 0 || a.toLowerCase() !== "websocket") {
				S(this, e, t, 400, "Invalid Upgrade header");
				return;
			}
			if (i === void 0 || !p.test(i)) {
				S(this, e, t, 400, "Missing or invalid Sec-WebSocket-Key header");
				return;
			}
			if (l !== 13 && l !== 8) {
				S(this, e, t, 400, "Missing or invalid Sec-WebSocket-Version header", { "Sec-WebSocket-Version": "13, 8" });
				return;
			}
			if (!this.shouldHandle(e)) {
				b(t, 400);
				return;
			}
			let u = e.headers["sec-websocket-protocol"], d = /* @__PURE__ */ new Set();
			if (u !== void 0) try {
				d = c.parse(u);
			} catch {
				S(this, e, t, 400, "Invalid Sec-WebSocket-Protocol header");
				return;
			}
			let f = e.headers["sec-websocket-extensions"], m = {};
			if (this.options.perMessageDeflate && f !== void 0) {
				let n = new s({
					...this.options.perMessageDeflate,
					isServer: !0,
					maxPayload: this.options.maxPayload
				});
				try {
					let e = o.parse(f);
					e[s.extensionName] && (n.accept(e[s.extensionName]), m[s.extensionName] = n);
				} catch {
					S(this, e, t, 400, "Invalid or unacceptable Sec-WebSocket-Extensions header");
					return;
				}
			}
			if (this.options.verifyClient) {
				let a = {
					origin: e.headers[`${l === 8 ? "sec-websocket-origin" : "origin"}`],
					secure: !!(e.socket.authorized || e.socket.encrypted),
					req: e
				};
				if (this.options.verifyClient.length === 2) {
					this.options.verifyClient(a, (a, o, s, c) => {
						if (!a) return b(t, o || 401, s, c);
						this.completeUpgrade(m, i, d, e, t, n, r);
					});
					return;
				}
				if (!this.options.verifyClient(a)) return b(t, 401);
			}
			this.completeUpgrade(m, i, d, e, t, n, r);
		}
		completeUpgrade(e, t, n, r, i, c, l) {
			if (!i.readable || !i.writable) return i.destroy();
			if (i[f]) throw Error("server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration");
			if (this._state > m) return b(i, 503);
			let u = [
				"HTTP/1.1 101 Switching Protocols",
				"Upgrade: websocket",
				"Connection: Upgrade",
				`Sec-WebSocket-Accept: ${a("sha1").update(t + d).digest("base64")}`
			], p = new this.options.WebSocket(null, void 0, this.options);
			if (n.size) {
				let e = this.options.handleProtocols ? this.options.handleProtocols(n, r) : n.values().next().value;
				e && (u.push(`Sec-WebSocket-Protocol: ${e}`), p._protocol = e);
			}
			if (e[s.extensionName]) {
				let t = e[s.extensionName].params, n = o.format({ [s.extensionName]: [t] });
				u.push(`Sec-WebSocket-Extensions: ${n}`), p._extensions = e;
			}
			this.emit("headers", u, r), i.write(u.concat("\r\n").join("\r\n")), i.removeListener("error", y), p.setSocket(i, c, {
				allowSynchronousEvents: this.options.allowSynchronousEvents,
				maxBufferedChunks: this.options.maxBufferedChunks,
				maxFragments: this.options.maxFragments,
				maxPayload: this.options.maxPayload,
				skipUTF8Validation: this.options.skipUTF8Validation
			}), this.clients && (this.clients.add(p), p.on("close", () => {
				this.clients.delete(p), this._shouldEmitClose && !this.clients.size && process.nextTick(v, this);
			})), l(p, r);
		}
	};
	function _(e, t) {
		for (let n of Object.keys(t)) e.on(n, t[n]);
		return function() {
			for (let n of Object.keys(t)) e.removeListener(n, t[n]);
		};
	}
	function v(e) {
		e._state = g, e.emit("close");
	}
	function y() {
		this.destroy();
	}
	function b(e, t, n, i) {
		n ||= r.STATUS_CODES[t], i = {
			Connection: "close",
			"Content-Type": "text/html",
			"Content-Length": Buffer.byteLength(n),
			...i
		}, e.once("finish", e.destroy), e.end(`HTTP/1.1 ${t} ${r.STATUS_CODES[t]}\r\n` + Object.keys(i).map((e) => `${e}: ${i[e]}`).join("\r\n") + "\r\n\r\n" + n);
	}
	function S(e, t, n, r, i, a) {
		if (e.listenerCount("wsClientError")) {
			let r = Error(i);
			Error.captureStackTrace(r, S), e.emit("wsClientError", r, n, t);
		} else b(n, r, i, a);
	}
}));
Xt(), Jt(), Bt(), Gt(), Kt(), Zt();
var $t = /* @__PURE__ */ y(Yt(), 1), en = /* @__PURE__ */ y(Qt(), 1), tn = class {
	constructor() {
		this.intMode = "number";
	}
	intMode;
}, L = class extends Error {
	constructor(e) {
		super(e), this.name = "ClientError";
	}
}, R = class extends L {
	constructor(e) {
		super(e), this.name = "ProtoError";
	}
}, nn = class extends L {
	code;
	proto;
	constructor(e, t) {
		super(e), this.name = "ResponseError", this.code = t.code, this.proto = t, this.stack = void 0;
	}
}, z = class extends L {
	constructor(e, t) {
		t === void 0 ? super(e) : (super(`${e}: ${t}`), this.cause = t), this.name = "ClosedError";
	}
}, rn = class extends L {
	constructor(e) {
		super(e), this.name = "WebSocketUnsupportedError";
	}
}, an = class extends L {
	constructor(e) {
		super(e), this.name = "WebSocketError";
	}
}, on = class extends L {
	status;
	constructor(e, t) {
		super(e), this.status = t, this.name = "HttpServerError";
	}
}, sn = class extends L {
	constructor(e) {
		super(e), this.name = "ProtocolVersionError";
	}
}, B = class extends L {
	constructor(e) {
		super(e), this.name = "InternalError";
	}
}, V = class extends L {
	constructor(e) {
		super(e), this.name = "MisuseError";
	}
};
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/encoding/json/decode.js
function H(e) {
	if (typeof e == "string") return e;
	throw un(e, "string");
}
function U(e) {
	if (e != null) {
		if (typeof e == "string") return e;
		throw un(e, "string or null");
	}
}
function W(e) {
	if (typeof e == "number") return e;
	throw un(e, "number");
}
function cn(e) {
	if (typeof e == "boolean") return e;
	throw un(e, "boolean");
}
function ln(e) {
	if (Array.isArray(e)) return e;
	throw un(e, "array");
}
function G(e) {
	if (typeof e == "object" && e && !Array.isArray(e)) return e;
	throw un(e, "object");
}
function K(e, t) {
	return ln(e).map((e) => t(G(e)));
}
function un(e, t) {
	if (e === void 0) return new R(`Expected ${t}, but the property was missing`);
	let n = typeof e;
	return e === null ? n = "null" : Array.isArray(e) && (n = "array"), new R(`Expected ${t}, received ${n}`);
}
function dn(e, t) {
	return t(G(e));
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/encoding/json/encode.js
var fn = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e, this.#t = !1;
	}
	begin() {
		this.#e.push("{"), this.#t = !0;
	}
	end() {
		this.#e.push("}"), this.#t = !1;
	}
	#n(e) {
		this.#t ? (this.#e.push("\""), this.#t = !1) : this.#e.push(",\""), this.#e.push(e), this.#e.push("\":");
	}
	string(e, t) {
		this.#n(e), this.#e.push(JSON.stringify(t));
	}
	stringRaw(e, t) {
		this.#n(e), this.#e.push("\""), this.#e.push(t), this.#e.push("\"");
	}
	number(e, t) {
		this.#n(e), this.#e.push("" + t);
	}
	boolean(e, t) {
		this.#n(e), this.#e.push(t ? "true" : "false");
	}
	object(e, t, n) {
		this.#n(e), this.begin(), n(this, t), this.end();
	}
	arrayObjects(e, t, n) {
		this.#n(e), this.#e.push("[");
		for (let e = 0; e < t.length; ++e) e !== 0 && this.#e.push(","), this.begin(), n(this, t[e]), this.end();
		this.#e.push("]");
	}
};
function pn(e, t) {
	let n = [], r = new fn(n);
	return r.begin(), t(r, e), r.end(), n.join("");
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/encoding/protobuf/decode.js
var mn = class {
	#e;
	#t;
	#n;
	constructor(e) {
		this.#e = e, this.#t = new DataView(e.buffer, e.byteOffset, e.byteLength), this.#n = 0;
	}
	varint() {
		let e = 0;
		for (let t = 0;; t += 7) {
			let n = this.#e[this.#n++];
			if (e |= (n & 127) << t, !(n & 128)) break;
		}
		return e;
	}
	varintBig() {
		let e = 0n;
		for (let t = 0n;; t += 7n) {
			let n = this.#e[this.#n++];
			if (e |= BigInt(n & 127) << t, !(n & 128)) break;
		}
		return e;
	}
	bytes(e) {
		let t = new Uint8Array(this.#e.buffer, this.#e.byteOffset + this.#n, e);
		return this.#n += e, t;
	}
	double() {
		let e = this.#t.getFloat64(this.#n, !0);
		return this.#n += 8, e;
	}
	skipVarint() {
		for (; this.#e[this.#n++] & 128;);
	}
	skip(e) {
		this.#n += e;
	}
	eof() {
		return this.#n >= this.#e.byteLength;
	}
}, hn = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e, this.#t = -1;
	}
	setup(e) {
		this.#t = e;
	}
	#n(e) {
		if (this.#t !== e) throw new R(`Expected wire type ${e}, got ${this.#t}`);
		this.#t = -1;
	}
	bytes() {
		this.#n(2);
		let e = this.#e.varint();
		return this.#e.bytes(e);
	}
	string() {
		return new TextDecoder().decode(this.bytes());
	}
	message(e) {
		return gn(this.bytes(), e);
	}
	int32() {
		return this.#n(0), this.#e.varint();
	}
	uint32() {
		return this.int32();
	}
	bool() {
		return this.int32() !== 0;
	}
	uint64() {
		return this.#n(0), this.#e.varintBig();
	}
	sint64() {
		let e = this.uint64();
		return e >> 1n ^ -(e & 1n);
	}
	double() {
		return this.#n(1), this.#e.double();
	}
	maybeSkip() {
		if (!(this.#t < 0)) {
			if (this.#t === 0) this.#e.skipVarint();
			else if (this.#t === 1) this.#e.skip(8);
			else if (this.#t === 2) {
				let e = this.#e.varint();
				this.#e.skip(e);
			} else if (this.#t === 5) this.#e.skip(4);
			else throw new R(`Unexpected wire type ${this.#t}`);
			this.#t = -1;
		}
	}
};
function gn(e, t) {
	let n = new mn(e), r = new hn(n), i = t.default();
	for (; !n.eof();) {
		let e = n.varint(), a = e >> 3, o = e & 7;
		r.setup(o);
		let s = t[a];
		if (s !== void 0) {
			let e = s(r, i);
			e !== void 0 && (i = e);
		}
		r.maybeSkip();
	}
	return i;
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/encoding/protobuf/encode.js
var _n = class e {
	#e;
	#t;
	#n;
	#r;
	constructor() {
		this.#e = /* @__PURE__ */ new ArrayBuffer(256), this.#t = new Uint8Array(this.#e), this.#n = new DataView(this.#e), this.#r = 0;
	}
	#i(e) {
		if (this.#r + e <= this.#e.byteLength) return;
		let t = this.#e.byteLength;
		for (; t < this.#r + e;) t *= 2;
		let n = new ArrayBuffer(t), r = new Uint8Array(n), i = new DataView(n);
		r.set(new Uint8Array(this.#e, 0, this.#r)), this.#e = n, this.#t = r, this.#n = i;
	}
	#a(e) {
		this.#i(5), e = 0 | e;
		do {
			let t = e & 127;
			e >>>= 7, t |= e ? 128 : 0, this.#t[this.#r++] = t;
		} while (e);
	}
	#o(e) {
		this.#i(10), e &= 18446744073709551615n;
		do {
			let t = Number(e & 127n);
			e >>= 7n, t |= e ? 128 : 0, this.#t[this.#r++] = t;
		} while (e);
	}
	#s(e, t) {
		this.#a(e << 3 | t);
	}
	bytes(e, t) {
		this.#s(e, 2), this.#a(t.byteLength), this.#i(t.byteLength), this.#t.set(t, this.#r), this.#r += t.byteLength;
	}
	string(e, t) {
		this.bytes(e, new TextEncoder().encode(t));
	}
	message(t, n, r) {
		let i = new e();
		r(i, n), this.bytes(t, i.data());
	}
	int32(e, t) {
		this.#s(e, 0), this.#a(t);
	}
	uint32(e, t) {
		this.int32(e, t);
	}
	bool(e, t) {
		this.int32(e, +!!t);
	}
	sint64(e, t) {
		this.#s(e, 0), this.#o(t << 1n ^ t >> 63n);
	}
	double(e, t) {
		this.#s(e, 1), this.#i(8), this.#n.setFloat64(this.#r, t, !0), this.#r += 8;
	}
	data() {
		return new Uint8Array(this.#e, 0, this.#r);
	}
};
function vn(e, t) {
	let n = new _n();
	return t(n, e), n.data();
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/id_alloc.js
var yn = class {
	#e;
	#t;
	constructor() {
		this.#e = /* @__PURE__ */ new Set(), this.#t = /* @__PURE__ */ new Set();
	}
	alloc() {
		for (let e of this.#t) return this.#t.delete(e), this.#e.add(e), this.#e.has(this.#e.size - 1) || this.#t.add(this.#e.size - 1), e;
		let e = this.#e.size;
		return this.#e.add(e), e;
	}
	free(e) {
		if (!this.#e.delete(e)) throw new B("Freeing an id that is not allocated");
		this.#t.delete(this.#e.size), e < this.#e.size && this.#t.add(e);
	}
};
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/util.js
function q(e, t) {
	throw new B(t);
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/value.js
function bn(e) {
	if (e === null) return null;
	if (typeof e == "string") return e;
	if (typeof e == "number") {
		if (!Number.isFinite(e)) throw RangeError("Only finite numbers (not Infinity or NaN) can be passed as arguments");
		return e;
	} else if (typeof e == "bigint") {
		if (e < xn || e > Sn) throw RangeError("This bigint value is too large to be represented as a 64-bit integer and passed as argument");
		return e;
	} else if (typeof e == "boolean") return e ? 1n : 0n;
	else if (e instanceof ArrayBuffer) return new Uint8Array(e);
	else if (e instanceof Uint8Array) return e;
	else if (e instanceof Date) return +e.valueOf();
	else if (typeof e == "object") return "" + e.toString();
	else throw TypeError("Unsupported type of value");
}
var xn = -9223372036854775808n, Sn = 9223372036854775807n;
function Cn(e, t) {
	if (e === null) return null;
	if (typeof e == "number" || typeof e == "string") return e;
	if (typeof e == "bigint") if (t === "number") {
		let t = Number(e);
		if (!Number.isSafeInteger(t)) throw RangeError("Received integer which is too large to be safely represented as a JavaScript number");
		return t;
	} else if (t === "bigint") return e;
	else if (t === "string") return "" + e;
	else throw new V("Invalid value for IntMode");
	else if (e instanceof Uint8Array) return e.slice().buffer;
	else if (e === void 0) throw new R("Received unrecognized type of Value");
	else throw q(e, "Impossible type of Value");
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/result.js
function wn(e) {
	return {
		affectedRowCount: e.affectedRowCount,
		lastInsertRowid: e.lastInsertRowid,
		columnNames: e.cols.map((e) => e.name),
		columnDecltypes: e.cols.map((e) => e.decltype)
	};
}
function Tn(e, t) {
	let n = wn(e), r = e.rows.map((e) => On(n.columnNames, e, t));
	return {
		...n,
		rows: r
	};
}
function En(e, t) {
	let n = wn(e), r;
	return e.rows.length > 0 && (r = On(n.columnNames, e.rows[0], t)), {
		...n,
		row: r
	};
}
function Dn(e, t) {
	let n = wn(e), r;
	return e.rows.length > 0 && n.columnNames.length > 0 && (r = Cn(e.rows[0][0], t)), {
		...n,
		value: r
	};
}
function On(e, t, n) {
	let r = {};
	Object.defineProperty(r, "length", { value: t.length });
	for (let i = 0; i < t.length; ++i) {
		let a = Cn(t[i], n);
		Object.defineProperty(r, i, { value: a });
		let o = e[i];
		o !== void 0 && !Object.hasOwn(r, o) && Object.defineProperty(r, o, {
			value: a,
			enumerable: !0,
			configurable: !0,
			writable: !0
		});
	}
	return r;
}
function kn(e) {
	return new nn(e.message, e);
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/sql.js
var An = class {
	#e;
	#t;
	#n;
	constructor(e, t) {
		this.#e = e, this.#t = t, this.#n = void 0;
	}
	_getSqlId(e) {
		if (this.#e !== e) throw new V("Attempted to use SQL text opened with other object");
		if (this.#n !== void 0) throw new z("SQL text is closed", this.#n);
		return this.#t;
	}
	close() {
		this._setClosed(new L("SQL text was manually closed"));
	}
	_setClosed(e) {
		this.#n === void 0 && (this.#n = e, this.#e._closeSql(this.#t));
	}
	get closed() {
		return this.#n !== void 0;
	}
};
function jn(e, t) {
	return t instanceof An ? { sqlId: t._getSqlId(e) } : { sql: "" + t };
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/queue.js
var Mn = class {
	#e;
	#t;
	constructor() {
		this.#e = [], this.#t = [];
	}
	get length() {
		return this.#e.length + this.#t.length;
	}
	push(e) {
		this.#e.push(e);
	}
	shift() {
		return this.#t.length === 0 && this.#e.length > 0 && (this.#t = this.#e.reverse(), this.#e = []), this.#t.pop();
	}
	first() {
		return this.#t.length === 0 ? this.#e[0] : this.#t[this.#t.length - 1];
	}
}, Nn = class {
	sql;
	_args;
	_namedArgs;
	constructor(e) {
		this.sql = e, this._args = [], this._namedArgs = /* @__PURE__ */ new Map();
	}
	bindIndexes(e) {
		this._args.length = 0;
		for (let t of e) this._args.push(bn(t));
		return this;
	}
	bindIndex(e, t) {
		if (e !== (e | 0) || e <= 0) throw RangeError("Index of a positional argument must be positive integer");
		for (; this._args.length < e;) this._args.push(null);
		return this._args[e - 1] = bn(t), this;
	}
	bindName(e, t) {
		return this._namedArgs.set(e, bn(t)), this;
	}
	unbindAll() {
		return this._args.length = 0, this._namedArgs.clear(), this;
	}
};
function Pn(e, t, n) {
	let r, i = [], a = [];
	if (t instanceof Nn) {
		r = t.sql, i = t._args;
		for (let [e, n] of t._namedArgs.entries()) a.push({
			name: e,
			value: n
		});
	} else Array.isArray(t) ? (r = t[0], Array.isArray(t[1]) ? i = t[1].map((e) => bn(e)) : a = Object.entries(t[1]).map(([e, t]) => ({
		name: e,
		value: bn(t)
	}))) : r = t;
	let { sql: o, sqlId: s } = jn(e, r);
	return {
		sql: o,
		sqlId: s,
		args: i,
		namedArgs: a,
		wantRows: n
	};
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/batch.js
var Fn = class {
	_stream;
	#e;
	_steps;
	#t;
	constructor(e, t) {
		this._stream = e, this.#e = t, this._steps = [], this.#t = !1;
	}
	step() {
		return new Rn(this);
	}
	execute() {
		if (this.#t) throw new V("This batch has already been executed");
		this.#t = !0;
		let e = { steps: this._steps.map((e) => e.proto) };
		return this.#e ? Ln(this._stream, this._steps, e) : In(this._stream, this._steps, e);
	}
};
function In(e, t, n) {
	return e._batch(n).then((e) => {
		for (let n = 0; n < t.length; ++n) {
			let r = e.stepResults.get(n), i = e.stepErrors.get(n);
			t[n].callback(r, i);
		}
	});
}
async function Ln(e, t, n) {
	let r = await e._openCursor(n);
	try {
		let e = 0, n, i = [];
		for (;;) {
			let a = await r.next();
			if (a === void 0) break;
			if (a.type === "step_begin") {
				if (a.step < e || a.step >= t.length) throw new R("Server produced StepBeginEntry for unexpected step");
				if (n !== void 0) throw new R("Server produced StepBeginEntry before terminating previous step");
				for (let n = e; n < a.step; ++n) t[n].callback(void 0, void 0);
				e = a.step + 1, n = a, i = [];
			} else if (a.type === "step_end") {
				if (n === void 0) throw new R("Server produced StepEndEntry but no step is active");
				let e = {
					cols: n.cols,
					rows: i,
					affectedRowCount: a.affectedRowCount,
					lastInsertRowid: a.lastInsertRowid
				};
				t[n.step].callback(e, void 0), n = void 0, i = [];
			} else if (a.type === "step_error") {
				if (n === void 0) {
					if (a.step >= t.length) throw new R("Server produced StepErrorEntry for unexpected step");
					for (let n = e; n < a.step; ++n) t[n].callback(void 0, void 0);
				} else {
					if (a.step !== n.step) throw new R("Server produced StepErrorEntry for unexpected step");
					n = void 0, i = [];
				}
				t[a.step].callback(void 0, a.error), e = a.step + 1;
			} else if (a.type === "row") {
				if (n === void 0) throw new R("Server produced RowEntry but no step is active");
				i.push(a.row);
			} else if (a.type === "error") throw kn(a.error);
			else if (a.type === "none") throw new R("Server produced unrecognized CursorEntry");
			else throw q(a, "Impossible CursorEntry");
		}
		if (n !== void 0) throw new R("Server closed Cursor before terminating active step");
		for (let n = e; n < t.length; ++n) t[n].callback(void 0, void 0);
	} finally {
		r.close();
	}
}
var Rn = class {
	_batch;
	#e;
	_index;
	constructor(e) {
		this._batch = e, this.#e = [], this._index = void 0;
	}
	condition(e) {
		return this.#e.push(e._proto), this;
	}
	query(e) {
		return this.#t(e, !0, Tn);
	}
	queryRow(e) {
		return this.#t(e, !0, En);
	}
	queryValue(e) {
		return this.#t(e, !0, Dn);
	}
	run(e) {
		return this.#t(e, !1, wn);
	}
	#t(e, t, n) {
		if (this._index !== void 0) throw new V("This BatchStep has already been added to the batch");
		let r = Pn(this._batch._stream._sqlOwner(), e, t), i;
		i = this.#e.length === 0 ? void 0 : this.#e.length === 1 ? this.#e[0] : {
			type: "and",
			conds: this.#e.slice()
		};
		let a = {
			stmt: r,
			condition: i
		};
		return new Promise((e, t) => {
			let r = (r, i) => {
				r !== void 0 && i !== void 0 ? t(new R("Server returned both result and error")) : i === void 0 ? e(r === void 0 ? void 0 : n(r, this._batch._stream.intMode)) : t(kn(i));
			};
			this._index = this._batch._steps.length, this._batch._steps.push({
				proto: a,
				callback: r
			});
		});
	}
}, J = class e {
	_batch;
	_proto;
	constructor(e, t) {
		this._batch = e, this._proto = t;
	}
	static ok(t) {
		return new e(t._batch, {
			type: "ok",
			step: zn(t)
		});
	}
	static error(t) {
		return new e(t._batch, {
			type: "error",
			step: zn(t)
		});
	}
	static not(t) {
		return new e(t._batch, {
			type: "not",
			cond: t._proto
		});
	}
	static and(t, n) {
		for (let e of n) Bn(t, e);
		return new e(t, {
			type: "and",
			conds: n.map((e) => e._proto)
		});
	}
	static or(t, n) {
		for (let e of n) Bn(t, e);
		return new e(t, {
			type: "or",
			conds: n.map((e) => e._proto)
		});
	}
	static isAutocommit(t) {
		return t._stream.client()._ensureVersion(3, "BatchCond.isAutocommit()"), new e(t, { type: "is_autocommit" });
	}
};
function zn(e) {
	if (e._index === void 0) throw new V("Cannot add a condition referencing a step that has not been added to the batch");
	return e._index;
}
function Bn(e, t) {
	if (t._batch !== e) throw new V("Cannot mix BatchCond objects for different Batch objects");
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/describe.js
function Vn(e) {
	return {
		paramNames: e.params.map((e) => e.name),
		columns: e.cols,
		isExplain: e.isExplain,
		isReadonly: e.isReadonly
	};
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/stream.js
var Hn = class {
	constructor(e) {
		this.intMode = e;
	}
	query(e) {
		return this.#e(e, !0, Tn);
	}
	queryRow(e) {
		return this.#e(e, !0, En);
	}
	queryValue(e) {
		return this.#e(e, !0, Dn);
	}
	run(e) {
		return this.#e(e, !1, wn);
	}
	#e(e, t, n) {
		let r = Pn(this._sqlOwner(), e, t);
		return this._execute(r).then((e) => n(e, this.intMode));
	}
	batch(e = !1) {
		return new Fn(this, e);
	}
	describe(e) {
		let t = jn(this._sqlOwner(), e);
		return this._describe(t).then(Vn);
	}
	sequence(e) {
		let t = jn(this._sqlOwner(), e);
		return this._sequence(t);
	}
	intMode;
}, Un = class {}, Wn = 1e3, Gn = 10, Kn = class extends Un {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	constructor(e, t, n) {
		super(), this.#e = e, this.#t = t, this.#n = n, this.#r = new Mn(), this.#i = new Mn(), this.#a = void 0, this.#o = !1;
	}
	async next() {
		for (;;) {
			if (this.#a !== void 0) throw new z("Cursor is closed", this.#a);
			for (; !this.#o && this.#i.length < Gn;) this.#i.push(this.#s());
			let e = this.#r.shift();
			if (this.#o || e !== void 0) return e;
			await this.#i.shift().then((e) => {
				if (e !== void 0) {
					for (let t of e.entries) this.#r.push(t);
					this.#o ||= e.done;
				}
			});
		}
	}
	#s() {
		return this.#t._sendCursorRequest(this, {
			type: "fetch_cursor",
			cursorId: this.#n,
			maxCount: Wn
		}).then((e) => e, (e) => {
			this._setClosed(e);
		});
	}
	_setClosed(e) {
		this.#a === void 0 && (this.#a = e, this.#t._sendCursorRequest(this, {
			type: "close_cursor",
			cursorId: this.#n
		}).catch(() => void 0), this.#t._cursorClosed(this));
	}
	close() {
		this._setClosed(new L("Cursor was manually closed"));
	}
	get closed() {
		return this.#a !== void 0;
	}
}, qn = class e extends Hn {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	static open(t) {
		let n = t._streamIdAlloc.alloc(), r = new e(t, n), i = () => void 0, a = (e) => r.#l(e), o = {
			type: "open_stream",
			streamId: n
		};
		return t._sendRequest(o, {
			responseCallback: i,
			errorCallback: a
		}), r;
	}
	constructor(e, t) {
		super(e.intMode), this.#e = e, this.#t = t, this.#n = new Mn(), this.#r = void 0, this.#i = !1, this.#a = void 0;
	}
	client() {
		return this.#e;
	}
	_sqlOwner() {
		return this.#e;
	}
	_execute(e) {
		return this.#o({
			type: "execute",
			streamId: this.#t,
			stmt: e
		}).then((e) => e.result);
	}
	_batch(e) {
		return this.#o({
			type: "batch",
			streamId: this.#t,
			batch: e
		}).then((e) => e.result);
	}
	_describe(e) {
		return this.#e._ensureVersion(2, "describe()"), this.#o({
			type: "describe",
			streamId: this.#t,
			sql: e.sql,
			sqlId: e.sqlId
		}).then((e) => e.result);
	}
	_sequence(e) {
		return this.#e._ensureVersion(2, "sequence()"), this.#o({
			type: "sequence",
			streamId: this.#t,
			sql: e.sql,
			sqlId: e.sqlId
		}).then((e) => {});
	}
	getAutocommit() {
		return this.#e._ensureVersion(3, "getAutocommit()"), this.#o({
			type: "get_autocommit",
			streamId: this.#t
		}).then((e) => e.isAutocommit);
	}
	#o(e) {
		return new Promise((t, n) => {
			this.#s({
				type: "request",
				request: e,
				responseCallback: t,
				errorCallback: n
			});
		});
	}
	_openCursor(e) {
		return this.#e._ensureVersion(3, "cursor"), new Promise((t, n) => {
			this.#s({
				type: "cursor",
				batch: e,
				cursorCallback: t,
				errorCallback: n
			});
		});
	}
	_sendCursorRequest(e, t) {
		if (e !== this.#r) throw new B("Cursor not associated with the stream attempted to execute a request");
		return new Promise((e, n) => {
			this.#a === void 0 ? this.#e._sendRequest(t, {
				responseCallback: e,
				errorCallback: n
			}) : n(new z("Stream is closed", this.#a));
		});
	}
	_cursorClosed(e) {
		if (e !== this.#r) throw new B("Cursor was closed, but it was not associated with the stream");
		this.#r = void 0, this.#c();
	}
	#s(e) {
		this.#a === void 0 ? this.#i ? e.errorCallback(new z("Stream is closing", void 0)) : (this.#n.push(e), this.#c()) : e.errorCallback(new z("Stream is closed", this.#a));
	}
	#c() {
		for (;;) {
			let e = this.#n.first();
			if (e === void 0 && this.#r === void 0 && this.#i) {
				this.#l(new L("Stream was gracefully closed"));
				break;
			} else if (e?.type === "request" && this.#r === void 0) {
				let { request: t, responseCallback: n, errorCallback: r } = e;
				this.#n.shift(), this.#e._sendRequest(t, {
					responseCallback: n,
					errorCallback: r
				});
			} else if (e?.type === "cursor" && this.#r === void 0) {
				let { batch: t, cursorCallback: n } = e;
				this.#n.shift();
				let r = this.#e._cursorIdAlloc.alloc(), i = new Kn(this.#e, this, r), a = {
					type: "open_cursor",
					streamId: this.#t,
					cursorId: r,
					batch: t
				};
				this.#e._sendRequest(a, {
					responseCallback: () => void 0,
					errorCallback: (e) => i._setClosed(e)
				}), this.#r = i, n(i);
			} else break;
		}
	}
	#l(e) {
		if (this.#a !== void 0) return;
		for (this.#a = e, this.#r !== void 0 && this.#r._setClosed(e);;) {
			let t = this.#n.shift();
			if (t !== void 0) t.errorCallback(e);
			else break;
		}
		let t = {
			type: "close_stream",
			streamId: this.#t
		};
		this.#e._sendRequest(t, {
			responseCallback: () => this.#e._streamIdAlloc.free(this.#t),
			errorCallback: () => void 0
		});
	}
	close() {
		this.#l(new L("Stream was manually closed"));
	}
	closeGracefully() {
		this.#i = !0, this.#c();
	}
	get closed() {
		return this.#a !== void 0 || this.#i;
	}
};
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/shared/json_encode.js
function Jn(e, t) {
	t.sql !== void 0 && e.string("sql", t.sql), t.sqlId !== void 0 && e.number("sql_id", t.sqlId), e.arrayObjects("args", t.args, $n), e.arrayObjects("named_args", t.namedArgs, Yn), e.boolean("want_rows", t.wantRows);
}
function Yn(e, t) {
	e.string("name", t.name), e.object("value", t.value, $n);
}
function Xn(e, t) {
	e.arrayObjects("steps", t.steps, Zn);
}
function Zn(e, t) {
	t.condition !== void 0 && e.object("condition", t.condition, Qn), e.object("stmt", t.stmt, Jn);
}
function Qn(e, t) {
	if (e.stringRaw("type", t.type), t.type === "ok" || t.type === "error") e.number("step", t.step);
	else if (t.type === "not") e.object("cond", t.cond, Qn);
	else if (t.type === "and" || t.type === "or") e.arrayObjects("conds", t.conds, Qn);
	else if (t.type !== "is_autocommit") throw q(t, "Impossible type of BatchCond");
}
function $n(e, t) {
	if (t === null) e.stringRaw("type", "null");
	else if (typeof t == "bigint") e.stringRaw("type", "integer"), e.stringRaw("value", "" + t);
	else if (typeof t == "number") e.stringRaw("type", "float"), e.number("value", t);
	else if (typeof t == "string") e.stringRaw("type", "text"), e.string("value", t);
	else if (t instanceof Uint8Array) e.stringRaw("type", "blob"), e.stringRaw("base64", ot.fromUint8Array(t));
	else if (t !== void 0) throw q(t, "Impossible type of Value");
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/ws/json_encode.js
function er(e, t) {
	if (e.stringRaw("type", t.type), t.type === "hello") t.jwt !== void 0 && e.string("jwt", t.jwt);
	else if (t.type === "request") e.number("request_id", t.requestId), e.object("request", t.request, tr);
	else throw q(t, "Impossible type of ClientMsg");
}
function tr(e, t) {
	if (e.stringRaw("type", t.type), t.type === "open_stream") e.number("stream_id", t.streamId);
	else if (t.type === "close_stream") e.number("stream_id", t.streamId);
	else if (t.type === "execute") e.number("stream_id", t.streamId), e.object("stmt", t.stmt, Jn);
	else if (t.type === "batch") e.number("stream_id", t.streamId), e.object("batch", t.batch, Xn);
	else if (t.type === "open_cursor") e.number("stream_id", t.streamId), e.number("cursor_id", t.cursorId), e.object("batch", t.batch, Xn);
	else if (t.type === "close_cursor") e.number("cursor_id", t.cursorId);
	else if (t.type === "fetch_cursor") e.number("cursor_id", t.cursorId), e.number("max_count", t.maxCount);
	else if (t.type === "sequence") e.number("stream_id", t.streamId), t.sql !== void 0 && e.string("sql", t.sql), t.sqlId !== void 0 && e.number("sql_id", t.sqlId);
	else if (t.type === "describe") e.number("stream_id", t.streamId), t.sql !== void 0 && e.string("sql", t.sql), t.sqlId !== void 0 && e.number("sql_id", t.sqlId);
	else if (t.type === "store_sql") e.number("sql_id", t.sqlId), e.string("sql", t.sql);
	else if (t.type === "close_sql") e.number("sql_id", t.sqlId);
	else if (t.type === "get_autocommit") e.number("stream_id", t.streamId);
	else throw q(t, "Impossible type of Request");
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/shared/protobuf_encode.js
function nr(e, t) {
	t.sql !== void 0 && e.string(1, t.sql), t.sqlId !== void 0 && e.int32(2, t.sqlId);
	for (let n of t.args) e.message(3, n, cr);
	for (let n of t.namedArgs) e.message(4, n, rr);
	e.bool(5, t.wantRows);
}
function rr(e, t) {
	e.string(1, t.name), e.message(2, t.value, cr);
}
function ir(e, t) {
	for (let n of t.steps) e.message(1, n, ar);
}
function ar(e, t) {
	t.condition !== void 0 && e.message(1, t.condition, or), e.message(2, t.stmt, nr);
}
function or(e, t) {
	if (t.type === "ok") e.uint32(1, t.step);
	else if (t.type === "error") e.uint32(2, t.step);
	else if (t.type === "not") e.message(3, t.cond, or);
	else if (t.type === "and") e.message(4, t.conds, sr);
	else if (t.type === "or") e.message(5, t.conds, sr);
	else if (t.type === "is_autocommit") e.message(6, void 0, lr);
	else throw q(t, "Impossible type of BatchCond");
}
function sr(e, t) {
	for (let n of t) e.message(1, n, or);
}
function cr(e, t) {
	if (t === null) e.message(1, void 0, lr);
	else if (typeof t == "bigint") e.sint64(2, t);
	else if (typeof t == "number") e.double(3, t);
	else if (typeof t == "string") e.string(4, t);
	else if (t instanceof Uint8Array) e.bytes(5, t);
	else if (t !== void 0) throw q(t, "Impossible type of Value");
}
function lr(e, t) {}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/ws/protobuf_encode.js
function ur(e, t) {
	if (t.type === "hello") e.message(1, t, dr);
	else if (t.type === "request") e.message(2, t, fr);
	else throw q(t, "Impossible type of ClientMsg");
}
function dr(e, t) {
	t.jwt !== void 0 && e.string(1, t.jwt);
}
function fr(e, t) {
	e.int32(1, t.requestId);
	let n = t.request;
	if (n.type === "open_stream") e.message(2, n, pr);
	else if (n.type === "close_stream") e.message(3, n, mr);
	else if (n.type === "execute") e.message(4, n, hr);
	else if (n.type === "batch") e.message(5, n, gr);
	else if (n.type === "open_cursor") e.message(6, n, _r);
	else if (n.type === "close_cursor") e.message(7, n, vr);
	else if (n.type === "fetch_cursor") e.message(8, n, yr);
	else if (n.type === "sequence") e.message(9, n, br);
	else if (n.type === "describe") e.message(10, n, xr);
	else if (n.type === "store_sql") e.message(11, n, Sr);
	else if (n.type === "close_sql") e.message(12, n, Cr);
	else if (n.type === "get_autocommit") e.message(13, n, wr);
	else throw q(n, "Impossible type of Request");
}
function pr(e, t) {
	e.int32(1, t.streamId);
}
function mr(e, t) {
	e.int32(1, t.streamId);
}
function hr(e, t) {
	e.int32(1, t.streamId), e.message(2, t.stmt, nr);
}
function gr(e, t) {
	e.int32(1, t.streamId), e.message(2, t.batch, ir);
}
function _r(e, t) {
	e.int32(1, t.streamId), e.int32(2, t.cursorId), e.message(3, t.batch, ir);
}
function vr(e, t) {
	e.int32(1, t.cursorId);
}
function yr(e, t) {
	e.int32(1, t.cursorId), e.uint32(2, t.maxCount);
}
function br(e, t) {
	e.int32(1, t.streamId), t.sql !== void 0 && e.string(2, t.sql), t.sqlId !== void 0 && e.int32(3, t.sqlId);
}
function xr(e, t) {
	e.int32(1, t.streamId), t.sql !== void 0 && e.string(2, t.sql), t.sqlId !== void 0 && e.int32(3, t.sqlId);
}
function Sr(e, t) {
	e.int32(1, t.sqlId), e.string(2, t.sql);
}
function Cr(e, t) {
	e.int32(1, t.sqlId);
}
function wr(e, t) {
	e.int32(1, t.streamId);
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/shared/json_decode.js
function Tr(e) {
	return {
		message: H(e.message),
		code: U(e.code)
	};
}
function Er(e) {
	let t = K(e.cols, Dr), n = ln(e.rows).map((e) => K(e, Nr)), r = W(e.affected_row_count), i = U(e.last_insert_rowid);
	return {
		cols: t,
		rows: n,
		affectedRowCount: r,
		lastInsertRowid: i === void 0 ? void 0 : BigInt(i)
	};
}
function Dr(e) {
	return {
		name: U(e.name),
		decltype: U(e.decltype)
	};
}
function Or(e) {
	let t = /* @__PURE__ */ new Map();
	ln(e.step_results).forEach((e, n) => {
		e !== null && t.set(n, Er(G(e)));
	});
	let n = /* @__PURE__ */ new Map();
	return ln(e.step_errors).forEach((e, t) => {
		e !== null && n.set(t, Tr(G(e)));
	}), {
		stepResults: t,
		stepErrors: n
	};
}
function kr(e) {
	let t = H(e.type);
	if (t === "step_begin") return {
		type: "step_begin",
		step: W(e.step),
		cols: K(e.cols, Dr)
	};
	if (t === "step_end") {
		let t = W(e.affected_row_count), n = U(e.last_insert_rowid);
		return {
			type: "step_end",
			affectedRowCount: t,
			lastInsertRowid: n === void 0 ? void 0 : BigInt(n)
		};
	} else if (t === "step_error") return {
		type: "step_error",
		step: W(e.step),
		error: Tr(G(e.error))
	};
	else if (t === "row") return {
		type: "row",
		row: K(e.row, Nr)
	};
	else if (t === "error") return {
		type: "error",
		error: Tr(G(e.error))
	};
	else throw new R("Unexpected type of CursorEntry");
}
function Ar(e) {
	return {
		params: K(e.params, jr),
		cols: K(e.cols, Mr),
		isExplain: cn(e.is_explain),
		isReadonly: cn(e.is_readonly)
	};
}
function jr(e) {
	return { name: U(e.name) };
}
function Mr(e) {
	return {
		name: H(e.name),
		decltype: U(e.decltype)
	};
}
function Nr(e) {
	let t = H(e.type);
	if (t === "null") return null;
	if (t === "integer") {
		let t = H(e.value);
		return BigInt(t);
	} else if (t === "float") return W(e.value);
	else if (t === "text") return H(e.value);
	else if (t === "blob") return ot.toUint8Array(H(e.base64));
	else throw new R("Unexpected type of Value");
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/ws/json_decode.js
function Pr(e) {
	let t = H(e.type);
	if (t === "hello_ok") return { type: "hello_ok" };
	if (t === "hello_error") return {
		type: "hello_error",
		error: Tr(G(e.error))
	};
	if (t === "response_ok") return {
		type: "response_ok",
		requestId: W(e.request_id),
		response: Fr(G(e.response))
	};
	if (t === "response_error") return {
		type: "response_error",
		requestId: W(e.request_id),
		error: Tr(G(e.error))
	};
	throw new R("Unexpected type of ServerMsg");
}
function Fr(e) {
	let t = H(e.type);
	if (t === "open_stream") return { type: "open_stream" };
	if (t === "close_stream") return { type: "close_stream" };
	if (t === "execute") return {
		type: "execute",
		result: Er(G(e.result))
	};
	if (t === "batch") return {
		type: "batch",
		result: Or(G(e.result))
	};
	if (t === "open_cursor") return { type: "open_cursor" };
	if (t === "close_cursor") return { type: "close_cursor" };
	if (t === "fetch_cursor") return {
		type: "fetch_cursor",
		entries: K(e.entries, kr),
		done: cn(e.done)
	};
	if (t === "sequence") return { type: "sequence" };
	if (t === "describe") return {
		type: "describe",
		result: Ar(G(e.result))
	};
	if (t === "store_sql") return { type: "store_sql" };
	if (t === "close_sql") return { type: "close_sql" };
	if (t === "get_autocommit") return {
		type: "get_autocommit",
		isAutocommit: cn(e.is_autocommit)
	};
	throw new R("Unexpected type of Response");
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/shared/protobuf_decode.js
var Y = {
	default() {
		return {
			message: "",
			code: void 0
		};
	},
	1(e, t) {
		t.message = e.string();
	},
	2(e, t) {
		t.code = e.string();
	}
}, Ir = {
	default() {
		return {
			cols: [],
			rows: [],
			affectedRowCount: 0,
			lastInsertRowid: void 0
		};
	},
	1(e, t) {
		t.cols.push(e.message(Lr));
	},
	2(e, t) {
		t.rows.push(e.message(Rr));
	},
	3(e, t) {
		t.affectedRowCount = Number(e.uint64());
	},
	4(e, t) {
		t.lastInsertRowid = e.sint64();
	}
}, Lr = {
	default() {
		return {
			name: void 0,
			decltype: void 0
		};
	},
	1(e, t) {
		t.name = e.string();
	},
	2(e, t) {
		t.decltype = e.string();
	}
}, Rr = {
	default() {
		return [];
	},
	1(e, t) {
		t.push(e.message(Yr));
	}
}, zr = {
	default() {
		return {
			stepResults: /* @__PURE__ */ new Map(),
			stepErrors: /* @__PURE__ */ new Map()
		};
	},
	1(e, t) {
		let [n, r] = e.message(Br);
		t.stepResults.set(n, r);
	},
	2(e, t) {
		let [n, r] = e.message(Vr);
		t.stepErrors.set(n, r);
	}
}, Br = {
	default() {
		return [0, Ir.default()];
	},
	1(e, t) {
		t[0] = e.uint32();
	},
	2(e, t) {
		t[1] = e.message(Ir);
	}
}, Vr = {
	default() {
		return [0, Y.default()];
	},
	1(e, t) {
		t[0] = e.uint32();
	},
	2(e, t) {
		t[1] = e.message(Y);
	}
}, Hr = {
	default() {
		return { type: "none" };
	},
	1(e) {
		return e.message(Ur);
	},
	2(e) {
		return e.message(Wr);
	},
	3(e) {
		return e.message(Gr);
	},
	4(e) {
		return {
			type: "row",
			row: e.message(Rr)
		};
	},
	5(e) {
		return {
			type: "error",
			error: e.message(Y)
		};
	}
}, Ur = {
	default() {
		return {
			type: "step_begin",
			step: 0,
			cols: []
		};
	},
	1(e, t) {
		t.step = e.uint32();
	},
	2(e, t) {
		t.cols.push(e.message(Lr));
	}
}, Wr = {
	default() {
		return {
			type: "step_end",
			affectedRowCount: 0,
			lastInsertRowid: void 0
		};
	},
	1(e, t) {
		t.affectedRowCount = e.uint32();
	},
	2(e, t) {
		t.lastInsertRowid = e.uint64();
	}
}, Gr = {
	default() {
		return {
			type: "step_error",
			step: 0,
			error: Y.default()
		};
	},
	1(e, t) {
		t.step = e.uint32();
	},
	2(e, t) {
		t.error = e.message(Y);
	}
}, Kr = {
	default() {
		return {
			params: [],
			cols: [],
			isExplain: !1,
			isReadonly: !1
		};
	},
	1(e, t) {
		t.params.push(e.message(qr));
	},
	2(e, t) {
		t.cols.push(e.message(Jr));
	},
	3(e, t) {
		t.isExplain = e.bool();
	},
	4(e, t) {
		t.isReadonly = e.bool();
	}
}, qr = {
	default() {
		return { name: void 0 };
	},
	1(e, t) {
		t.name = e.string();
	}
}, Jr = {
	default() {
		return {
			name: "",
			decltype: void 0
		};
	},
	1(e, t) {
		t.name = e.string();
	},
	2(e, t) {
		t.decltype = e.string();
	}
}, Yr = {
	default() {},
	1(e) {
		return null;
	},
	2(e) {
		return e.sint64();
	},
	3(e) {
		return e.double();
	},
	4(e) {
		return e.string();
	},
	5(e) {
		return e.bytes();
	}
}, Xr = {
	default() {
		return { type: "none" };
	},
	1(e) {
		return { type: "hello_ok" };
	},
	2(e) {
		return e.message(Zr);
	},
	3(e) {
		return e.message($r);
	},
	4(e) {
		return e.message(Qr);
	}
}, Zr = {
	default() {
		return {
			type: "hello_error",
			error: Y.default()
		};
	},
	1(e, t) {
		t.error = e.message(Y);
	}
}, Qr = {
	default() {
		return {
			type: "response_error",
			requestId: 0,
			error: Y.default()
		};
	},
	1(e, t) {
		t.requestId = e.int32();
	},
	2(e, t) {
		t.error = e.message(Y);
	}
}, $r = {
	default() {
		return {
			type: "response_ok",
			requestId: 0,
			response: { type: "none" }
		};
	},
	1(e, t) {
		t.requestId = e.int32();
	},
	2(e, t) {
		t.response = { type: "open_stream" };
	},
	3(e, t) {
		t.response = { type: "close_stream" };
	},
	4(e, t) {
		t.response = e.message(ei);
	},
	5(e, t) {
		t.response = e.message(ti);
	},
	6(e, t) {
		t.response = { type: "open_cursor" };
	},
	7(e, t) {
		t.response = { type: "close_cursor" };
	},
	8(e, t) {
		t.response = e.message(ni);
	},
	9(e, t) {
		t.response = { type: "sequence" };
	},
	10(e, t) {
		t.response = e.message(ri);
	},
	11(e, t) {
		t.response = { type: "store_sql" };
	},
	12(e, t) {
		t.response = { type: "close_sql" };
	},
	13(e, t) {
		t.response = e.message(ii);
	}
}, ei = {
	default() {
		return {
			type: "execute",
			result: Ir.default()
		};
	},
	1(e, t) {
		t.result = e.message(Ir);
	}
}, ti = {
	default() {
		return {
			type: "batch",
			result: zr.default()
		};
	},
	1(e, t) {
		t.result = e.message(zr);
	}
}, ni = {
	default() {
		return {
			type: "fetch_cursor",
			entries: [],
			done: !1
		};
	},
	1(e, t) {
		t.entries.push(e.message(Hr));
	},
	2(e, t) {
		t.done = e.bool();
	}
}, ri = {
	default() {
		return {
			type: "describe",
			result: Kr.default()
		};
	},
	1(e, t) {
		t.result = e.message(Kr);
	}
}, ii = {
	default() {
		return {
			type: "get_autocommit",
			isAutocommit: !1
		};
	},
	1(e, t) {
		t.isAutocommit = e.bool();
	}
}, ai = new Map([["hrana2", {
	version: 2,
	encoding: "json"
}], ["hrana1", {
	version: 1,
	encoding: "json"
}]]), oi = new Map([
	["hrana3-protobuf", {
		version: 3,
		encoding: "protobuf"
	}],
	["hrana3", {
		version: 3,
		encoding: "json"
	}],
	["hrana2", {
		version: 2,
		encoding: "json"
	}],
	["hrana1", {
		version: 1,
		encoding: "json"
	}]
]), si = class extends tn {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	#c;
	_streamIdAlloc;
	_cursorIdAlloc;
	#l;
	constructor(e, t) {
		super(), this.#e = e, this.#t = [], this.#n = !1, this.#r = void 0, this.#i = !1, this.#a = void 0, this.#o = !1, this.#s = /* @__PURE__ */ new Map(), this.#c = new yn(), this._streamIdAlloc = new yn(), this._cursorIdAlloc = new yn(), this.#l = new yn(), this.#e.binaryType = "arraybuffer", this.#e.addEventListener("open", () => this.#d()), this.#e.addEventListener("close", (e) => this.#m(e)), this.#e.addEventListener("error", (e) => this.#p(e)), this.#e.addEventListener("message", (e) => this.#g(e)), this.#u({
			type: "hello",
			jwt: t
		});
	}
	#u(e) {
		if (this.#r !== void 0) throw new B("Trying to send a message on a closed client");
		this.#n ? this.#f(e) : this.#t.push({
			openCallback: () => this.#f(e),
			errorCallback: () => void 0
		});
	}
	#d() {
		let e = this.#e.protocol;
		if (e === void 0) {
			this.#h(new L("The `WebSocket.protocol` property is undefined. This most likely means that the WebSocket implementation provided by the environment is broken. If you are using Miniflare 2, please update to Miniflare 3, which fixes this problem."));
			return;
		} else if (e === "") this.#a = {
			version: 1,
			encoding: "json"
		};
		else if (this.#a = oi.get(e), this.#a === void 0) {
			this.#h(new R(`Unrecognized WebSocket subprotocol: ${JSON.stringify(e)}`));
			return;
		}
		for (let e of this.#t) e.openCallback();
		this.#t.length = 0, this.#n = !0;
	}
	#f(e) {
		let t = this.#a.encoding;
		if (t === "json") {
			let t = pn(e, er);
			this.#e.send(t);
		} else if (t === "protobuf") {
			let t = vn(e, ur);
			this.#e.send(t);
		} else throw q(t, "Impossible encoding");
	}
	getVersion() {
		return new Promise((e, t) => {
			this.#o = !0, this.#r === void 0 ? this.#n ? e(this.#a.version) : this.#t.push({
				openCallback: () => e(this.#a.version),
				errorCallback: t
			}) : t(this.#r);
		});
	}
	_ensureVersion(e, t) {
		if (this.#a === void 0 || !this.#o) throw new sn(`${t} is supported only on protocol version ${e} and higher, but the version supported by the WebSocket server is not yet known. Use Client.getVersion() to wait until the version is available.`);
		if (this.#a.version < e) throw new sn(`${t} is supported on protocol version ${e} and higher, but the WebSocket server only supports version ${this.#a.version}`);
	}
	_sendRequest(e, t) {
		if (this.#r !== void 0) {
			t.errorCallback(new z("Client is closed", this.#r));
			return;
		}
		let n = this.#c.alloc();
		this.#s.set(n, {
			...t,
			type: e.type
		}), this.#u({
			type: "request",
			requestId: n,
			request: e
		});
	}
	#p(e) {
		let t = e.message ?? "WebSocket was closed due to an error";
		this.#h(new an(t));
	}
	#m(e) {
		let t = `WebSocket was closed with code ${e.code}`;
		e.reason && (t += `: ${e.reason}`), this.#h(new an(t));
	}
	#h(e) {
		if (this.#r === void 0) {
			this.#r = e;
			for (let t of this.#t) t.errorCallback(e);
			this.#t.length = 0;
			for (let [t, n] of this.#s.entries()) n.errorCallback(e), this.#c.free(t);
			this.#s.clear(), this.#e.close();
		}
	}
	#g(e) {
		if (this.#r === void 0) try {
			let t, n = this.#a.encoding;
			if (n === "json") {
				if (typeof e.data != "string") {
					this.#e.close(3003, "Only text messages are accepted with JSON encoding"), this.#h(new R("Received non-text message from server with JSON encoding"));
					return;
				}
				t = dn(JSON.parse(e.data), Pr);
			} else if (n === "protobuf") {
				if (!(e.data instanceof ArrayBuffer)) {
					this.#e.close(3003, "Only binary messages are accepted with Protobuf encoding"), this.#h(new R("Received non-binary message from server with Protobuf encoding"));
					return;
				}
				t = gn(new Uint8Array(e.data), Xr);
			} else throw q(n, "Impossible encoding");
			this.#_(t);
		} catch (e) {
			this.#e.close(3007, "Could not handle message"), this.#h(e);
		}
	}
	#_(e) {
		if (e.type === "none") throw new R("Received an unrecognized ServerMsg");
		if (e.type === "hello_ok" || e.type === "hello_error") {
			if (this.#i) throw new R("Received a duplicated hello response");
			if (this.#i = !0, e.type === "hello_error") throw kn(e.error);
			return;
		} else if (!this.#i) throw new R("Received a non-hello message before a hello response");
		if (e.type === "response_ok") {
			let t = e.requestId, n = this.#s.get(t);
			if (this.#s.delete(t), n === void 0) throw new R("Received unexpected OK response");
			this.#c.free(t);
			try {
				if (n.type !== e.response.type) throw console.dir({
					responseState: n,
					msg: e
				}), new R("Received unexpected type of response");
				n.responseCallback(e.response);
			} catch (e) {
				throw n.errorCallback(e), e;
			}
		} else if (e.type === "response_error") {
			let t = e.requestId, n = this.#s.get(t);
			if (this.#s.delete(t), n === void 0) throw new R("Received unexpected error response");
			this.#c.free(t), n.errorCallback(kn(e.error));
		} else throw q(e, "Impossible ServerMsg type");
	}
	openStream() {
		return qn.open(this);
	}
	storeSql(e) {
		this._ensureVersion(2, "storeSql()");
		let t = this.#l.alloc(), n = new An(this, t), r = () => void 0, i = (e) => n._setClosed(e), a = {
			type: "store_sql",
			sqlId: t,
			sql: e
		};
		return this._sendRequest(a, {
			responseCallback: r,
			errorCallback: i
		}), n;
	}
	_closeSql(e) {
		if (this.#r !== void 0) return;
		let t = () => this.#l.free(e), n = (e) => this.#h(e), r = {
			type: "close_sql",
			sqlId: e
		};
		this._sendRequest(r, {
			responseCallback: t,
			errorCallback: n
		});
	}
	close() {
		this.#h(new L("Client was manually closed"));
	}
	get closed() {
		return this.#r !== void 0;
	}
}, ci;
if (typeof queueMicrotask < "u") ci = queueMicrotask;
else {
	let e = Promise.resolve();
	ci = (t) => {
		e.then(t);
	};
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/byte_queue.js
var li = class {
	#e;
	#t;
	#n;
	constructor(e) {
		this.#e = new Uint8Array(new ArrayBuffer(e)), this.#t = 0, this.#n = 0;
	}
	get length() {
		return this.#n - this.#t;
	}
	data() {
		return this.#e.slice(this.#t, this.#n);
	}
	push(e) {
		this.#r(e.byteLength), this.#e.set(e, this.#n), this.#n += e.byteLength;
	}
	#r(e) {
		if (this.#n + e <= this.#e.byteLength) return;
		let t = this.#n - this.#t;
		if (t + e <= this.#e.byteLength && 2 * this.#n >= this.#e.byteLength) this.#e.copyWithin(0, this.#t, this.#n);
		else {
			let n = this.#e.byteLength;
			do
				n *= 2;
			while (t + e > n);
			let r = new Uint8Array(new ArrayBuffer(n));
			r.set(this.#e.slice(this.#t, this.#n), 0), this.#e = r;
		}
		this.#n = t, this.#t = 0;
	}
	shift(e) {
		this.#t += e;
	}
};
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/http/json_decode.js
function ui(e) {
	return {
		baton: U(e.baton),
		baseUrl: U(e.base_url),
		results: K(e.results, di)
	};
}
function di(e) {
	let t = H(e.type);
	if (t === "ok") return {
		type: "ok",
		response: fi(G(e.response))
	};
	if (t === "error") return {
		type: "error",
		error: Tr(G(e.error))
	};
	throw new R("Unexpected type of StreamResult");
}
function fi(e) {
	let t = H(e.type);
	if (t === "close") return { type: "close" };
	if (t === "execute") return {
		type: "execute",
		result: Er(G(e.result))
	};
	if (t === "batch") return {
		type: "batch",
		result: Or(G(e.result))
	};
	if (t === "sequence") return { type: "sequence" };
	if (t === "describe") return {
		type: "describe",
		result: Ar(G(e.result))
	};
	if (t === "store_sql") return { type: "store_sql" };
	if (t === "close_sql") return { type: "close_sql" };
	if (t === "get_autocommit") return {
		type: "get_autocommit",
		isAutocommit: cn(e.is_autocommit)
	};
	throw new R("Unexpected type of StreamResponse");
}
function pi(e) {
	return {
		baton: U(e.baton),
		baseUrl: U(e.base_url)
	};
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/http/protobuf_decode.js
var mi = {
	default() {
		return {
			baton: void 0,
			baseUrl: void 0,
			results: []
		};
	},
	1(e, t) {
		t.baton = e.string();
	},
	2(e, t) {
		t.baseUrl = e.string();
	},
	3(e, t) {
		t.results.push(e.message(hi));
	}
}, hi = {
	default() {
		return { type: "none" };
	},
	1(e) {
		return {
			type: "ok",
			response: e.message(gi)
		};
	},
	2(e) {
		return {
			type: "error",
			error: e.message(Y)
		};
	}
}, gi = {
	default() {
		return { type: "none" };
	},
	1(e) {
		return { type: "close" };
	},
	2(e) {
		return e.message(_i);
	},
	3(e) {
		return e.message(vi);
	},
	4(e) {
		return { type: "sequence" };
	},
	5(e) {
		return e.message(yi);
	},
	6(e) {
		return { type: "store_sql" };
	},
	7(e) {
		return { type: "close_sql" };
	},
	8(e) {
		return e.message(bi);
	}
}, _i = {
	default() {
		return {
			type: "execute",
			result: Ir.default()
		};
	},
	1(e, t) {
		t.result = e.message(Ir);
	}
}, vi = {
	default() {
		return {
			type: "batch",
			result: zr.default()
		};
	},
	1(e, t) {
		t.result = e.message(zr);
	}
}, yi = {
	default() {
		return {
			type: "describe",
			result: Kr.default()
		};
	},
	1(e, t) {
		t.result = e.message(Kr);
	}
}, bi = {
	default() {
		return {
			type: "get_autocommit",
			isAutocommit: !1
		};
	},
	1(e, t) {
		t.isAutocommit = e.bool();
	}
}, xi = {
	default() {
		return {
			baton: void 0,
			baseUrl: void 0
		};
	},
	1(e, t) {
		t.baton = e.string();
	},
	2(e, t) {
		t.baseUrl = e.string();
	}
}, Si = class extends Un {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	constructor(e, t) {
		super(), this.#e = e, this.#t = t, this.#n = void 0, this.#r = new li(16 * 1024), this.#i = void 0, this.#a = !1;
	}
	async open(e) {
		if (e.body === null) throw new R("No response body for cursor request");
		this.#n = e.body[Symbol.asyncIterator]();
		let t = await this.#o(pi, xi);
		if (t === void 0) throw new R("Empty response to cursor request");
		return t;
	}
	next() {
		return this.#o(kr, Hr);
	}
	close() {
		this._setClosed(new L("Cursor was manually closed"));
	}
	_setClosed(e) {
		this.#i === void 0 && (this.#i = e, this.#e._cursorClosed(this), this.#n !== void 0 && this.#n.return());
	}
	get closed() {
		return this.#i !== void 0;
	}
	async #o(e, t) {
		for (;;) {
			if (this.#a) return;
			if (this.#i !== void 0) throw new z("Cursor is closed", this.#i);
			if (this.#t === "json") {
				let t = this.#s();
				if (t !== void 0) {
					let n = new TextDecoder().decode(t);
					return dn(JSON.parse(n), e);
				}
			} else if (this.#t === "protobuf") {
				let e = this.#c();
				if (e !== void 0) return gn(e, t);
			} else throw q(this.#t, "Impossible encoding");
			if (this.#n === void 0) throw new B("Attempted to read from HTTP cursor before it was opened");
			let { value: n, done: r } = await this.#n.next();
			if (r && this.#r.length === 0) this.#a = !0;
			else if (r) throw new R("Unexpected end of cursor stream");
			else this.#r.push(n);
		}
	}
	#s() {
		let e = this.#r.data(), t = e.indexOf(10);
		if (t < 0) return;
		let n = e.slice(0, t);
		return this.#r.shift(t + 1), n;
	}
	#c() {
		let e = this.#r.data(), t = 0, n = 0;
		for (;;) {
			if (n >= e.byteLength) return;
			let r = e[n];
			if (t |= (r & 127) << 7 * n, n += 1, !(r & 128)) break;
		}
		if (e.byteLength < n + t) return;
		let r = e.slice(n, n + t);
		return this.#r.shift(n + t), r;
	}
};
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/http/json_encode.js
function Ci(e, t) {
	t.baton !== void 0 && e.string("baton", t.baton), e.arrayObjects("requests", t.requests, wi);
}
function wi(e, t) {
	if (e.stringRaw("type", t.type), t.type !== "close") {
		if (t.type === "execute") e.object("stmt", t.stmt, Jn);
		else if (t.type === "batch") e.object("batch", t.batch, Xn);
		else if (t.type === "sequence") t.sql !== void 0 && e.string("sql", t.sql), t.sqlId !== void 0 && e.number("sql_id", t.sqlId);
		else if (t.type === "describe") t.sql !== void 0 && e.string("sql", t.sql), t.sqlId !== void 0 && e.number("sql_id", t.sqlId);
		else if (t.type === "store_sql") e.number("sql_id", t.sqlId), e.string("sql", t.sql);
		else if (t.type === "close_sql") e.number("sql_id", t.sqlId);
		else if (t.type !== "get_autocommit") throw q(t, "Impossible type of StreamRequest");
	}
}
function Ti(e, t) {
	t.baton !== void 0 && e.string("baton", t.baton), e.object("batch", t.batch, Xn);
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/http/protobuf_encode.js
function Ei(e, t) {
	t.baton !== void 0 && e.string(1, t.baton);
	for (let n of t.requests) e.message(2, n, Di);
}
function Di(e, t) {
	if (t.type === "close") e.message(1, t, Oi);
	else if (t.type === "execute") e.message(2, t, ki);
	else if (t.type === "batch") e.message(3, t, Ai);
	else if (t.type === "sequence") e.message(4, t, ji);
	else if (t.type === "describe") e.message(5, t, Mi);
	else if (t.type === "store_sql") e.message(6, t, Ni);
	else if (t.type === "close_sql") e.message(7, t, Pi);
	else if (t.type === "get_autocommit") e.message(8, t, Fi);
	else throw q(t, "Impossible type of StreamRequest");
}
function Oi(e, t) {}
function ki(e, t) {
	e.message(1, t.stmt, nr);
}
function Ai(e, t) {
	e.message(1, t.batch, ir);
}
function ji(e, t) {
	t.sql !== void 0 && e.string(1, t.sql), t.sqlId !== void 0 && e.int32(2, t.sqlId);
}
function Mi(e, t) {
	t.sql !== void 0 && e.string(1, t.sql), t.sqlId !== void 0 && e.int32(2, t.sqlId);
}
function Ni(e, t) {
	e.int32(1, t.sqlId), e.string(2, t.sql);
}
function Pi(e, t) {
	e.int32(1, t.sqlId);
}
function Fi(e, t) {}
function Ii(e, t) {
	t.baton !== void 0 && e.string(1, t.baton), e.message(2, t.batch, ir);
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/http/stream.js
var Li = class extends Hn {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	#c;
	#l;
	#u;
	#d;
	#f;
	constructor(e, t, n, r, i) {
		super(e.intMode), this.#e = e, this.#t = t.toString(), this.#n = n, this.#r = r, this.#i = i, this.#a = void 0, this.#o = new Mn(), this.#s = !1, this.#l = !1, this.#u = !1, this.#d = void 0, this.#f = new yn();
	}
	client() {
		return this.#e;
	}
	_sqlOwner() {
		return this;
	}
	storeSql(e) {
		let t = this.#f.alloc();
		return this.#p({
			type: "store_sql",
			sqlId: t,
			sql: e
		}).then(() => void 0, (e) => this._setClosed(e)), new An(this, t);
	}
	_closeSql(e) {
		this.#d === void 0 && this.#p({
			type: "close_sql",
			sqlId: e
		}).then(() => this.#f.free(e), (e) => this._setClosed(e));
	}
	_execute(e) {
		return this.#p({
			type: "execute",
			stmt: e
		}).then((e) => e.result);
	}
	_batch(e) {
		return this.#p({
			type: "batch",
			batch: e
		}).then((e) => e.result);
	}
	_describe(e) {
		return this.#p({
			type: "describe",
			sql: e.sql,
			sqlId: e.sqlId
		}).then((e) => e.result);
	}
	_sequence(e) {
		return this.#p({
			type: "sequence",
			sql: e.sql,
			sqlId: e.sqlId
		}).then((e) => {});
	}
	getAutocommit() {
		return this.#e._ensureVersion(3, "getAutocommit()"), this.#p({ type: "get_autocommit" }).then((e) => e.isAutocommit);
	}
	#p(e) {
		return new Promise((t, n) => {
			this.#m({
				type: "pipeline",
				request: e,
				responseCallback: t,
				errorCallback: n
			});
		});
	}
	_openCursor(e) {
		return new Promise((t, n) => {
			this.#m({
				type: "cursor",
				batch: e,
				cursorCallback: t,
				errorCallback: n
			});
		});
	}
	_cursorClosed(e) {
		if (e !== this.#c) throw new B("Cursor was closed, but it was not associated with the stream");
		this.#c = void 0, ci(() => this.#h());
	}
	close() {
		this._setClosed(new L("Stream was manually closed"));
	}
	closeGracefully() {
		this.#l = !0, ci(() => this.#h());
	}
	get closed() {
		return this.#d !== void 0 || this.#l;
	}
	_setClosed(e) {
		if (this.#d === void 0) {
			for (this.#d = e, this.#c !== void 0 && this.#c._setClosed(e), this.#e._streamClosed(this);;) {
				let t = this.#o.shift();
				if (t !== void 0) t.errorCallback(e);
				else break;
			}
			(this.#a !== void 0 || this.#s) && !this.#u && (this.#o.push({
				type: "pipeline",
				request: { type: "close" },
				responseCallback: () => void 0,
				errorCallback: () => void 0
			}), this.#u = !0, ci(() => this.#h()));
		}
	}
	#m(e) {
		if (this.#d !== void 0) throw new z("Stream is closed", this.#d);
		if (this.#l) throw new z("Stream is closing", void 0);
		this.#o.push(e), ci(() => this.#h());
	}
	#h() {
		if (this.#s || this.#c !== void 0) return;
		if (this.#l && this.#o.length === 0) {
			this._setClosed(new L("Stream was gracefully closed"));
			return;
		}
		let e = this.#e._endpoint;
		if (e === void 0) {
			this.#e._endpointPromise.then(() => this.#h(), (e) => this._setClosed(e));
			return;
		}
		let t = this.#o.shift();
		if (t !== void 0) if (t.type === "pipeline") {
			let n = [t];
			for (;;) {
				let e = this.#o.first();
				if (e !== void 0 && e.type === "pipeline") n.push(e), this.#o.shift();
				else if (e === void 0 && this.#l && !this.#u) {
					n.push({
						type: "pipeline",
						request: { type: "close" },
						responseCallback: () => void 0,
						errorCallback: () => void 0
					}), this.#u = !0;
					break;
				} else break;
			}
			this.#g(e, n);
		} else if (t.type === "cursor") this.#_(e, t);
		else throw q(t, "Impossible type of QueueEntry");
	}
	#g(e, t) {
		this.#v(() => this.#y(t, e), (t) => zi(t, e.encoding), (e) => e.baton, (e) => e.baseUrl, (e) => Ri(t, e), (e) => t.forEach((t) => t.errorCallback(e)));
	}
	#_(e, t) {
		let n = new Si(this, e.encoding);
		this.#c = n, this.#v(() => this.#b(t, e), (e) => n.open(e), (e) => e.baton, (e) => e.baseUrl, (e) => t.cursorCallback(n), (e) => t.errorCallback(e));
	}
	#v(e, t, n, r, i, a) {
		let o;
		try {
			let t = e(), n = this.#r;
			o = n(t);
		} catch (e) {
			o = Promise.reject(e);
		}
		this.#s = !0, o.then((e) => e.ok ? t(e) : Bi(e).then((e) => {
			throw e;
		})).then((e) => {
			this.#a = n(e), this.#t = r(e) ?? this.#t, i(e);
		}).catch((e) => {
			this._setClosed(e), a(e);
		}).finally(() => {
			this.#s = !1, this.#h();
		});
	}
	#y(e, t) {
		return this.#x(new URL(t.pipelinePath, this.#t), {
			baton: this.#a,
			requests: e.map((e) => e.request)
		}, t.encoding, Ci, Ei);
	}
	#b(e, t) {
		if (t.cursorPath === void 0) throw new sn(`Cursors are supported only on protocol version 3 and higher, but the HTTP server only supports version ${t.version}.`);
		return this.#x(new URL(t.cursorPath, this.#t), {
			baton: this.#a,
			batch: e.batch
		}, t.encoding, Ti, Ii);
	}
	#x(e, t, n, r, i) {
		let a, o;
		if (n === "json") a = pn(t, r), o = "application/json";
		else if (n === "protobuf") a = vn(t, i), o = "application/x-protobuf";
		else throw q(n, "Impossible encoding");
		let s = new Headers();
		return s.set("content-type", o), this.#n !== void 0 && s.set("authorization", `Bearer ${this.#n}`), this.#i !== void 0 && s.set("x-turso-encryption-key", this.#i), new Request(e.toString(), {
			method: "POST",
			headers: s,
			body: a
		});
	}
};
function Ri(e, t) {
	if (t.results.length !== e.length) throw new R("Server returned unexpected number of pipeline results");
	for (let n = 0; n < e.length; ++n) {
		let r = t.results[n], i = e[n];
		if (r.type === "ok") {
			if (r.response.type !== i.request.type) throw new R("Received unexpected type of response");
			i.responseCallback(r.response);
		} else if (r.type === "error") i.errorCallback(kn(r.error));
		else if (r.type === "none") throw new R("Received unrecognized type of StreamResult");
		else throw q(r, "Received impossible type of StreamResult");
	}
}
async function zi(e, t) {
	if (t === "json") return dn(await e.json(), ui);
	if (t === "protobuf") {
		let t = await e.arrayBuffer();
		return gn(new Uint8Array(t), mi);
	}
	throw await e.body?.cancel(), q(t, "Impossible encoding");
}
async function Bi(e) {
	let t = e.headers.get("content-type") ?? "text/plain", n = `Server returned HTTP status ${e.status}`;
	if (t === "application/json") {
		let t = await e.json();
		return "message" in t ? kn(t) : new on(n, e.status);
	}
	if (t === "text/plain") {
		let t = (await e.text()).trim();
		return t !== "" && (n += `: ${t}`), new on(n, e.status);
	}
	return await e.body?.cancel(), new on(n, e.status);
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/http/client.js
var Vi = [{
	versionPath: "v3-protobuf",
	pipelinePath: "v3-protobuf/pipeline",
	cursorPath: "v3-protobuf/cursor",
	version: 3,
	encoding: "protobuf"
}], Hi = {
	versionPath: "v2",
	pipelinePath: "v2/pipeline",
	cursorPath: void 0,
	version: 2,
	encoding: "json"
}, Ui = class extends tn {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	_endpointPromise;
	_endpoint;
	constructor(e, t, n, r, i = 2) {
		super(), this.#e = e, this.#t = t, this.#n = n ?? globalThis.fetch, this.#r = r, this.#i = void 0, this.#a = /* @__PURE__ */ new Set(), i == 3 ? (this._endpointPromise = Wi(this.#n, this.#e), this._endpointPromise.then((e) => this._endpoint = e, (e) => this.#o(e))) : (this._endpointPromise = Promise.resolve(Hi), this._endpointPromise.then((e) => this._endpoint = e, (e) => this.#o(e)));
	}
	async getVersion() {
		return this._endpoint === void 0 ? (await this._endpointPromise).version : this._endpoint.version;
	}
	_ensureVersion(e, t) {
		if (!(e <= Hi.version)) {
			if (this._endpoint === void 0) throw new sn(`${t} is supported only on protocol version ${e} and higher, but the version supported by the HTTP server is not yet known. Use Client.getVersion() to wait until the version is available.`);
			if (this._endpoint.version < e) throw new sn(`${t} is supported only on protocol version ${e} and higher, but the HTTP server only supports version ${this._endpoint.version}.`);
		}
	}
	openStream() {
		if (this.#i !== void 0) throw new z("Client is closed", this.#i);
		let e = new Li(this, this.#e, this.#t, this.#n, this.#r);
		return this.#a.add(e), e;
	}
	_streamClosed(e) {
		this.#a.delete(e);
	}
	close() {
		this.#o(new L("Client was manually closed"));
	}
	get closed() {
		return this.#i !== void 0;
	}
	#o(e) {
		if (this.#i === void 0) {
			this.#i = e;
			for (let t of Array.from(this.#a)) t._setClosed(new z("Client was closed", e));
		}
	}
};
async function Wi(e, t) {
	let n = e;
	for (let e of Vi) {
		let r = new URL(e.versionPath, t), i = await n(new Request(r.toString(), { method: "GET" }));
		if (await i.arrayBuffer(), i.ok) return e;
	}
	return Hi;
}
//#endregion
//#region node_modules/@libsql/hrana-client/lib-esm/index.js
function Gi(e, t, n = 2) {
	if ($t.default === void 0) throw new rn("WebSockets are not supported in this environment");
	var r = void 0;
	return r = n == 3 ? Array.from(oi.keys()) : Array.from(ai.keys()), new si(new $t.default(e, r), t);
}
function Ki(e, t, n, r, i = 2) {
	return new Ui(e instanceof URL ? e : new URL(e), t, n, r, i);
}
//#endregion
//#region node_modules/@libsql/client/lib-esm/hrana.js
var qi = class {
	#e;
	#t;
	#n;
	constructor(e, t) {
		this.#e = e, this.#t = t, this.#n = void 0;
	}
	execute(e) {
		return this.batch([e]).then((e) => e[0]);
	}
	async batch(e) {
		let t = this._getStream();
		if (t.closed) throw new A("Cannot execute statements because the transaction is closed", "TRANSACTION_CLOSED");
		try {
			let n = e.map(X), r;
			if (this.#n === void 0) {
				this._getSqlCache().apply(n);
				let e = t.batch(this.#t >= 3), i = e.step(), a = i.run(P(this.#e)), o = i;
				r = n.map((t) => {
					let n = e.step().condition(J.ok(o));
					this.#t >= 3 && n.condition(J.not(J.isAutocommit(e)));
					let r = n.query(t);
					return r.catch(() => void 0), o = n, r;
				}), this.#n = e.execute().then(() => a).then(() => void 0);
				try {
					await this.#n;
				} catch (e) {
					throw this.close(), e;
				}
			} else {
				this.#t < 3 && await this.#n, this._getSqlCache().apply(n);
				let e = t.batch(this.#t >= 3), i;
				r = n.map((t) => {
					let n = e.step();
					i !== void 0 && n.condition(J.ok(i)), this.#t >= 3 && n.condition(J.not(J.isAutocommit(e)));
					let r = n.query(t);
					return r.catch(() => void 0), i = n, r;
				}), await e.execute();
			}
			let i = [];
			for (let e = 0; e < r.length; e++) try {
				let t = await r[e];
				if (t === void 0) throw new j("Statement in a transaction was not executed, probably because the transaction has been rolled back", e, "TRANSACTION_CLOSED");
				i.push(Yi(t));
			} catch (t) {
				if (t instanceof j) throw t;
				let n = Z(t);
				throw n instanceof A ? new j(n.message, e, n.code, n.extendedCode, n.rawCode, n.cause instanceof Error ? n.cause : void 0) : n;
			}
			return i;
		} catch (e) {
			throw Z(e);
		}
	}
	async executeMultiple(e) {
		let t = this._getStream();
		if (t.closed) throw new A("Cannot execute statements because the transaction is closed", "TRANSACTION_CLOSED");
		try {
			if (this.#n === void 0) {
				this.#n = t.run(P(this.#e)).then(() => void 0);
				try {
					await this.#n;
				} catch (e) {
					throw this.close(), e;
				}
			} else await this.#n;
			await t.sequence(e);
		} catch (e) {
			throw Z(e);
		}
	}
	async rollback() {
		try {
			let e = this._getStream();
			if (e.closed || this.#n === void 0) return;
			let t = e.run("ROLLBACK").catch((e) => {
				throw Z(e);
			});
			e.closeGracefully(), await t;
		} catch (e) {
			throw Z(e);
		} finally {
			this.close();
		}
	}
	async commit() {
		try {
			let e = this._getStream();
			if (e.closed) throw new A("Cannot commit the transaction because it is already closed", "TRANSACTION_CLOSED");
			if (this.#n !== void 0) await this.#n;
			else return;
			let t = e.run("COMMIT").catch((e) => {
				throw Z(e);
			});
			e.closeGracefully(), await t;
		} catch (e) {
			throw Z(e);
		} finally {
			this.close();
		}
	}
};
async function Ji(e, t, n, r, i = !1) {
	i && n.step().run("PRAGMA foreign_keys=off");
	let a = n.step(), o = a.run(P(e)), s = a, c = r.map((e) => {
		let r = n.step().condition(J.ok(s));
		t >= 3 && r.condition(J.not(J.isAutocommit(n)));
		let i = r.query(e);
		return s = r, i;
	}), l = n.step().condition(J.ok(s));
	t >= 3 && l.condition(J.not(J.isAutocommit(n)));
	let u = l.run("COMMIT");
	n.step().condition(J.not(J.ok(l))).run("ROLLBACK").catch((e) => void 0), i && n.step().run("PRAGMA foreign_keys=on"), await n.execute();
	let d = [];
	await o;
	for (let e = 0; e < c.length; e++) try {
		let t = await c[e];
		if (t === void 0) throw new j("Statement in a batch was not executed, probably because the transaction has been rolled back", e, "TRANSACTION_CLOSED");
		d.push(Yi(t));
	} catch (t) {
		if (t instanceof j) throw t;
		let n = Z(t);
		throw n instanceof A ? new j(n.message, e, n.code, n.extendedCode, n.rawCode, n.cause instanceof Error ? n.cause : void 0) : n;
	}
	return await u, d;
}
function X(e) {
	let t, n;
	Array.isArray(e) ? [t, n] = e : typeof e == "string" ? t = e : (t = e.sql, n = e.args);
	let r = new Nn(t);
	if (n) if (Array.isArray(n)) r.bindIndexes(n);
	else for (let [e, t] of Object.entries(n)) r.bindName(e, t);
	return r;
}
function Yi(e) {
	let t = e.columnNames.map((e) => e ?? ""), n = e.columnDecltypes.map((e) => e ?? ""), r = e.rows, i = e.affectedRowCount;
	return new ct(t, n, r, i, e.lastInsertRowid === void 0 ? void 0 : e.lastInsertRowid);
}
function Z(e) {
	if (e instanceof L) {
		let t = Xi(e);
		return new A(e.message, t, void 0, void 0, e);
	}
	return e;
}
function Xi(e) {
	return e instanceof nn && e.code !== void 0 ? e.code : e instanceof R ? "HRANA_PROTO_ERROR" : e instanceof z ? e.cause instanceof L ? Xi(e.cause) : "HRANA_CLOSED_ERROR" : e instanceof an ? "HRANA_WEBSOCKET_ERROR" : e instanceof on ? "SERVER_ERROR" : e instanceof sn ? "PROTOCOL_VERSION_ERROR" : e instanceof B ? "INTERNAL_ERROR" : "UNKNOWN";
}
//#endregion
//#region node_modules/@libsql/client/lib-esm/sql_cache.js
var Zi = class {
	#e;
	#t;
	capacity;
	constructor(e, t) {
		this.#e = e, this.#t = new Qi(), this.capacity = t;
	}
	apply(e) {
		if (this.capacity <= 0) return;
		let t = /* @__PURE__ */ new Set();
		for (let n of e) {
			if (typeof n.sql != "string") continue;
			let e = n.sql;
			if (e.length >= 5e3) continue;
			let r = this.#t.get(e);
			if (r === void 0) {
				for (; this.#t.size + 1 > this.capacity;) {
					let [e, n] = this.#t.peekLru();
					if (t.has(n)) break;
					n.close(), this.#t.delete(e);
				}
				this.#t.size + 1 <= this.capacity && (r = this.#e.storeSql(e), this.#t.set(e, r));
			}
			r !== void 0 && (n.sql = r, t.add(r));
		}
	}
}, Qi = class {
	#e;
	constructor() {
		this.#e = /* @__PURE__ */ new Map();
	}
	get(e) {
		let t = this.#e.get(e);
		return t !== void 0 && (this.#e.delete(e), this.#e.set(e, t)), t;
	}
	set(e, t) {
		this.#e.set(e, t);
	}
	peekLru() {
		for (let e of this.#e.entries()) return e;
	}
	delete(e) {
		this.#e.delete(e);
	}
	get size() {
		return this.#e.size;
	}
}, $i = /* @__PURE__ */ y((/* @__PURE__ */ g(((e, t) => {
	function n(e) {
		var t = 0, n = [];
		function r() {
			t--, t < e && i();
		}
		function i() {
			var e = n.shift();
			s.queue = n.length, e && o(e.fn).then(e.resolve).catch(e.reject);
		}
		function a(e) {
			return new Promise(function(t, r) {
				n.push({
					fn: e,
					resolve: t,
					reject: r
				}), s.queue = n.length;
			});
		}
		function o(e) {
			t++;
			try {
				return Promise.resolve(e()).then(function(e) {
					return r(), e;
				}, function(e) {
					throw r(), e;
				});
			} catch (e) {
				return r(), Promise.reject(e);
			}
		}
		var s = function(n) {
			return t >= e ? a(n) : o(n);
		};
		return s;
	}
	function r(e, t) {
		var n = !1, r = this;
		return Promise.all(e.map(function() {
			var e = arguments;
			return r(function() {
				if (!n) return t.apply(void 0, e).catch(function(e) {
					throw n = !0, e;
				});
			});
		}));
	}
	function i(e) {
		return e.queue = 0, e.map = r, e;
	}
	t.exports = function(e) {
		return i(e ? n(e) : function(e) {
			return e();
		});
	};
})))(), 1);
function ea(e) {
	if (e.scheme !== "wss" && e.scheme !== "ws") throw new A(`The WebSocket client supports only "libsql:", "wss:" and "ws:" URLs, got ${JSON.stringify(e.scheme + ":")}. For more information, please read ${st}`, "URL_SCHEME_NOT_SUPPORTED");
	if (e.encryptionKey !== void 0) throw new A("Encryption key is not supported by the remote client.", "ENCRYPTION_KEY_NOT_SUPPORTED");
	if (e.scheme === "ws" && e.tls) throw new A("A \"ws:\" URL cannot opt into TLS by using ?tls=1", "URL_INVALID");
	if (e.scheme === "wss" && !e.tls) throw new A("A \"wss:\" URL cannot opt out of TLS by using ?tls=0", "URL_INVALID");
	let t = xe(e.scheme, e.authority, e.path), n;
	try {
		n = Gi(t, e.authToken);
	} catch (t) {
		if (t instanceof rn) {
			let t = e.scheme === "wss" ? "https" : "http", n = xe(t, e.authority, e.path);
			throw new A(`This environment does not support WebSockets, please switch to the HTTP client by using a "${t}:" URL (${JSON.stringify(n)}). For more information, please read ${st}`, "WEBSOCKETS_NOT_SUPPORTED");
		}
		throw Z(t);
	}
	return new ra(n, t, e.authToken, e.intMode, e.concurrency);
}
var ta = 60 * 1e3, na = 100, ra = class {
	#e;
	#t;
	#n;
	#r;
	#i;
	closed;
	protocol;
	#a;
	constructor(e, t, n, r, i) {
		this.#e = t, this.#t = n, this.#n = r, this.#r = this.#s(e), this.#i = void 0, this.closed = !1, this.protocol = "ws", this.#a = (0, $i.default)(i);
	}
	async limit(e) {
		return this.#a(e);
	}
	async execute(e, t) {
		let n;
		return n = typeof e == "string" ? {
			sql: e,
			args: t || []
		} : e, this.limit(async () => {
			let e = await this.#o();
			try {
				let t = X(n);
				e.conn.sqlCache.apply([t]);
				let r = e.stream.query(t);
				return e.stream.closeGracefully(), Yi(await r);
			} catch (e) {
				throw Z(e);
			} finally {
				this._closeStream(e);
			}
		});
	}
	async batch(e, t = "deferred") {
		return this.limit(async () => {
			let n = await this.#o();
			try {
				let r = e.map((e) => Array.isArray(e) ? {
					sql: e[0],
					args: e[1] || []
				} : e).map(X), i = await n.conn.client.getVersion();
				return n.conn.sqlCache.apply(r), await Ji(t, i, n.stream.batch(i >= 3), r);
			} catch (e) {
				throw Z(e);
			} finally {
				this._closeStream(n);
			}
		});
	}
	async migrate(e) {
		return this.limit(async () => {
			let t = await this.#o();
			try {
				let n = e.map(X), r = await t.conn.client.getVersion();
				return await Ji("deferred", r, t.stream.batch(r >= 3), n, !0);
			} catch (e) {
				throw Z(e);
			} finally {
				this._closeStream(t);
			}
		});
	}
	async transaction(e = "write") {
		return this.limit(async () => {
			let t = await this.#o();
			try {
				let n = await t.conn.client.getVersion();
				return new ia(this, t, e, n);
			} catch (e) {
				throw this._closeStream(t), Z(e);
			}
		});
	}
	async executeMultiple(e) {
		return this.limit(async () => {
			let t = await this.#o();
			try {
				let n = t.stream.sequence(e);
				t.stream.closeGracefully(), await n;
			} catch (e) {
				throw Z(e);
			} finally {
				this._closeStream(t);
			}
		});
	}
	sync() {
		throw new A("sync not supported in ws mode", "SYNC_NOT_SUPPORTED");
	}
	async #o() {
		if (this.closed) throw new A("The client is closed", "CLIENT_CLOSED");
		if ((/* @__PURE__ */ new Date()).valueOf() - this.#r.openTime.valueOf() > ta && this.#i === void 0) {
			let e = this.#s();
			this.#i = e, e.client.getVersion().then((t) => {
				this.#r !== e && this.#r.streamStates.size === 0 && this.#r.client.close(), this.#r = e, this.#i = void 0;
			}, (e) => {
				this.#i = void 0;
			});
		}
		if (this.#r.client.closed) try {
			this.#i === void 0 ? this.#r = this.#s() : this.#r = this.#i;
		} catch (e) {
			throw Z(e);
		}
		let e = this.#r;
		try {
			e.useSqlCache === void 0 && (e.useSqlCache = await e.client.getVersion() >= 2, e.useSqlCache && (e.sqlCache.capacity = na));
			let t = e.client.openStream();
			t.intMode = this.#n;
			let n = {
				conn: e,
				stream: t
			};
			return e.streamStates.add(n), n;
		} catch (e) {
			throw Z(e);
		}
	}
	#s(e) {
		try {
			return e ??= Gi(this.#e, this.#t), {
				client: e,
				useSqlCache: void 0,
				sqlCache: new Zi(e, 0),
				openTime: /* @__PURE__ */ new Date(),
				streamStates: /* @__PURE__ */ new Set()
			};
		} catch (e) {
			throw Z(e);
		}
	}
	async reconnect() {
		try {
			for (let e of Array.from(this.#r.streamStates)) try {
				e.stream.close();
			} catch {}
			this.#r.client.close();
		} catch {}
		if (this.#i) {
			try {
				this.#i.client.close();
			} catch {}
			this.#i = void 0;
		}
		let e = this.#s();
		e.useSqlCache = await e.client.getVersion() >= 2, e.useSqlCache && (e.sqlCache.capacity = na), this.#r = e, this.closed = !1;
	}
	_closeStream(e) {
		e.stream.close();
		let t = e.conn;
		t.streamStates.delete(e), t.streamStates.size === 0 && t !== this.#r && t.client.close();
	}
	close() {
		if (this.#r.client.close(), this.closed = !0, this.#i) {
			try {
				this.#i.client.close();
			} catch {}
			this.#i = void 0;
		}
		this.closed = !0;
	}
}, ia = class extends qi {
	#e;
	#t;
	constructor(e, t, n, r) {
		super(n, r), this.#e = e, this.#t = t;
	}
	_getStream() {
		return this.#t.stream;
	}
	_getSqlCache() {
		return this.#t.conn.sqlCache;
	}
	close() {
		this.#e._closeStream(this.#t);
	}
	get closed() {
		return this.#t.stream.closed;
	}
};
//#endregion
//#region node_modules/@libsql/client/lib-esm/http.js
function aa(e) {
	if (e.scheme !== "https" && e.scheme !== "http") throw new A(`The HTTP client supports only "libsql:", "https:" and "http:" URLs, got ${JSON.stringify(e.scheme + ":")}. For more information, please read ${st}`, "URL_SCHEME_NOT_SUPPORTED");
	if (e.encryptionKey !== void 0) throw new A("Encryption key is not supported by the remote client.", "ENCRYPTION_KEY_NOT_SUPPORTED");
	if (e.scheme === "http" && e.tls) throw new A("A \"http:\" URL cannot opt into TLS by using ?tls=1", "URL_INVALID");
	if (e.scheme === "https" && !e.tls) throw new A("A \"https:\" URL cannot opt out of TLS by using ?tls=0", "URL_INVALID");
	return new sa(xe(e.scheme, e.authority, e.path), e.authToken, e.intMode, e.fetch, e.concurrency, e.remoteEncryptionKey);
}
var oa = 30, sa = class {
	#e;
	protocol;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	constructor(e, t, n, r, i, a) {
		this.#t = e, this.#a = t, this.#n = n, this.#r = r, this.#i = i, this.#o = a, this.#e = Ki(this.#t, this.#a, this.#r, a), this.#e.intMode = this.#n, this.protocol = "http", this.#s = (0, $i.default)(this.#i);
	}
	async limit(e) {
		return this.#s(e);
	}
	async execute(e, t) {
		let n;
		return n = typeof e == "string" ? {
			sql: e,
			args: t || []
		} : e, this.limit(async () => {
			try {
				let e = X(n), t, r = this.#e.openStream();
				try {
					t = r.query(e);
				} finally {
					r.closeGracefully();
				}
				return Yi(await t);
			} catch (e) {
				throw Z(e);
			}
		});
	}
	async batch(e, t = "deferred") {
		return this.limit(async () => {
			try {
				let n = e.map((e) => Array.isArray(e) ? {
					sql: e[0],
					args: e[1] || []
				} : e).map(X), r = await this.#e.getVersion(), i, a = this.#e.openStream();
				try {
					new Zi(a, oa).apply(n), i = Ji(t, r, a.batch(!1), n);
				} finally {
					a.closeGracefully();
				}
				return await i;
			} catch (e) {
				throw Z(e);
			}
		});
	}
	async migrate(e) {
		return this.limit(async () => {
			try {
				let t = e.map(X), n = await this.#e.getVersion(), r, i = this.#e.openStream();
				try {
					r = Ji("deferred", n, i.batch(!1), t, !0);
				} finally {
					i.closeGracefully();
				}
				return await r;
			} catch (e) {
				throw Z(e);
			}
		});
	}
	async transaction(e = "write") {
		return this.limit(async () => {
			try {
				let t = await this.#e.getVersion();
				return new ca(this.#e.openStream(), e, t);
			} catch (e) {
				throw Z(e);
			}
		});
	}
	async executeMultiple(e) {
		return this.limit(async () => {
			try {
				let t, n = this.#e.openStream();
				try {
					t = n.sequence(e);
				} finally {
					n.closeGracefully();
				}
				await t;
			} catch (e) {
				throw Z(e);
			}
		});
	}
	sync() {
		throw new A("sync not supported in http mode", "SYNC_NOT_SUPPORTED");
	}
	close() {
		this.#e.close();
	}
	async reconnect() {
		try {
			this.closed || this.#e.close();
		} finally {
			this.#e = Ki(this.#t, this.#a, this.#r, this.#o), this.#e.intMode = this.#n;
		}
	}
	get closed() {
		return this.#e.closed;
	}
}, ca = class extends qi {
	#e;
	#t;
	constructor(e, t, n) {
		super(t, n), this.#e = e, this.#t = new Zi(e, oa);
	}
	_getStream() {
		return this.#e;
	}
	_getSqlCache() {
		return this.#t;
	}
	close() {
		this.#e.close();
	}
	get closed() {
		return this.#e.closed;
	}
};
//#endregion
//#region node_modules/@libsql/client/lib-esm/node.js
function la(e) {
	return ua(pt(e, !0));
}
function ua(e) {
	return e.scheme === "wss" || e.scheme === "ws" ? ea(e) : e.scheme === "https" || e.scheme === "http" ? aa(e) : xt(e);
}
//#endregion
//#region electron/agent-handler.ts
async function da(e, t) {
	let { type: n } = e;
	switch (n) {
		case "AGENT_HELLO":
			t.ulid = e.ulid ?? t.ulid, k.default.info(`AGENT_HELLO from ulid=${t.ulid} name=${e.name}`), t.send({
				type: "AGENT_HELLO_ACK",
				ulid: t.ulid,
				ts: Date.now()
			}), Q({
				type: "agent:hello",
				ulid: t.ulid,
				payload: e
			});
			return;
		case "HEARTBEAT":
			Q({
				type: "agent:heartbeat",
				ulid: t.ulid,
				ts: Date.now()
			});
			return;
		case "AGENT_STATE":
			Q({
				type: "agent:state",
				ulid: t.ulid,
				payload: e
			});
			return;
		case "PERMISSION_REQUEST": {
			k.default.info(`PERMISSION_REQUEST from ulid=${t.ulid} action=${e.action}`);
			let n = `pr-${Date.now().toString(36)}`;
			t.send({
				type: "PERMISSION_REQUEST_ACK",
				id: n
			}), Q({
				type: "permission:request",
				id: n,
				ulid: t.ulid,
				action: e.action,
				toolName: e.toolName ?? null,
				args: e.args ?? null,
				ts: Date.now()
			});
			return;
		}
		case "INTER_AGENT_MESSAGE":
			k.default.info(`INTER_AGENT_MESSAGE from ulid=${t.ulid} to=${e.to}`), Q({
				type: "agent:message",
				from: t.ulid,
				to: e.to,
				body: e.body,
				ts: Date.now()
			});
			return;
		case "TICKET_PROPOSAL":
			k.default.info(`TICKET_PROPOSAL from ulid=${t.ulid}`), Q({
				type: "ticket:proposal",
				ulid: t.ulid,
				proposal: e.proposal,
				ts: Date.now()
			});
			return;
		case "SUBAGENT_SPAWN_REQUEST":
			k.default.info(`SUBAGENT_SPAWN_REQUEST from ulid=${t.ulid} kind=${e.kind}`), Q({
				type: "subagent:spawn-request",
				ulid: t.ulid,
				name: e.name,
				kind: e.kind,
				description: e.description,
				ts: Date.now()
			});
			return;
		default: k.default.warn(`WS: unknown message type: ${n}`);
	}
}
function Q(e) {
	let n = t.getAllWindows();
	for (let t of n) if (!t.isDestroyed()) try {
		t.webContents.send("ws:event", e);
	} catch (e) {
		k.default.warn(`WS: failed to send to renderer: ${e}`);
	}
}
//#endregion
//#region electron/ws-server.ts
var fa = 7711, pa = 6e4, ma = null, ha = /* @__PURE__ */ new Map();
function ga() {
	let e = Date.now();
	for (let [t, n] of ha.entries()) if (e - n.lastSeen > pa) {
		k.default.info(`WS: dropping silent client (ulid=${n.ulid ?? "?"})`);
		try {
			t.terminate();
		} catch {}
		ha.delete(t);
	}
}
function _a() {
	ma || (ma = new en.default({
		port: fa,
		host: "127.0.0.1"
	}), k.default.info(`WS server listening on ws://127.0.0.1:${fa}`), ma.on("connection", (e) => {
		let t = {
			ws: e,
			lastSeen: Date.now()
		};
		ha.set(e, t), k.default.info("WS: client connected"), e.on("message", async (n) => {
			t.lastSeen = Date.now();
			let r;
			try {
				r = JSON.parse(n.toString());
			} catch (e) {
				k.default.warn(`WS: invalid JSON: ${e}`);
				return;
			}
			if (!r.type) {
				k.default.warn("WS: message missing type");
				return;
			}
			r.ulid && (t.ulid = r.ulid);
			try {
				await da(r, {
					ulid: t.ulid,
					send: (t) => e.send(JSON.stringify(t))
				});
			} catch (e) {
				k.default.error(`WS: handler error: ${e}`);
			}
		}), e.on("close", () => {
			ha.delete(e), k.default.info(`WS: client disconnected (ulid=${t.ulid ?? "?"})`);
		}), e.on("error", (e) => {
			k.default.error(`WS: socket error: ${e.message}`);
		});
	}), setInterval(ga, 1e4).unref());
}
function va() {
	if (ma) {
		for (let e of ha.keys()) try {
			e.close();
		} catch {}
		ha.clear(), ma.close(), ma = null;
	}
}
//#endregion
//#region electron/main.ts
var ya = i(o(import.meta.url));
k.default.initialize(), k.default.info("Superhive starting...");
var $ = null;
function ba() {
	$ && ($.isMaximized() ? $.unmaximize() : $.maximize());
}
function xa() {
	$ = new t({
		width: 1200,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		title: "Superhive",
		backgroundColor: "#151110",
		titleBarStyle: "hidden",
		trafficLightPosition: {
			x: 16,
			y: 18
		},
		show: !1,
		webPreferences: {
			preload: a(ya, "preload.js"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	}), $.maximize(), $.show(), $.on("maximize", () => {
		$?.webContents.send("window:maximized-changed", !0);
	}), $.on("unmaximize", () => {
		$?.webContents.send("window:maximized-changed", !1);
	}), process.env.VITE_DEV_SERVER_URL ? (k.default.info("Loading dev server:", process.env.VITE_DEV_SERVER_URL), $.loadURL(process.env.VITE_DEV_SERVER_URL)) : (k.default.info("Loading production build"), $.loadFile(a(ya, "../dist/index.html"))), $.on("closed", () => {
		$ = null;
	});
}
r.handle("window:toggle-maximize", () => {
	ba();
}), r.handle("app:get-data-dir", () => n.getPath("userData")), r.handle("settings:read", () => {
	let e = a(n.getPath("userData"), ".superhive", "settings.json");
	try {
		if (s.existsSync(e)) return s.readFileSync(e, "utf-8");
	} catch (e) {
		k.default.error("Failed to read settings:", e);
	}
	return null;
}), r.handle("settings:write", (e, t) => {
	let r = a(n.getPath("userData"), ".superhive"), i = a(r, "settings.json");
	try {
		return s.existsSync(r) || s.mkdirSync(r, { recursive: !0 }), s.writeFileSync(i, t, "utf-8"), !0;
	} catch (e) {
		return k.default.error("Failed to write settings:", e), !1;
	}
});
var Sa = null;
async function Ca() {
	if (Sa) return Sa;
	let e = a(n.getPath("userData"), ".superhive");
	s.existsSync(e) || s.mkdirSync(e, { recursive: !0 });
	let t = process.env.LIBSQL_URL ?? `file:${a(e, "data.db")}`;
	return Sa = la({ url: t }), k.default.info("libSQL DB opened:", t.startsWith("file:") ? t.replace("file:", "") : t), Sa;
}
r.handle("db:query", async (e, t, n) => {
	try {
		return { rows: (await (await Ca()).execute({
			sql: t,
			args: n ?? []
		})).rows ?? [] };
	} catch (e) {
		throw k.default.debug("db:query error:", e), e;
	}
}), r.handle("db:execute", async (e, t, n) => {
	try {
		let e = await (await Ca()).execute({
			sql: t,
			args: n ?? []
		});
		return {
			rowsAffected: e.rowsAffected,
			lastInsertRowid: e.lastInsertRowid
		};
	} catch (e) {
		throw k.default.debug("db:execute error:", e), e;
	}
}), r.handle("db:batch", async (e, t) => {
	try {
		await (await Ca()).batch(t.map((e) => ({
			sql: e.sql,
			args: e.args ?? []
		})));
	} catch (e) {
		throw k.default.debug("db:batch error:", e), e;
	}
}), r.handle("agents:terminate-all", () => (k.default.info("Terminating all agent processes (best-effort)"), !0)), r.handle("agents:terminate", (e, t) => (k.default.info(`Terminating agent process: ${t}`), !0)), n.whenReady().then(() => {
	k.default.info("App ready"), _a(), xa(), n.on("activate", () => {
		t.getAllWindows().length === 0 && xa();
	});
}), n.on("window-all-closed", () => {
	k.default.info("All windows closed"), va(), process.platform !== "darwin" && n.quit();
}), process.on("uncaughtException", (e) => {
	k.default.error("Uncaught exception:", e);
}), process.on("unhandledRejection", (e) => {
	k.default.error("Unhandled rejection:", e);
});
//#endregion
export {};
