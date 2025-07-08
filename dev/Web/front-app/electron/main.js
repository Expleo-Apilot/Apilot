const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Create a basic window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    // You can keep the icon
    icon: path.join(__dirname, isDev ? '../public/ApiLot.ico' : '../public/ApiLot.ico'),
  });

  // Load the app
  const appPath = isDev 
    ? 'http://localhost:4200' 
    : `file://${path.join(__dirname, '../dist/front-app/browser/index.html')}`;
  
  mainWindow.loadURL(appPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
