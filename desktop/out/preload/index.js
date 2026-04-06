"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  platform: process.platform,
  runPython: (code) => electron.ipcRenderer.invoke("python:run", code),
  checkPython: () => electron.ipcRenderer.invoke("python:check"),
  // Serial port
  serialList: () => electron.ipcRenderer.invoke("serial:list"),
  serialOpen: (opts) => electron.ipcRenderer.invoke("serial:open", opts),
  serialWrite: (data) => electron.ipcRenderer.invoke("serial:write", data),
  serialClose: () => electron.ipcRenderer.invoke("serial:close"),
  onSerialData: (cb) => {
    const handler = (_, line) => cb(line);
    electron.ipcRenderer.on("serial:data", handler);
    return () => electron.ipcRenderer.removeListener("serial:data", handler);
  },
  onSerialError: (cb) => {
    const handler = (_, msg) => cb(msg);
    electron.ipcRenderer.on("serial:error", handler);
    return () => electron.ipcRenderer.removeListener("serial:error", handler);
  },
  onSerialClosed: (cb) => {
    const handler = () => cb();
    electron.ipcRenderer.on("serial:closed", handler);
    return () => electron.ipcRenderer.removeListener("serial:closed", handler);
  },
  // STM32 Programmer
  stm32FindCli: () => electron.ipcRenderer.invoke("stm32:findCli"),
  stm32BrowseCli: () => electron.ipcRenderer.invoke("stm32:browseCli"),
  stm32SetCli: (path) => electron.ipcRenderer.invoke("stm32:setCli", path),
  stm32SelectFile: () => electron.ipcRenderer.invoke("stm32:selectFile"),
  stm32Run: (args) => electron.ipcRenderer.invoke("stm32:run", args),
  onStm32Log: (cb) => {
    const handler = (_, entry) => cb(entry);
    electron.ipcRenderer.on("stm32:log", handler);
    return () => electron.ipcRenderer.removeListener("stm32:log", handler);
  }
});
