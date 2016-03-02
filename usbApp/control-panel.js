(function() {
    var ui = {
        makesenseDetected: null,
    };

    var channels = [];

    var connection = -1;
    var deviceMap = {};
    var pendingDeviceMap = {};
    var makesenseDevice = null;
    var pendingDeviceEnumerations = 0;
    var keepPolling = false;

    var loop = document.getElementById("myCheck");

    var initializeWindow = function() {
        for (var k in ui) {
            var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
            var element = document.getElementById(id);
            if (!element) {
                throw "Missing UI element: " + k + "with id: " + id;
            }
            ui[k] = element;
        }
        console.log("Initilize...");
        for (var i = 0; i < 8; ++i) {
            channels[i] = {
                id: i,
                select_func: document.getElementById("c" + i + "func"),
                btn_d_set_read: document.getElementById("c" + i + "ds"),
                btn_d_read: document.getElementById("c" + i + "dr"),
                lbl_d_read: document.getElementById("c" + i + "dd"),
                btn_d_high: document.getElementById("c" + i + "dh"),
                btn_d_low: document.getElementById("c" + i + "dl"),
                btn_a_read: document.getElementById("c" + i + "ar"),
                lbl_a_read: document.getElementById("c" + i + "aa"),
                btn_a_write: document.getElementById("c" + i + "aw"),
                txb_a_write: document.getElementById("c" + i + "ap"),
            }
            channels[i].select_func.addEventListener('change', channel_UI_change_function);
            channels[i].btn_d_high.addEventListener('click', channel_UI_digital_out); // Set Digital HIGH
            channels[i].btn_d_low.addEventListener('click', channel_UI_digital_out); // Set Digital LOW
            channels[i].btn_d_set_read.addEventListener('click', channel_UI_set_read); // Set Digital READ MODE
            channels[i].btn_d_read.addEventListener('click', channel_UI_read_channel); // Read Digital VALUE
            channels[i].btn_a_read.addEventListener('click', channel_UI_analog_channel); // Read Analog Channel
            channels[i].btn_a_write.addEventListener('click', channel_UI_PWM_channel); // Write PWM channel
        }
        chrome.hid.getDevices({}, discoverDevices);
    };

    var channel_UI_change_function = function() {
        var id = Number(event.target.id.charAt(1));
        var channel_obj = channels[id];
        var select_value = channel_obj.select_func.value;
        if (select_value == "di") { // Digital IN
            channel_obj.btn_d_set_read.style.display = 'inline';
            channel_obj.btn_d_read.style.display = 'inline';
            channel_obj.lbl_d_read.style.display = 'inline';
        } else {
            channel_obj.btn_d_set_read.style.display = 'none';
            channel_obj.btn_d_read.style.display = 'none';
            channel_obj.lbl_d_read.style.display = 'none';
        }
        if (select_value == "do") { // Digital OUT
            channel_obj.btn_d_high.style.display = 'inline';
            channel_obj.btn_d_low.style.display = 'inline';
        } else {
            channel_obj.btn_d_high.style.display = 'none';
            channel_obj.btn_d_low.style.display = 'none';
        }
        if (select_value == "ai") { // Analog IN
            channel_obj.btn_a_read.style.display = 'inline';
            channel_obj.lbl_a_read.style.display = 'inline';
        } else {
            channel_obj.btn_a_read.style.display = 'none';
            channel_obj.lbl_a_read.style.display = 'none';
        }
        if (select_value == "ao") { //Analog OUT
            channel_obj.btn_a_write.style.display = 'inline';
            channel_obj.txb_a_write.style.display = 'inline';
        } else {
            channel_obj.btn_a_write.style.display = 'none';
            channel_obj.txb_a_write.style.display = 'none';
        }

    };


    function IO_digital_out(channel_id, hl) {
        if (!(connection === -1)) {
            var id = 3
            var bytes = new Uint8Array(15);
            bytes[0] = "I".charCodeAt(0);
            bytes[1] = hl.charCodeAt(0);
            bytes[2] = channel_id + "0".charCodeAt(0);
            chrome.hid.send(connection, id, bytes.buffer, function() {});
        }
    }

    function IO_digital_set_to_read(channel_id) {
        if (!(connection === -1)) {
            var id = 3
            var bytes = new Uint8Array(15);
            bytes[0] = "I".charCodeAt(0);
            bytes[1] = "l".charCodeAt(0);
            bytes[2] = channel_id + "0".charCodeAt(0);
            chrome.hid.send(connection, id, bytes.buffer, function() {});
        }
    }

    function IO_digital_send_read_request(channel_id) {
        if (!(connection === -1)) {
            var id = 3
            var bytes = new Uint8Array(15);
            bytes[0] = "I".charCodeAt(0);
            bytes[1] = "R".charCodeAt(0);
            bytes[2] = channel_id + "0".charCodeAt(0);
            chrome.hid.send(connection, id, bytes.buffer, function() {});
        }
    }

    function IO_analog_send_read_request(channel_id) {
        if (!(connection === -1)) {
            var id = 3
            var bytes = new Uint8Array(15);
            bytes[0] = "I".charCodeAt(0);
            bytes[1] = "I".charCodeAt(0);
            bytes[2] = channel_id + "0".charCodeAt(0);
            chrome.hid.send(connection, id, bytes.buffer, function() {});
        }
    }

    function IO_analog_set_PWM(channel_id, value_str) {
        if (!(connection === -1)) {
            var id = 3
            var bytes = new Uint8Array(15);
            bytes[0] = "I".charCodeAt(0);
            bytes[1] = "P".charCodeAt(0);
            bytes[2] = channel_id + "0".charCodeAt(0);
            bytes[3] = value_str.charCodeAt(0);
            bytes[4] = value_str.charCodeAt(1);
            chrome.hid.send(connection, id, bytes.buffer, function() {});
        }
    }

    var channel_UI_digital_out = function() {
        var channel_id = Number(event.target.id.charAt(1));
        var hl = event.target.id.charAt(3) == 'h' ? "H" : "L";
        IO_digital_out(channel_id, hl);
    };

    var channel_UI_set_read = function() {
        var channel_id = Number(event.target.id.charAt(1));
        IO_digital_set_to_read(channel_id);
    };

    var channel_UI_read_channel = function() {
        var channel_id = Number(event.target.id.charAt(1));
        IO_digital_send_read_request(channel_id);
    };

    var channel_UI_analog_channel = function() {
        var channel_id = Number(event.target.id.charAt(1));
        IO_analog_send_read_request(channel_id);
    };

    var channel_UI_PWM_channel = function() {
        var channel_id = Number(event.target.id.charAt(1));
        var value = Number(channels[channel_id].txb_a_write.value);
        var value_str = byteToHex(value);
        IO_analog_set_PWM(channel_id, value_str);
    };

    function ReadAllD() {
        var id = 3
        var bytes = new Uint8Array(15);
        bytes[0] = "I".charCodeAt(0);
        bytes[1] = "R".charCodeAt(0);
        chrome.hid.send(connection, id, bytes.buffer, function() {});
    };

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

    var getMakeSenseDevice = function(devices) {
        // look through devices to find the correct productID and collection.usagePage for the
        // makesense dev board
        var msDevice = null;
        for (var i = 0; i < devices.length; ++i) {
            var device = devices[i];
            if (device.vendorId == 1240 && device.productId == 62570) { //this is a IO Board
                for (var j = 0; j < device.collections.length; j++) {
                    var collection = device.collections[j];
                    if (collection.usagePage == 65280 && collection.usage == 1) {
                        msDevice = device;
                        //console.log("found "+makesenseDebugInterfaceDetected);
                    }
                }
            }
        }

        return msDevice;
    };

    var discoverDevices = function(devices) {
        // This is called as a callback from the chrome.hid.getDevices()
        // command in initializeWindow();

        makesenseDevice = getMakeSenseDevice(devices);

        // connectDevice adds the .connection property
        makesenseDevice = connectDevice(makesenseDevice, "MakeSense");

        // if (makesenseDevice && makesenseDevice.connection){
        //   checkAll();
        // }

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

    // This should be makeSense.preRead
    var checkAll = function() {
        if (myCheck.checked == 1 || true) {
            ReadAllD();
            IO_analog_send_read_request(0);
            IO_analog_send_read_request(1);
            IO_analog_send_read_request(2);
            IO_analog_send_read_request(3);
            IO_analog_send_read_request(4);
            IO_analog_send_read_request(5);
            IO_analog_send_read_request(6);
            IO_analog_send_read_request(7);
        }

        setTimeout(checkAll, 100);


    }


    var isReceivePending = false;
    var pollForInput = function() {

        isReceivePending = true;
        chrome.hid.receive(makesenseDevice.connection, function(reportId, data) {

            isReceivePending = false;
            if (reportId == 3) { //only handle data for debug interface
                logInput(new Uint8Array(data));
            }
            if (keepPolling) {
                setTimeout(pollForInput, 0);
            }
        });
    };

    var enablePolling = function(pollEnabled) {
        keepPolling = pollEnabled;
        if (pollEnabled && !isReceivePending) {
            pollForInput();
        }
    };



    var byteToHex = function(value) {
        if (value < 16)
            return '0' + value.toString(16);
        return value.toString(16);
    };

    var byteHexToInt = function(value) {
        if (value >= 48 && value <= 57) {
            return (value - 48);
        } else if (value >= 65 && value <= 70) {
            return (value - 65 + 10);
        } else if (value >= 97 && value <= 102) {
            return (value - 97 + 10);
        } else {
            return null;
        }
    }

    var logInput = function(bytes) {
        if (bytes.length == 15 && bytes[0] == "I".charCodeAt(0) && bytes[1] == "R".charCodeAt(0)) {
            var return_val = byteHexToInt(bytes[3]);
            if (return_val != null) {
                var read_value = return_val;
                var return_val = byteHexToInt(bytes[2]);
                if (return_val != null) {
                    read_value = return_val * 16 + read_value;
                    for (var i = 0; i < 8; i++) {
                        channels[i].lbl_d_read.innerHTML = ((read_value & (1 << i)) != 0) ? "HIGH" : "low";
                    }
                }
            } else if (bytes[3] == 72 || bytes[3] == 76) {
                var return_val = byteHexToInt(bytes[2]);
                if (return_val != null && return_val >= 0 && return_val < 8) {
                    channels[return_val].lbl_d_read.innerHTML = (bytes[3] == 72) ? "HIGH" : "low";
                }
            }
        } else if (bytes.length == 15 && bytes[0] == "I".charCodeAt(0) && bytes[1] == "I".charCodeAt(0)) {
            var return_val1 = byteHexToInt(bytes[2]);
            var return_val2 = byteHexToInt(bytes[3]);
            var return_val3 = byteHexToInt(bytes[4]);
            if (return_val1 !== null & return_val2 !== null & return_val3 !== null) {
                if (return_val1 < 8) {
                    channels[return_val1].lbl_a_read.innerHTML = return_val2 * 16 + return_val3;
                }
            }

        }
    };
    window.addEventListener('load', initializeWindow);
}());
