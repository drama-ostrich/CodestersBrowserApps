var MakeSense = function(devices){

  this.device = null;
  this.connection = null;
  this.name = "MakeSense IO";
  this.polling = false;
  this.prePolling = false;
  this.numberOfChannels = 8;

  this.prePollFrequency = 30;
  this.pollFrequency = 0;

  this.hasReceivedData = false;
  this.hasConnected = false;

  this.digital_values = [];
  for (var i=0; i < this.numberOfChannels; i++){
    this.digital_values.push(null);
  }

  this.analog_values = [];
  for (var i=0; i < this.numberOfChannels; i++){
    this.analog_values.push(null);
  }

  // if devices is an array of devices
  if(devices.length){
    this.device = this.getFromDevices(devices);
  }
  // maybe devices is actually alredy a device
  else if(devices.vendorId && devices.productId){
    this.device = devices;
  }
  //
  else if(devices === null){
    // this.device is null. allow it to be loaded later with getFromDevices()
  }
  else{
    throw 'Argument to MakeSense() should be a list of deivces from chrome.hid.getDevices()'
  }

  if (this.device){
    console.log('Found MakeSense Device. Connecting');
    this.connect();
  }

}
MakeSense.prototype.getFromDevices = function(devices){
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
}
MakeSense.prototype.connect = function(){
  if (this.device) {

    var callbackThis = this;

      chrome.hid.connect(callbackThis.device.deviceId, function(connectInfo) {
          if (!connectInfo) {
              console.warn("Unable to connect to device: " + callbackThis.name);
          } else {
              var connection = connectInfo.connectionId;
              callbackThis.connection = connection;
              callbackThis.hasConnected = true;
              console.log("Connected to " + callbackThis.name + " with ID: " + connection);
              console.log(connection);
              callbackThis.startPolling();

              // update UI if necessary
              // ui.makesenseDetected.innerHTML = "IO Board Connected";
          }

      });
  } else {
      console.warn("Unable to connect to device: " + this.name);
  }
}
MakeSense.prototype.readAllD = function(){
  var id = 3
  var bytes = new Uint8Array(15);
  bytes[0] = "I".charCodeAt(0);
  bytes[1] = "R".charCodeAt(0);
  chrome.hid.send(this.connection, id, bytes.buffer, function() {});
};
MakeSense.prototype.IO_analog_set_PWM = function(channel_id, value_str) {
      var id = 3
      var bytes = new Uint8Array(15);
      bytes[0] = "I".charCodeAt(0);
      bytes[1] = "P".charCodeAt(0);
      bytes[2] = channel_id + "0".charCodeAt(0);
      bytes[3] = value_str.charCodeAt(0);
      bytes[4] = value_str.charCodeAt(1);
      chrome.hid.send(this.connection, id, bytes.buffer, function() {});
};
MakeSense.prototype.IO_analog_send_read_request = function(channel_id) {
  var id = 3
  var bytes = new Uint8Array(15);
  bytes[0] = "I".charCodeAt(0);
  bytes[1] = "I".charCodeAt(0);
  bytes[2] = channel_id + "0".charCodeAt(0);
  chrome.hid.send(this.connection, id, bytes.buffer, function() {});
};
MakeSense.prototype.IO_digital_send_read_request = function(channel_id) {
  var id = 3
  var bytes = new Uint8Array(15);
  bytes[0] = "I".charCodeAt(0);
  bytes[1] = "R".charCodeAt(0);
  bytes[2] = channel_id + "0".charCodeAt(0);
  chrome.hid.send(this.connection, id, bytes.buffer, function() {});
};
MakeSense.prototype.IO_digital_set_to_read = function(channel_id) {
  var id = 3
  var bytes = new Uint8Array(15);
  bytes[0] = "I".charCodeAt(0);
  bytes[1] = "l".charCodeAt(0);
  bytes[2] = channel_id + "0".charCodeAt(0);
  chrome.hid.send(this.connection, id, bytes.buffer, function() {});
};
MakeSense.prototype.IO_digital_out = function(channel_id, hl) {
  var id = 3
  var bytes = new Uint8Array(15);
  bytes[0] = "I".charCodeAt(0);
  bytes[1] = hl.charCodeAt(0);
  bytes[2] = channel_id + "0".charCodeAt(0);
  chrome.hid.send(this.connection, id, bytes.buffer, function() {});
};
MakeSense.prototype.set_digitial_high = function(channel_id) {
  this.IO_digital_out(channel_id, 'H');
}
MakeSense.prototype.set_digitial_low = function(channel_id) {
  this.IO_digital_out(channel_id, 'L');
}
MakeSense.prototype.startPolling = function(){
  console.log('start polling');
  this.prePolling = true;
  this.prePoll();
  this.polling = true;
  this.poll();
};
MakeSense.prototype.stopPolling = function(){
  this.prePolling = false;
  this.polling = false;
};
MakeSense.prototype.prePoll = function(){
  if(this.connection){
    this.readAllD();
    for (var i = 0; i < this.numberOfChannels; i ++){
      this.IO_analog_send_read_request(i);
    }
    if(this.prePolling){
      var callbackThis = this;
      setTimeout(function(){callbackThis.prePoll();}, this.prePollFrequency);
    }
  }
};
MakeSense.prototype.poll = function(){
  if(this.connection){
    var callbackThis = this;
    chrome.hid.receive(this.connection, function(reportId, data) {
        callbackThis.hasReceivedData = true;
        if (reportId == 3) { //only handle data for debug interface
            callbackThis.saveData(new Uint8Array(data));
        }
        if (callbackThis.polling) {
            setTimeout(function(){callbackThis.poll();}, this.pollFrequency);
        }
    });
  }
};
MakeSense.prototype.byteToHex = function(value) {
    if (value < 16)
        return '0' + value.toString(16);
    return value.toString(16);
};
MakeSense.prototype.byteHexToInt = function(value) {
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
MakeSense.prototype.saveData = function(bytes) {
    if (bytes.length == 15 && bytes[0] == "I".charCodeAt(0) && bytes[1] == "R".charCodeAt(0)) {
        var return_val = this.byteHexToInt(bytes[3]);
        if (return_val != null) {
            var read_value = return_val;
            var return_val = this.byteHexToInt(bytes[2]);
            if (return_val != null) {
                read_value = return_val * 16 + read_value;
                for (var i = 0; i < 8; i++) {
                    this.digital_values[i] = ((read_value & (1 << i)) != 0) ? "HIGH" : "low";
                }
            }
        } else if (bytes[3] == 72 || bytes[3] == 76) {
            var return_val = this.byteHexToInt(bytes[2]);
            if (return_val != null && return_val >= 0 && return_val < 8) {
                this.digital_values[return_val] = (bytes[3] == 72) ? "HIGH" : "low";
            }
        }
    } else if (bytes.length == 15 && bytes[0] == "I".charCodeAt(0) && bytes[1] == "I".charCodeAt(0)) {
        var return_val1 = this.byteHexToInt(bytes[2]);
        var return_val2 = this.byteHexToInt(bytes[3]);
        var return_val3 = this.byteHexToInt(bytes[4]);
        if (return_val1 !== null & return_val2 !== null & return_val3 !== null) {
            if (return_val1 < 8) {
              this.analog_values[return_val1] = return_val2 * 16 + return_val3;
            }
        }

    }
};
MakeSense.prototype.disable = function() {
  console.log('Disabling MakeSense device...');
  var callbackThis = this;
  this.stopPolling();
  console.log('Stopping device polling');
  chrome.hid.disconnect(this.connection, function(){
    callbackThis.connection = null;
    console.log('MakeSense disabled');
  })

}
