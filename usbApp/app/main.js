// Codesters USB App
// by Codesters

console.log('APP WINDOW');

var makesenseDevice;
var externalPort;
var internalPort;
var messagingLooping = false;
var messagingFrequency = 100;

var discoverDevices = function(devices) {
  // This is called as a callback from chrome.hid.getDevices()
  makesenseDevice = new MakeSense(devices);

   // only send messege if
  // 1. There is not a message in the queue already
  // 2. there is a changed value
  // so we don't need to start the messaging loop
  //startMessaging();
};

var disableDevices = function(){
  stopMessaging();
  makesenseDevice.disable();
  //makesenseDevice = null;
};

var messageInQueue = false;
function startMessaging(){
  messagingLooping = true;
  messagingLoop();
}
function stopMessaging(){
  messagingLooping = false;
}
function messagingLoop(){
  console.log('messageLoop');
  if(makesenseDevice && makesenseDevice.connection && makesenseDevice.hasReceivedData){
    var analog_values = makesenseDevice.analog_values;
    var digital_values = makesenseDevice.digital_values;
    var message = {
      update: true,
      analog: analog_values,
      digital: digital_values
    }
    if(externalPort){externalPort.postMessage(message);}
    if(internalPort){internalPort.postMessage(message);}
    messageInQueue = false;
  }
  if(messagingLooping){
    window.setTimeout(messagingLoop, messagingFrequency);
  }


}

chrome.runtime.onConnectExternal.addListener(function(port){
  console.log('connect external');
  port.onDisconnect.addListener(disableDevices);
  externalPort = port;
  chrome.hid.getDevices({}, discoverDevices);
});

chrome.runtime.onConnect.addListener(function(port){
  console.log('connect');
  port.onDisconnect.addListener(disableDevices);
  internalPort = port;
  chrome.hid.getDevices({}, discoverDevices);
});

chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  console.log('onMessageExternal');
    if (request) {
        if (request.message) {
            if (request.message == "version") {
                sendResponse({version: 0.1});
            }
        }
    }
    return true;
});




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


// Make a config window
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "control-panel.html",
      {
        innerBounds: { width: 600, height: 480}
      });
});

// Allow External connect
//
// chrome.runtime.onConnectExternal.addListener(function(){
//
// });
