const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Folder selection
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // File operations
  selectCoverImage: () => ipcRenderer.invoke('select-cover-image'),
  selectCoverSavePath: () => ipcRenderer.invoke('select-cover-save-path'),
  isDirectory: (path) => ipcRenderer.invoke('is-directory', path),
  readFileAsBase64: (filePath) => ipcRenderer.invoke('read-file-as-base64', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  processDroppedPath: (droppedPath) => ipcRenderer.invoke('process-dropped-path', droppedPath),

  // Audio file operations
  getAudioFiles: (folderPath, recursive) => ipcRenderer.invoke('get-audio-files', folderPath, recursive),
  getFileMetadata: (filePath) => ipcRenderer.invoke('get-file-metadata', filePath),
  extractCover: (filePath, outputPath) => ipcRenderer.invoke('extract-cover', filePath, outputPath),

  // M4B Creation
  createM4B: (folderData, outputPath, options) => ipcRenderer.invoke('create-m4b', folderData, outputPath, options),

  // Progress updates
  onProgress: (callback) => ipcRenderer.on('progress-update', (_event, ...args) => callback(...args)),
  onLog: (callback) => ipcRenderer.on('log-message', (_event, ...args) => callback(...args)),

  // Drag & Drop support
  onFolderDropped: (callback) => ipcRenderer.on('folder-dropped', (_event, ...args) => callback(...args)),
});
