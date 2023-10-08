
// Import FS so we can read all of the files in a directory.
const fs = require('fs');

// Import Mustache for substitution.
const Mustache = require('mustache');

// Define where our Log Directory is.
const LOG_DIRECTORY = "./Logs"

enum LogSource{
  INTERNAL,
  TETHERED_DEVICE,
  REMOTE_ECHO
}

enum LogLevel{
  MESSAGE,  // General Alerts / Logging message
  WARNING,  // Something is strange but recoverable.
  ERROR,    // An error ocurred, we are aware of it and can recover from this state / anticipated that this could happen.
  CRITICAL, // Something Unexpected happened. We usually cannot recover from this occurrence. 
}

type LogMessage = {
  time : number,
  type : LogSource,
  level : LogLevel,
  message : string
}

const logs = new Array<LogMessage>();

export function log(content : string){
  let message : LogMessage = {
    time : Date.now(),
    type : LogSource.INTERNAL,
    level : LogLevel.MESSAGE,
    message : content
  }
  printFormatted(message);
  logs.push(message);
}

const LOG_TEMPLATE = "{{time}} - [{{type}}][{{level}}]:{{message}}";

function printFormatted(message : LogMessage){
  // Build our template object.
  let templateValues  = {
    time : message.time,
    type : LogSource[message.type],
    level : LogLevel[message.level],
    message : message.message
  }
  
  let formatted = Mustache.render(LOG_TEMPLATE, templateValues);

  console.log(formatted);
}

/**
 * When log files are generated we are creating a CSV where all messages are their own line. 
 * Fields of message are Comma Delimited, Messages / Logs are delimited by new lines.
 */
function generateLogFile(){
  let data = "";
  let index = 0;
  for( let log of logs){
    if(index > 0){
      data +="\n"; // Insert character to end the last message.
    }
    data += log.time + ","
    data += log.type + ","
    data += log.level + ","
    data += log.message + ","
    index++;
  }
  // Return the generated message
  return data;
}

export function flush(fileName = "log_"+Date.now()+".csv"){
  fs.writeFileSync()
}