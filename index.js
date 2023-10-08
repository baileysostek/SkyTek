// Requirements
const readline = require("readline");
const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout,
    terminal: false
})

// JSON comment utility
const requireJSON = require('json-easy-strip');

// Import FS so we can read all of the files in a directory.
const fs = require('fs');

// Directory where Capabilities live.
const CAPABILITIES_DIRECTORY = "./Capabilities"

// Directory where Devices live
const DEVICES_DIRECTORY = "./Devices";

// Define our Software Name
const SOFTWARE_NAME = "SkyTek Manager";

// Define important characters.
const COMMAND_CHARACTER = "/";
const COMMAND_ARGUMENT_DELIMITER = " ";

// Global variables
// Create a Map mapping the capability name to the json definition file.
let capabilities = new Map();

// Welome to 
console.log(SOFTWARE_NAME);

/**
 * Define all of the commands which a user can use to create and manage SkyTek Software.
 */
const COMMANDS = {
    "help":{
        "description":"Prints out a listing of all commands which can be executed.",
        "command": (args) => {
            // Iterate through each key of our COMMANDS and print out each command's description.
            for(let key of Object.keys(COMMANDS)){
                printDetails(key);
            }
        }
    },
    "devices":{
        "description":"Lists all of the available products that we currently produce.",
        "command": (args) => {
            
        }
    },
    "capabilities":{
        "description":"Lists all of the available capabilities of this SkyTek environment as well as plugins.",
        "command": (args) => {
            listCapabilities();
        }
    },
    "build":{
        "description":"Generates the core C code for this device based on the capabilities defined in the devices config file.",
        "command": (device) => {
            buildDeviceSource(device);
        }
    },
    "exit":{
        "description":"Exits the software",
        "command": (args) => {
            process.exit(1);
        }
    }
}

function executeCommand(key, ...arguments){
    return COMMANDS[key]?.command?.(...arguments);
}

function hasCommand(key){
    return COMMANDS[key];
}

function printDetails(key){
    if (hasCommand(key)) {
        console.log(key, "-", COMMANDS[key].description);
    }
}

// Input handlers to determine when a user inputs data or wants to close the software. 
rl.on("line", (line) => {
    if(line && line.startsWith(COMMAND_CHARACTER)){
        let command = line.substring(line.indexOf(COMMAND_CHARACTER) + 1);
        let args = [];
        if(command.includes(COMMAND_ARGUMENT_DELIMITER)){
            let commandParts = command.split(COMMAND_ARGUMENT_DELIMITER);
            command = commandParts.splice(0, 1);
            args = commandParts;
        }
        console.log("Command:", command, "Args:", args);
        if(hasCommand(command)){
            executeCommand(command, ...args);
        }else{
            console.log("Error: Command \""+command+"\" could not be found. Run \""+COMMAND_CHARACTER+"help\" for a list of available commands.");
        }
    }
})

rl.once("close", () => {
    COMMANDS['exit'].command();
});

// Load our capabilities
loadCapabilities();

// Helper functions for commands.
function loadCapabilities(){
    // Get all of the subdirectories in our capabilities forlder. 
    let directories = fs.readdirSync(CAPABILITIES_DIRECTORY);

    // Iterate through the list of found capabilities. 
    for(let dir of directories){
        // Check that the dir has the the expected file. 
        let subDirPath = CAPABILITIES_DIRECTORY+"/"+dir;
        let capabilityDefinition = dir+".jsonc";

        // Check if the capability file exists
        let filePath = subDirPath+"/"+capabilityDefinition;

        if(directoryExists(filePath)){
            capabilities.set(dir, requireJSON(filePath));
        }
        
    }
}


function listCapabilities(){
    console.log(capabilities.keys())
}

function directoryExists(filePath){
    try{
        console.log(filePath)
        let stats = fs.statSync(filePath, {});
        if(stats){
            return true;
        }
    }catch(error){}
    return false;
}

// Build command 
function buildDeviceSource(device){
    // First lets check if this is a valid device.
    let deviceSpecificDirectory = DEVICES_DIRECTORY + "/" + device;

    console.log("Searching for:", deviceSpecificDirectory);
    if(directoryExists(deviceSpecificDirectory)){
        let deviceConfigPath = deviceSpecificDirectory + "/config.jsonc";
        if(directoryExists(deviceConfigPath)){
            let deviceConfig = requireJSON(deviceConfigPath);
            
            if(deviceConfig && deviceConfig['capabilities'] && Array.isArray(deviceConfig['capabilities'])){
                let foundCapabilities = [];
                let unknownCapabilities = [];

                // Check what capabilites we have found.
                for(let capability of deviceConfig.capabilities){
                    if(capabilities.has(capability)){
                        foundCapabilities.push(capability);
                    }else{
                        unknownCapabilities.push(capability);
                    }
                }

                console.log("Found", foundCapabilities, "Missing:", unknownCapabilities);

                // Now we gotta generate all of the code for our device based on its capabilities.
                for(let capabilityName of foundCapabilities){
                    let capability = capabilities.get(capabilityName);
                }
            }
        }
    }
}