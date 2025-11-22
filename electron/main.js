const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Enable drag & drop from file system
    },
    backgroundColor: '#1e40af',
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Prevent navigation when files are dropped
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  // Handle file drops on the entire window
  mainWindow.webContents.on('did-attach-webview', () => {
    mainWindow.webContents.session.on('will-download', (event, item) => {
      event.preventDefault();
    });
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist-web/index.html'));
  }
}

// IPC Handlers

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Select cover image dialog
ipcMain.handle('select-cover-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Select cover save path dialog
ipcMain.handle('select-cover-save-path', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'PNG Images', extensions: ['png'] },
      { name: 'JPEG Images', extensions: ['jpg', 'jpeg'] },
      { name: 'All Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif'] }
    ],
    defaultPath: 'cover.png'
  });

  if (result.canceled) {
    return null;
  }

  return result.filePath;
});

// Read file as base64
ipcMain.handle('read-file-as-base64', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return data.toString('base64');
  } catch (error) {
    console.error('Error reading file as base64:', error);
    return null;
  }
});

// Delete file
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
});

// Check if path is directory
ipcMain.handle('is-directory', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.isDirectory();
  } catch (error) {
    console.error('Error checking if directory:', error);
    return false;
  }
});

// Process dropped folder path
ipcMain.handle('process-dropped-path', async (event, droppedPath) => {
  try {
    // Clean up the path - remove file:/// prefix and decode
    let cleanPath = droppedPath;

    if (cleanPath.startsWith('file:///')) {
      cleanPath = cleanPath.substring(8); // Remove 'file:///'
    } else if (cleanPath.startsWith('file://')) {
      cleanPath = cleanPath.substring(7); // Remove 'file://'
    }

    // Decode URI components
    cleanPath = decodeURIComponent(cleanPath);

    // Check if it's a directory
    const stats = fs.statSync(cleanPath);
    if (stats.isDirectory()) {
      return { success: true, path: cleanPath };
    } else {
      return { success: false, error: 'Not a directory' };
    }
  } catch (error) {
    console.error('Error processing dropped path:', error);
    return { success: false, error: error.message };
  }
});

// Get audio files from folder
ipcMain.handle('get-audio-files', async (event, folderPath, recursive) => {
  const audioExtensions = ['.mp3', '.m4a', '.m4b', '.aac', '.ogg', '.flac', '.wav', '.wma'];
  const files = [];

  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && recursive) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (audioExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }

  scanDirectory(folderPath);
  files.sort();

  return files;
});

// Get file metadata using ffprobe
ipcMain.handle('get-file-metadata', async (event, filePath) => {
  try {
    const ffprobeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    const { stdout } = await execPromise(ffprobeCommand);
    const data = JSON.parse(stdout);

    let metadata = {
      duration: 0,
      hasCover: false,
      tags: {}
    };

    if (data.format && data.format.duration) {
      metadata.duration = parseFloat(data.format.duration);
    }

    if (data.format && data.format.tags) {
      metadata.tags = data.format.tags;
    }

    if (data.streams) {
      for (const stream of data.streams) {
        if (stream.codec_type === 'video' || ['mjpeg', 'png', 'jpg'].includes(stream.codec_name)) {
          metadata.hasCover = true;
          break;
        }
      }
    }

    return metadata;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return { duration: 0, hasCover: false, tags: {} };
  }
});

// Extract cover from audio file
ipcMain.handle('extract-cover', async (event, filePath, outputPath) => {
  try {
    const extractCommand = `ffmpeg -i "${filePath}" -an -vcodec copy -y "${outputPath}"`;
    await execPromise(extractCommand);
    return { success: true };
  } catch (error) {
    console.error('Error extracting cover:', error);
    return { success: false, error: error.message };
  }
});

