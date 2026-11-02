const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('smartALU', {
    platform: process.platform
});