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

// Define our Software
const SOFTWARE_NAME = "SkyTek Manager";
const COMMAND_CHARACTER = "/";

// Welome to 
console.log(SOFTWARE_NAME);

/**
 * Define all of the commands which a user can use to create and manage SkyTek Software.
 */
const COMMANDS = {
    "help":{
        "description":"Prints out a listing of all commands which can be executed.",
        "command": () => {
            // Iterate through each key of our COMMANDS and print out each command's description.
            for(let key of Object.keys(COMMANDS)){
                printDetails(key);
            }
        }
    },
    "products":{
        "description":"Lists all of the available products that we currently produce.",
        "command": () => {
            
        }
    },
    "capabilities":{
        "description":"Lists all of the available capabilities of this SkyTek environment as well as plugins.",
        "command": () => {
            listCapabilities();
        }
    },
    "exit":{
        "description":"Exits the software",
        "command": () => {
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
        if(hasCommand(command)){
            executeCommand(command);
        }else{
            console.log("Error: Command \""+command+"\" could not be found. Run \""+COMMAND_CHARACTER+"help\" for a list of available commands.");
        }
    }
})

rl.once("close", () => {
    COMMANDS['exit'].command();
});


// Helper functions for commands.
function listCapabilities(){
    // Get all of the subdirectories in our capabilities forlder. 
    let directories = fs.readdirSync(CAPABILITIES_DIRECTORY);

    // Create a Map mapping the capability name to the json definition file.
    let capabilities = new Map();

    // Iterate through the list of found capabilities. 
    for(let dir of directories){
        // Check that the dir has the the expected file. 
        let subDirPath = CAPABILITIES_DIRECTORY+"/"+dir;
        let capabilityDefinition = dir+".jsonc";

        // Check if the capability file exists
        let filePath = subDirPath+"/"+capabilityDefinition;
        try{
            console.log(filePath)
            let stats = fs.statSync(filePath, {});
            if(stats){
                capabilities.set(dir, requireJSON(filePath));
            }
        }catch(error){
            // If there is an error
            console.log(error)
        }
    }

    console.log(capabilities.keys())
}