console.log('UI WINDOW');
var updateUI = function(){}; // defined in closure

(function() {
    var ui = {};
    var channels = [];
    var loop = document.getElementById("myCheck");

    var initializeWindow = function() {
      console.log('Initializing MakeSense UI.')
        for (var k in ui) {
            var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
            var element = document.getElementById(id);
            if (!element) {
                throw "Missing UI element: " + k + "with id: " + id;
            }
            ui[k] = element;
        }

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

        var chromePort = chrome.runtime.connect('ohepjeofbhdaeepkpnhldhahophjpomd');
        if (chromePort) {
            console.log('Found Codesters MakeSense Chrome app, listening for data...');
            chromePort.onMessage.addListener(portListener);
        }
        else{
            console.log('Codesters MakeSense Chrome app not installed');
        }
    };

    var portListener = function(message){
      if(message.update) {
        updateUI(message.analog, message.digital);
      }
    }

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

    updateUI = function(analog, digital){
      for (var i = 0; i < 8; i++) {
          channels[i].lbl_d_read.innerHTML = digital[i];
          channels[i].lbl_a_read.innerHTML = analog[i];
      }
    };


    window.addEventListener('load', initializeWindow);

}());
