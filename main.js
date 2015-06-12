"use strict";

let app = require('app');  // Electron app
let BrowserWindow = require('browser-window');  // Creating Browser Windows

let Menu = require('menu');
let MenuItem = require('menu-item');
require('electron-debug')();

let jupyter = require("./lib/jupyter.js");

// Parse out a kernel-####.json argument
let argv = require('minimist')(process.argv.slice(2));
let connFile = argv._[0];
let config = require(connFile);

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the side car window object
// If we don't, the window will be closed automatically when the javascript
// object is GCed.
let sideCar = null;
let session = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // Fully close up, even on OS X
  app.quit();
});

let kernelListing = new Menu();


kernelListing.append(new MenuItem({ label: 'MenuItem1', click: function() { console.log('item 1 clicked'); } }));
kernelListing.append(new MenuItem({ type: 'separator' }));
kernelListing.append(new MenuItem({ label: 'MenuItem2', type: 'checkbox', checked: true }));

let kernelsMenu = new MenuItem({
  label: 'Kernels',
  submenu: kernelListing
});


let menu = new Menu();

menu.append(kernelsMenu);

console.dir(menu);

let kernelWatch = new KernelWatch();

function updateRuntime(kernelJSON, stat) {
  console.log(kernelJSON + ' ' + (stat.mode !== 0));
  let mi = new MenuItem({
    label: kernelJSON,
    click: function() {
      console.log(this);
    }
  });
  kernelListing.append(mi);
  console.dir(kernelListing);
  console.dir(menu);
  console.dir()
  console.log('woot asdfl;kajsdf;lkajsdf;laksdjf;alskdjf;alskdfja;lsdkfj');
}

// This method will be called when Electron has done every
// initialization and is ready for creating browser windows.
app.on('ready', function() {
  console.dir("Le menu");
  console.dir(menu);
  Menu.setApplicationMenu(menu);

  // Create the browser window.
  sideCar = new BrowserWindow({
    width: 800,
    height: 800,
    //"node-integration": false, // Would have to use a web-view and work with events
    //frame: false
  });

  // and load the index.html of the app.
  sideCar.loadUrl('file://' + __dirname + '/index.html');

  sideCar.webContents.on('did-finish-load', function() {

    session = new jupyter.IOPubSession(config, function(msg){
      // Get display data if available
      if("content" in msg && "data" in msg.content) {
        let richDisplay = new jupyter.RichDisplay(msg.content.data);
        richDisplay.render(sideCar.webContents);
      }

    });
  });

  // Emitted when the window is closed.
  sideCar.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    sideCar = null;
  });
});
