// Top level functions for chrome app


var connectDevice = function(device, deviceName) {

  // if the device establishes a connection, add a .connection property
  // to the device to check later
  // this way we can associate connections with devices in the future

  if (device) {
      device.connection = null;

      chrome.hid.connect(device.deviceId, function(connectInfo) {
          if (!connectInfo) {
              console.warn("Unable to connect to device: " + deviceName);
          } else {
              connection = connectInfo.connectionId;
              device.connection = connection;
              console.log("Connected to " + deviceName + " with ID: " + connection);
              console.log(device.connection)
              checkAll();
              enablePolling(true);
              ui.makesenseDetected.innerHTML = "IO Board Connected";
          }

      });
  } else {
      console.warn("Unable to connect to device: " + deviceName);
  }
  return device;
};


var discoverDevices = function(devices) {
  // This is called as a callback from the chrome.hid.getDevices()
  // command in initializeWindow();

  makesenseDevice = getMakeSenseDevice(devices);

  // connectDevice adds the .connection property
  makesenseDevice = connectDevice(makesenseDevice, "MakeSense");

  // On a disconnect
  //
  // if (!(connection === -1)){
  //   chrome.hid.disconnect(connection, function() {});
  //   connection = -1;
  //   console.log("Disconnected with ID: "+connection);
  //   enablePolling(false);
  //   ui.makesenseDetected.innerHTML = "IO Board Disconnected";
  //   enableIOControls(false);
  // }

};


var initializeApp = function(){
  chrome.hid.getDevices({}, discoverDevices);
};
//initializeApp();



chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "control-panel.html",
      {
        innerBounds: { width: 485, height: 310, minWidth: 485 }
      });
});

chrome.runtime.onConnectExternal.addListener(function(){

});
