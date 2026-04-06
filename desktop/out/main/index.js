"use strict";
const electron = require("electron");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const serialport = require("serialport");
const require$$0 = require("stream");
var dist$1 = {};
var dist = {};
Object.defineProperty(dist, "__esModule", { value: true });
dist.DelimiterParser = void 0;
const stream_1 = require$$0;
class DelimiterParser extends stream_1.Transform {
  includeDelimiter;
  delimiter;
  buffer;
  constructor({ delimiter, includeDelimiter = false, ...options }) {
    super(options);
    if (delimiter === void 0) {
      throw new TypeError('"delimiter" is not a bufferable object');
    }
    if (delimiter.length === 0) {
      throw new TypeError('"delimiter" has a 0 or undefined length');
    }
    this.includeDelimiter = includeDelimiter;
    this.delimiter = Buffer.from(delimiter);
    this.buffer = Buffer.alloc(0);
  }
  _transform(chunk, encoding, cb) {
    let data = Buffer.concat([this.buffer, chunk]);
    let position;
    while ((position = data.indexOf(this.delimiter)) !== -1) {
      this.push(data.slice(0, position + (this.includeDelimiter ? this.delimiter.length : 0)));
      data = data.slice(position + this.delimiter.length);
    }
    this.buffer = data;
    cb();
  }
  _flush(cb) {
    this.push(this.buffer);
    this.buffer = Buffer.alloc(0);
    cb();
  }
}
dist.DelimiterParser = DelimiterParser;
Object.defineProperty(dist$1, "__esModule", { value: true });
var ReadlineParser_1 = dist$1.ReadlineParser = void 0;
const parser_delimiter_1 = dist;
class ReadlineParser extends parser_delimiter_1.DelimiterParser {
  constructor(options) {
    const opts = {
      delimiter: Buffer.from("\n", "utf8"),
      encoding: "utf8",
      ...options
    };
    if (typeof opts.delimiter === "string") {
      opts.delimiter = Buffer.from(opts.delimiter, opts.encoding);
    }
    super(opts);
  }
}
ReadlineParser_1 = dist$1.ReadlineParser = ReadlineParser;
const isDev = !electron.app.isPackaged;
let activePort = null;
let activeParser = null;
electron.ipcMain.handle("serial:list", async () => {
  const ports = await serialport.SerialPort.list();
  return ports.map((p) => ({ path: p.path, manufacturer: p.manufacturer || "", vendorId: p.vendorId || "" }));
});
electron.ipcMain.handle("serial:open", (_, { path: path2, baudRate }) => {
  return new Promise((resolve) => {
    if (activePort?.isOpen) {
      activePort.close(() => {
        activePort = null;
        activeParser = null;
        openPort(path2, baudRate, resolve);
      });
    } else {
      openPort(path2, baudRate, resolve);
    }
  });
});
function openPort(path2, baudRate, resolve) {
  activePort = new serialport.SerialPort({ path: path2, baudRate: parseInt(baudRate), autoOpen: false });
  activeParser = activePort.pipe(new ReadlineParser_1({ delimiter: "\r\n" }));
  activeParser.on("data", (line) => {
    const wins = electron.BrowserWindow.getAllWindows();
    wins.forEach((w) => w.webContents.send("serial:data", line));
  });
  activePort.on("error", (err) => {
    const wins = electron.BrowserWindow.getAllWindows();
    wins.forEach((w) => w.webContents.send("serial:error", err.message));
  });
  activePort.on("close", () => {
    const wins = electron.BrowserWindow.getAllWindows();
    wins.forEach((w) => w.webContents.send("serial:closed"));
    activePort = null;
    activeParser = null;
  });
  activePort.open((err) => {
    if (err) resolve({ ok: false, error: err.message });
    else resolve({ ok: true });
  });
}
electron.ipcMain.handle("serial:write", (_, data) => {
  if (!activePort?.isOpen) return { ok: false, error: "Port not open" };
  return new Promise((resolve) => {
    activePort.write(data + "\r\n", (err) => {
      if (err) resolve({ ok: false, error: err.message });
      else resolve({ ok: true });
    });
  });
});
electron.ipcMain.handle("serial:close", () => {
  return new Promise((resolve) => {
    if (!activePort?.isOpen) return resolve({ ok: true });
    activePort.close((err) => {
      activePort = null;
      activeParser = null;
      if (err) resolve({ ok: false, error: err.message });
      else resolve({ ok: true });
    });
  });
});
electron.ipcMain.handle("python:run", (_, code) => {
  return new Promise((resolve) => {
    const py = child_process.spawn("python", ["-u", "-c", code], {
      timeout: 6e4,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" }
    });
    let stdout = "";
    let stderr = "";
    py.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    py.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    py.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
    py.on("error", (err) => {
      resolve({ stdout: "", stderr: err.message, exitCode: 1 });
    });
  });
});
electron.ipcMain.handle("python:check", () => {
  return new Promise((resolve) => {
    const py = child_process.spawn("python", ["--version"]);
    let version = "";
    py.stdout.on("data", (data) => {
      version += data.toString();
    });
    py.stderr.on("data", (data) => {
      version += data.toString();
    });
    py.on("close", (code) => resolve(code === 0 ? version.trim() : null));
    py.on("error", () => resolve(null));
  });
});
const STM32_CLI_PATHS = process.platform === "win32" ? [
  "STM32_Programmer_CLI.exe",
  "C:\\Program Files\\STMicroelectronics\\STM32Cube\\STM32CubeProgrammer\\bin\\STM32_Programmer_CLI.exe",
  "C:\\Program Files (x86)\\STMicroelectronics\\STM32Cube\\STM32CubeProgrammer\\bin\\STM32_Programmer_CLI.exe"
] : [
  "STM32_Programmer_CLI",
  `/home/${process.env.USER}/STMicroelectronics/STM32Cube/STM32CubeProgrammer/bin/STM32_Programmer_CLI`,
  "/usr/local/bin/STM32_Programmer_CLI",
  "/opt/st/stm32cube/STM32CubeProgrammer/bin/STM32_Programmer_CLI"
];
let stm32CliPath = null;
electron.ipcMain.handle("stm32:findCli", async () => {
  for (const p of STM32_CLI_PATHS) {
    if (fs.existsSync(p)) {
      stm32CliPath = p;
      return { found: true, path: p };
    }
    try {
      const r = child_process.spawnSync(p, ["--version"], { timeout: 3e3 });
      if (!r.error) {
        stm32CliPath = p;
        return { found: true, path: p };
      }
    } catch {
    }
  }
  return { found: false, path: null };
});
electron.ipcMain.handle("stm32:setCli", (_, path2) => {
  stm32CliPath = path2;
  return { ok: true };
});
electron.ipcMain.handle("stm32:browseCli", async () => {
  const res = await electron.dialog.showOpenDialog({
    title: "Locate STM32_Programmer_CLI",
    filters: process.platform === "win32" ? [{ name: "Executable", extensions: ["exe"] }] : [{ name: "All Files", extensions: ["*"] }],
    properties: ["openFile"]
  });
  if (res.canceled || !res.filePaths.length) return { canceled: true };
  stm32CliPath = res.filePaths[0];
  return { canceled: false, path: stm32CliPath };
});
electron.ipcMain.handle("stm32:selectFile", async () => {
  const res = await electron.dialog.showOpenDialog({
    title: "Select Firmware File",
    filters: [{ name: "Firmware", extensions: ["bin", "hex", "elf"] }, { name: "All Files", extensions: ["*"] }],
    properties: ["openFile"]
  });
  if (res.canceled || !res.filePaths.length) return { canceled: true };
  return { canceled: false, path: res.filePaths[0] };
});
electron.ipcMain.handle("stm32:run", (_, args) => {
  return new Promise((resolve) => {
    if (!stm32CliPath) {
      resolve({ ok: false, error: "CLI not configured" });
      return;
    }
    const wins = electron.BrowserWindow.getAllWindows();
    const sendLog = (text, type) => wins.forEach((w) => w.webContents.send("stm32:log", { text, type }));
    sendLog(`$ ${[stm32CliPath, ...args].join(" ")}`, "cmd");
    const proc = child_process.spawn(stm32CliPath, args, { env: process.env });
    proc.stdout.on("data", (d) => d.toString().split("\n").filter(Boolean).forEach((l) => sendLog(l, "info")));
    proc.stderr.on("data", (d) => d.toString().split("\n").filter(Boolean).forEach((l) => sendLog(l, "err")));
    proc.on("close", (code) => {
      sendLog(`Exited with code ${code}`, code === 0 ? "ok" : "err");
      resolve({ ok: code === 0, exitCode: code });
    });
    proc.on("error", (err) => {
      sendLog(`Error: ${err.message}`, "err");
      resolve({ ok: false, error: err.message });
    });
  });
});
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: "AKS CRM Dashboard",
    icon: isDev ? path.join(__dirname, "../../src/main/aks_logo.png") : path.join(__dirname, "aks_logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.on("ready-to-show", () => {
    win.show();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
