import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  // Keycloak auth
  authLogin:   ()             => ipcRenderer.invoke('auth:login'),
  authRefresh: (refreshToken) => ipcRenderer.invoke('auth:refresh', refreshToken),
  authLogout:  (refreshToken) => ipcRenderer.invoke('auth:logout', refreshToken),
  runPython: (code) => ipcRenderer.invoke('python:run', code),
  checkPython: () => ipcRenderer.invoke('python:check'),
  // Serial port
  serialList: () => ipcRenderer.invoke('serial:list'),
  serialOpen: (opts) => ipcRenderer.invoke('serial:open', opts),
  serialWrite: (data) => ipcRenderer.invoke('serial:write', data),
  serialClose: () => ipcRenderer.invoke('serial:close'),
  onSerialData: (cb) => {
    const handler = (_, line) => cb(line)
    ipcRenderer.on('serial:data', handler)
    return () => ipcRenderer.removeListener('serial:data', handler)
  },
  onSerialError: (cb) => {
    const handler = (_, msg) => cb(msg)
    ipcRenderer.on('serial:error', handler)
    return () => ipcRenderer.removeListener('serial:error', handler)
  },
  onSerialClosed: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('serial:closed', handler)
    return () => ipcRenderer.removeListener('serial:closed', handler)
  },
  // STM32 Programmer
  stm32FindCli:   ()       => ipcRenderer.invoke('stm32:findCli'),
  stm32BrowseCli: ()       => ipcRenderer.invoke('stm32:browseCli'),
  stm32SetCli:    (path)   => ipcRenderer.invoke('stm32:setCli', path),
  stm32SelectFile:()       => ipcRenderer.invoke('stm32:selectFile'),
  stm32Run:       (args)   => ipcRenderer.invoke('stm32:run', args),
  onStm32Log: (cb) => {
    const handler = (_, entry) => cb(entry)
    ipcRenderer.on('stm32:log', handler)
    return () => ipcRenderer.removeListener('stm32:log', handler)
  },
})
