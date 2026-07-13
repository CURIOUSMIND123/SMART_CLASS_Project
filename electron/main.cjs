/* Electron shell: starts the local server, then opens the app window. */
const { app, BrowserWindow } = require("electron");
const path = require("path");

let win;
function createWindow() {
  // start the embedded API + static server
  require(path.join(__dirname, "..", "server", "index.js"));
  win = new BrowserWindow({
    width: 1360,
    height: 860,
    title: "Arunodaya Smart School Command (DEMO)",
    webPreferences: { contextIsolation: true },
  });
  win.removeMenu();
  // give the server a moment, then load
  setTimeout(() => win.loadURL("http://localhost:4600"), 800);
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
