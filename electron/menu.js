const { Menu, shell } = require('electron');

function createMenu(mainWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Database Settings',
          click: () => {
            // Send message to renderer to open database settings
            if (mainWindow) {
              mainWindow.webContents.send('open-db-settings');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Ctrl+Q',
          click: () => {
            require('electron').app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About BloomSwiftPOS',
          click: () => {
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About BloomSwiftPOS',
              message: 'BloomSwiftPOS',
              detail: 'Version 1.0.0\n\nA comprehensive Point of Sale system for retail management.\n\n© 2024-2026 BloomSwiftPOS',
              buttons: ['OK'],
            });
          },
        },
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/bloomswiftpos');
          },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            const { autoUpdater } = require('electron-updater');
            autoUpdater.checkForUpdatesAndNotify();
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

module.exports = { createMenu };
