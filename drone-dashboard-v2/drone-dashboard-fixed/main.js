const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startServer } = require('./server');

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "AeroDash Drone Monitor",
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // Remove the default menu bar for a cleaner app feel
  mainWindow.setMenuBarVisibility(false);

  // Load the local Next.js server
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // Start Next.js server first
    await startServer();
    createWindow();
  } catch (err) {
    console.error('Failed to start server:', err);
    app.quit();
  }

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
