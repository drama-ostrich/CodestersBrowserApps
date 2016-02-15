(function() {

    chrome.app.runtime.onLaunched.addListener(function() {
      chrome.app.window.create('window.html', {
        'outerBounds': {
          'width': 400,
          'height': 500
        }
      });
    });

    var getDeviceHandler = function(device) {
        return function(data) {
              // It may be good to add some throttling here in case the refresh rate is too quick for codesters
              var data8 = new Uint8Array(data);
              var array = [].slice.call(data8)
              //     console.log('Uint16Array:', new Uint16Array(data));
              //     console.log('Uint32Array:', new Uint32Array(data));
              return array;
        };
    };



    var startPoller = function(port, connectionId, handler) {
      var dataReceived  = false;
        // The anonymous function poller() will keep the port, connectionID
        // and handler in its scope.
        var poller = function() {
            if (!port) {return;}
            chrome.hid.receive(connectionId, function(reportID, data) {
                if(!dataReceived){
                  port.postMessage('Received data from HID device.');
                  dataReceived=true
                }
                var dataArray = handler(data);
                var msg = {};
                msg.data = dataArray;
                port.postMessage(msg);
                setTimeout(poller, 0);
            });
        };
        poller();
    };

    var connectExternal = function(port) {
        // This is the start of the App, when Codesters attempts to open a port to this app.

        console.log("Codesters MakeSense! app has started. Initializing HID.");
        port.postMessage('Codesters MakeSense! app has started. Initializing HID.');

        chrome.hid.getDevices({}, function(devices) {

            if (!devices || !devices.length) {
                port.postMessage("No compatible device found.");
                return;
            }

            var device = devices[0];
            port.postMessage("Found device: " + device.toString());

            // handler returns a data array for the 8 channels on MakeSense
            var handler = getDeviceHandler(device);

            // Connect to the HID device
            chrome.hid.connect(device.deviceId, function(connection) {
                port.postMessage('Connected to the HID device!');
                port.postMessage('Polling HID device...');
                // Poll the USB HID Interrupt pipe
                startPoller(port, connection.connectionId, handler);

            });
        });


    };

    var initializeApp = function() {
        console.log('initializeApp');
        chrome.runtime.onConnectExternal.addListener(connectExternal);
    };
    initializeApp();

}());