// Create M4B file
ipcMain.handle('create-m4b', async (event, folderData, outputPath, options) => {
  try {
    const tempDir = path.dirname(outputPath);
    const concatFile = path.join(tempDir, 'concat_list.txt');
    const metadataFile = path.join(tempDir, 'metadata.txt');
    let coverFile = null;

    // Send log message
    const sendLog = (message) => {
      if (mainWindow) {
        mainWindow.webContents.send('log-message', message);
      }
    };

    sendLog('Creating concatenation list...');

    // Create concat list
    const concatContent = folderData.files.map(f => {
      const safePath = f.path.replace(/\\/g, '/').replace(/'/g, "'\\''");
      return `file '${safePath}'`;
    }).join('\n');

    fs.writeFileSync(concatFile, concatContent, 'utf-8');

    sendLog('Processing cover art...');

    // Handle cover art
    if (folderData.coverArt) {
      // Custom cover provided (file path or base64 data URL)
      if (folderData.coverArt.startsWith('data:')) {
        // Base64 data URL
        coverFile = path.join(tempDir, 'cover.png');
        const base64Data = folderData.coverArt.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(coverFile, Buffer.from(base64Data, 'base64'));
      } else if (fs.existsSync(folderData.coverArt)) {
        // File path - copy it
        coverFile = path.join(tempDir, 'cover' + path.extname(folderData.coverArt));
        fs.copyFileSync(folderData.coverArt, coverFile);
        sendLog(`Using custom cover: ${path.basename(folderData.coverArt)}`);
      }
    } else {
      // Try to extract from first file with cover
      for (const file of folderData.files) {
        if (file.hasCover) {
          coverFile = path.join(tempDir, 'cover.png');
          const extractCmd = `ffmpeg -i "${file.path}" -an -vcodec png -y "${coverFile}"`;
          try {
            await execPromise(extractCmd);
            sendLog(`Cover extracted from: ${path.basename(file.path)}`);
            break;
          } catch (e) {
            console.error('Error extracting cover:', e);
          }
        }
      }
    }

    sendLog('Creating metadata file with chapters...');

    // Create metadata file
    let metadataContent = ';FFMETADATA1\n';

    // Add global metadata
    if (folderData.metadata.title) metadataContent += `title=${folderData.metadata.title}\n`;
    if (folderData.metadata.author) metadataContent += `artist=${folderData.metadata.author}\n`;
    if (folderData.metadata.album) metadataContent += `album=${folderData.metadata.album}\n`;
    if (folderData.metadata.year) {
      const year = folderData.metadata.year.split('-')[0]; // Extract year only
      metadataContent += `date=${year}\n`;
    }
    if (folderData.metadata.genre) metadataContent += `genre=${folderData.metadata.genre}\n`;

    // Add chapters
    let cumulativeTime = 0;
    for (let i = 0; i < folderData.files.length; i++) {
      const file = folderData.files[i];
      const chapterTitle = file.chapterName || `Chapter ${i + 1}`;

      metadataContent += `\n[CHAPTER]\n`;
      metadataContent += `TIMEBASE=1/1000\n`;
      metadataContent += `START=${Math.floor(cumulativeTime * 1000)}\n`;
      metadataContent += `END=${Math.floor((cumulativeTime + file.duration) * 1000)}\n`;
      metadataContent += `title=${chapterTitle}\n`;

      cumulativeTime += file.duration;
    }

    fs.writeFileSync(metadataFile, metadataContent, 'utf-8');

    sendLog('Creating M4B file...');

    // Build FFmpeg command
    let ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${concatFile}" -i "${metadataFile}"`;

    if (coverFile && fs.existsSync(coverFile)) {
      ffmpegCmd += ` -i "${coverFile}" -map 0:a -map 2:v -map_metadata 1`;

      if (options.copyAudio) {
        ffmpegCmd += ` -c:a copy -c:v copy`;
      } else {
        ffmpegCmd += ` -c:a aac -b:a 128k -c:v copy`;
      }

      ffmpegCmd += ` -disposition:v:0 attached_pic`;
    } else {
      ffmpegCmd += ` -map_metadata 1`;

      if (options.copyAudio) {
        ffmpegCmd += ` -c copy`;
      } else {
        ffmpegCmd += ` -c:a aac -b:a 128k`;
      }
    }

    ffmpegCmd += ` -metadata media_type=2 -metadata track=1`;
    ffmpegCmd += ` -brand "M4A " -f mp4 -movflags +faststart -y "${outputPath}"`;

    sendLog('FFmpeg is running...');

    // Execute FFmpeg
    await execPromise(ffmpegCmd);

    // Cleanup
    try {
      if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);
      if (fs.existsSync(metadataFile)) fs.unlinkSync(metadataFile);
      if (coverFile && fs.existsSync(coverFile)) fs.unlinkSync(coverFile);
    } catch (e) {
      console.error('Cleanup error:', e);
    }

    sendLog('M4B file created successfully!');

    return { success: true };
  } catch (error) {
    console.error('Error creating M4B:', error);
    if (mainWindow) {
      mainWindow.webContents.send('log-message', `Error: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
