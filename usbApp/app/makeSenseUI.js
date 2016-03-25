console.log('UI WINDOW');
var updateUI = function(){}; // defined in closure
var MakeSenseUIModel;
var channel_template = Handlebars.templates['channel'];
var channel_models = [];
$(function(){

  MakeSenseUIModel = function(id){
    this.id = id;
    this.mode_digital_out = false;
    this.mode_digital_in = false;
    this.mode_analog_out = false;
    this.mode_analog_in = true;

    this.analog_value = 0;
    this.digital_value = 0;

    this.container = document.getElementById('channel' + id.toString());
    this.analog_container = null;
    this.digital_container = null;

    this.UISelect = null;

  };
  MakeSenseUIModel.prototype.changeMode = function(selectElement){
    // changeMode is called from a eventListener on a select
    // so "this" is the select element for a channel
    var selectedMode = selectElement.value;
    this.mode_digital_out = false;
    this.mode_digital_in = false;
    this.mode_analog_out = false;
    this.mode_analog_in = false;
    switch (selectedMode) {
      case 'ai':
        this.mode_analog_in = true; break;
      case 'ao':
        this.mode_analog_out = true; break;
      case 'di':
          this.mode_digital_in = true; break;
      case 'do':
          this.mode_digital_out = true; break;
      default:
        this.mode_analog_in = true;
    }

    this.render();
  }
  MakeSenseUIModel.prototype.connect = function(){
    // save elements to this model that will hold output
    var callbackThis = this;
    this.UISelect = document.getElementById('select-mode-' + this.id.toString());
    this.UISelect.addEventListener('change', function(){callbackThis.changeMode(this);}, false);

    this.digital_container = null;
    if(this.mode_digital_in){
      this.digital_container = document.getElementById('digital-in-' + this.id.toString());
    }

    this.analog_container = null;
    if(this.mode_analog_in){
      this.analog_container = document.getElementById('analog-in-' + this.id.toString());
    }
  }
  MakeSenseUIModel.prototype.render = function(){
    // render the html for this channel
    var html = channel_template(this);
    this.container.innerHTML = html;
    this.connect();

  };
  MakeSenseUIModel.prototype.update = function(){
    // update just the displaty numbers in each channel
    if(this.mode_analog_in && this.analog_container){
      this.analog_container.innerHTML = this.analog_value;
    }
    if(this.mode_digital_in && this.digital_container){
        this.digital_container.innerHTML = this.digital_value;
    }
  };

  var portListener = function(message){
    if(message.update) {
      for(var i=0; i < 8; i++){
        channel_models[i].analog_value = message.analog[i];
        channel_models[i].digital_value = message.digital[i];
        channel_models[i].update();
      }
    }
  }

  var connectToApp = function(){
    var chromePort = chrome.runtime.connect('dehcajfkhngfjckmkjckfmcmbgpmbkmo');
    if (chromePort) {
        console.log('Found Codesters MakeSense Chrome app, listening for data...');
        chromePort.onMessage.addListener(portListener);
    }
    else{
        console.log('Codesters MakeSense Chrome app not installed');
    }
  };

  var initializeWindow = function() {
    console.log('Initializing MakeSense UI.');

    for(var i=0; i < 8; i++){
      var channel = new MakeSenseUIModel(i);
      channel.render();
      channel_models.push(channel);
    }

  };


  // copied from old app

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

  initializeWindow();
  connectToApp();

});
