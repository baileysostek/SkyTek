// Imports
const { exit } = require("process");
const readline = require("readline");
const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout,
    terminal: false
})
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
        "description":"Lists all of the available products that we currently produce."
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
