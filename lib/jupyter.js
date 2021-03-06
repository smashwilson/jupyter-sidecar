module.exports = {
  IOPubSession: IOPubSession,
  RichDisplay: RichDisplay
};

var jmp = require("jmp");
var katex = require("katex");
var marked = require("marked");

function formConnectionString(config, channel) {
  var portDelimiter = ":";
  if (config.transport !== "tcp") {
    portDelimiter = "-";
  }
  
  return config.transport + "://" + config.ip + portDelimiter + config[channel + "_port"]; 
}

/**
 * This callback handles jmp.Messages
 * @callback messageCallback
 * @param {jmp.Message} message
 */

/**
 * @class IOPubSession
 * @classdesc Keeps a session with an IOPub channel
 * @param {Object} connectionJSON Connection information provided by Jupyter
 * @param {messageCallback} messageCallback Callback that handles messages
 */
function IOPubSession(connectionJSON, cb) {
  	/**
     * Connection information provided by Jupyter
     * @member {Object}
     */
    this.connectionJSON = connectionJSON;
    
    /**
     * Handles messages from the IOPub channel
     * @member {messageCallback}
     */
    this.messageCallback = cb;
    
    /**
     * Jupyter IOPub channel
     * @member {module:jmp~Socket}
     */
    this.iopubSocket = new jmp.Socket(
         "sub",
          this.connectionJSON.signature_scheme.slice("hmac-".length),
          this.connectionJSON.key
    ); 
     
    /**
     * URL for zmq socket
     * @member {string}
     */
    this.iopubURL = formConnectionString(this.connectionJSON, "iopub");

    console.log('Connecting to ' + this.iopubURL);

    this.iopubSocket.connect(this.iopubURL);
    this.iopubSocket.subscribe('');
     
    this.iopubSocket.on("message", cb);
}

/**
 * @class RichDisplay
 * @classdesc Assists in choosing the most rich display of the data
 * @param {Object} data The data field of an IOPub message's content (msg.content.data), keys are mimetypes
 * 
 * MIME types supported (in display precedence):
 *   application/javascript
 *   text/html
 *   text/markdown
 *   text/latex
 *   image/svg+xml
 *   image/png
 *   image/jpeg
 *   application/json
 *   text/plain
 * 
 */
function RichDisplay(data){
  /**
   * Jupyter display data
   * @member {Object} 
   */
  this.data = data;
  
}

RichDisplay.prototype.render = function(webContents) {
  
    // JavaScript is our most rich display type
    if ("application/javascript" in this.data) {
      var code = this.data["application/javascript"];
      webContents.executeJavaScript(code);
      return;
    }
  
    var html = null;
    
    if("text/html" in this.data){
      html = this.data["text/html"];
    } else if ("text/markdown" in this.data) {
      html = marked(this.data['text/markdown']);
    } else if ("text/latex" in this.data) {
      html = katex.renderToString(this.data["text/latex"]);
    } else if ("image/svg+xml" in this.data) {
      html = "<img src='data:image/svg+xml;base64," + this.data["image/svg+xml"] + "'/>";
    } else if ("image/png" in this.data) {
      html = "<img src='data:image/png;base64," + this.data["image/png"] + "'/>";
    } else if ("image/jpeg" in this.data) {
      html = "<img src='data:image/jpeg;base64," + this.data["image/jpeg"] + "'/>";
    } else if ("application/json" in this.data) {
      html = "<pre>" + JSON.stringify(this.data["application/json"]) + "</pre>";
    } else if ("text/plain" in this.data) {
      html = this.data["text/plain"];
    } else {
      console.log(this.data);
    }
    
    webContents.send('display', html);
};