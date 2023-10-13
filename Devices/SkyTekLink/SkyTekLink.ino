// Imports
#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_Sensor.h>
#include "Adafruit_BMP3XX.h"
#include <Adafruit_ADXL375.h>
#include <EEPROM.h>

// SkyTek is a a closed source project created by Bailey Sostek in May of 2023
#define SKYTEK_API_VERSION "1.0"
#define VERSION "0.1" // Board Software Version

// Define a list of capabilities
#define SKYTEK_CAPABILTIES "[\"gps\", \"tether\"]"

// Define our Serial speeds.
#define HOST_SERIAL_SPEED 115200
#define GPS_SERIAL_SPEED 9600


// Generated from Serial component
// Define our configuration command characters
#define COMMAND_START_CHARACTER '/'
#define COMMAND_END_CHARACTER '\n'
#define COMMAND_BUFFER_SIZE 64

// This buffer stores commands that a user might send to the controller. Used for RELAY modes.
#define DATA_END_CHARACTER '}'
char command_buffer[COMMAND_BUFFER_SIZE] = {'\0'};
int command_message_index = 0; 

// This buffer stores command responses that may be transmit to a computer over serial.
#define RESPONSE_BUFFER_SIZE 256
int response_buffer_index = 0; 
char response_buffer[RESPONSE_BUFFER_SIZE] = {'\0'};

// UUID for message response handling
#define UUID_COMMAND_DELIMTER ':'
#define UUID_SIZE 32
char query_uuid_buffer[UUID_SIZE+1] = {'\0'};

// [@LoRa#V1] Heartbeat Variables
#define HEARTBEAT_TRANSMISSION_FREQUENCY 1000000 // This is transmission time in microseconds. value / 1000000 = Hz
#define LORA_RADIO_FREQUENCY 915E6
char lora_packet[11 + 1 + 11] = {'\0'}; //-000.000000
bool has_lora = false;

// [@SkyTekCore#V1] Heartbeat Variables
unsigned long last_heartbeat = 0;
unsigned int heartbeats = 0;


// Main timing info
double dt = 0;
unsigned long last_time = 0;

// Unit conversion
float m_to_ft = 3.28084;

// Define an enum for the states our Flight Computer
enum FlightComputerState {
  BOOT,    // Initialization Stuff
  STANDBY, // Once Booted
};

// Define our initial flight computer state. Initial state is BOOT
FlightComputerState state = BOOT;
bool connected_to_cpu = true;

// [@SkyTekCore#V1] Store the ID of this device in Memory, Initialize this value on boot from EEPROM
char device_uuid[UUID_SIZE + 1] = {'\0'}; // + 1 here is to Null Terminate our string. 

void setup() {
  // Initialize our primary serial communication
  Serial.begin(HOST_SERIAL_SPEED); 

  // Set the UUID
  // EEPROM.write( 0, 0xC2);
  // EEPROM.write( 1, 0x8B);
  // EEPROM.write( 2, 0xE5);
  // EEPROM.write( 3, 0xFE);
  // // -
  // EEPROM.write( 4, 0x68);
  // EEPROM.write( 5, 0x0E);
  // // -
  // EEPROM.write( 6, 0x43);
  // EEPROM.write( 7, 0xA1);
  // // -
  // EEPROM.write( 8, 0xBE);
  // EEPROM.write( 9, 0x51);
  // // -
  // EEPROM.write(10, 0x0B);
  // EEPROM.write(11, 0xA4);
  // EEPROM.write(12, 0x6D);
  // EEPROM.write(13, 0x06);
  // EEPROM.write(14, 0xE3);
  // EEPROM.write(15, 0xFD);

  // Read UUID out of EEPROM
  for(int i = 0; i < UUID_SIZE / 2; i++){
    char value = EEPROM.read(i);
    char upperNibble = value >> 4;
    char lowerNibble = value & 0B00001111;
    device_uuid[i * 2 + 0] = upperNibble + (upperNibble < 10 ? '0' : 'A' - 10);
    device_uuid[i * 2 + 1] = lowerNibble + (lowerNibble < 10 ? '0' : 'A' - 10);
  }

  Serial.printf("Device UUID:%s\n", device_uuid);

  // Init LoRa
  LoRa.setPins(10, 9, 0);
  if (LoRa.begin(LORA_RADIO_FREQUENCY)) {
    has_lora = true;
  }else{
    // Cant Start LORA
    Serial.println("Error: Starting LoRa failed!");
  }

  // Initialize variables for the Kalman Filter
  last_time = micros();
}

// The main loop for the program
void loop() {
  // Compute delta time
  unsigned long now = micros();
  dt = ((now - last_time) / 1000000.0);
  last_time = now;

  // Process commands sent to the SkyTek Device
  if(connected_to_cpu){
    parse_serial_command();
  }

  // Do an action based on the current state of the flight computer
  switch(state){
    case BOOT:{
      // Maybe do an animation or display a bitmap.

      // Now we look for GPS
      setState(STANDBY);

      break;
    }
    case STANDBY:{
      parse_lora();
    }
    default:{
      // TODO
    }
  }

  // Heartbeat if it is time to
  heartbeat(now);
}

void heartbeat(unsigned long now){
  // If one second has elapsed since the last LoRa packet was sent, send another packet.
  if((now - last_heartbeat) >= HEARTBEAT_TRANSMISSION_FREQUENCY){
    // Stor the current time so we can determine when to send the next message.
    last_heartbeat = micros();

    switch(state){
      default:{
        break;
      }
    }

    // If connected to a computer also echo the packet over serial.
    // Send Heartbeat over serial as well.
    Serial.printf("{\"topic\":\"%s\",\"msg\":%d}\n", "/heartbeat", heartbeats);

    // Increment the Heartbeat Counter
    heartbeats++;
  }
}

// Methods used to transition state
void setState(FlightComputerState new_state) {
  // If we try to set the state to the current state, do nothing.
  if(state == new_state){
    return;
  }

  // Update the state
  state = new_state;
  switch(state){
    default:{
      // Nothing
    }
  }
}

// Command handler to read and process the incoming serial commands from the SkyTek Flight Software.
void parse_serial_command(){
  bool parsing_command = false;
  while(Serial.available()){
    char command_character = (char)Serial.read();
    if(!parsing_command){
      if(command_character == COMMAND_START_CHARACTER){
        // We know that we are now either parsing command data or a UUID.
        command_message_index = 0;
        parsing_command = true;

        while(Serial.available()){
          char uuid_character = (char)Serial.read();
          // Check that we have not hit the escape character.
          if(uuid_character == UUID_COMMAND_DELIMTER){
            // We have a real UUID so clear out our command buffer.
            for(int i = 0; i < command_message_index; i++){
              command_buffer[i] = '\0'; // Clear the command buffer
            }
            command_message_index = 0;
            break; // We have finished parsing our id. Up to 32 characters.
          }
          if(uuid_character == COMMAND_END_CHARACTER){
            // We did not get a UUID. clear out the UUID buffer
            for(int i = 0; i < command_message_index; i++){
              query_uuid_buffer[i] = '\0'; // Clear the command buffer
            }
            return process_serial_command();
          }
          
          // Process the UUID
          if(command_message_index < UUID_SIZE){
            query_uuid_buffer[command_message_index] = uuid_character;
            command_buffer[command_message_index] = uuid_character;
            command_message_index++;
          }else{
            break;
          }
        }
        continue;
      }
    }else{
      // Check if the current character is the "COMMAND_END_CHARACTER"
      if(command_character == COMMAND_END_CHARACTER){
        break;
      }
      // We recieved the start character
      command_buffer[command_message_index] = command_character;
      command_message_index++;
      if(command_message_index >= COMMAND_BUFFER_SIZE){
        Serial.println("Error: Command too long.");
        parsing_command = false;
        break;
      }
    }
  }
  // Any Components which define messages with a "QUERY" interface will have their query code inserted below.
  // Decode which command the user indicated
  if(parsing_command){
    process_serial_command();
  }
}

void process_serial_command(){
  if (strcmp(command_buffer, "skytek") == 0) {
    // List software Version
    Serial.printf("{\"id\":\"%s\",\"uuid\":\"%s\",\"version\":\"%s\"}\n", query_uuid_buffer, device_uuid, SKYTEK_API_VERSION);
  }  else if (strcmp(command_buffer, "capabilities") == 0) {
    // Query response listing all of our capabilities.
    Serial.printf("{\"id\":\"%s\",\"uuid\":\"%s\",\"capabilities\":%s}\n", query_uuid_buffer, device_uuid, SKYTEK_CAPABILTIES); // Substitute our capabilities in as a literal array.
  } else {
    Serial.printf("Error: Command '%s' was not recognised.\n", command_buffer);
  }
  // Cleanup our buffers to do this again.
  for(int i = 0; i < command_message_index; i++){
    command_buffer[i] = '\0';
  }
}

// Try to Parse data coming from the base station
void parse_lora(){
  // try to parse packet
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    // received a packet
    // Serial.print("Received packet '");

    // read packet
    response_buffer_index = 0;
    while (LoRa.available() && response_buffer_index < RESPONSE_BUFFER_SIZE) {
      // Store the message
      char packet_character = (char)LoRa.read();

      // If we have not hit an escape character, append the new character to our string.
      response_buffer[response_buffer_index] = packet_character;

      // If we are at the end, continue
      if(packet_character == DATA_END_CHARACTER){
        break;
      } else {
        // Increment our counter and continue
        response_buffer_index++;
      }
    }
    // We need to inject the attribute 'relay' into this message.
    if(true){ // If this device is acting as a relay
      // Replace the '}' with a Null Terminator
      response_buffer[response_buffer_index] = '\0';
      // Print this as a relay message.
      Serial.printf("%s,\"relay\":true,\"rssi\":%d}\n", response_buffer, LoRa.packetRssi());
    }else{
      // Print the message normally
      Serial.printf("%s\n", response_buffer);
    }

    // Here we need to clear the buffer content for the next message.
    for(int i = 0; i < response_buffer_index; i++){
      response_buffer[i] = '\0';
    }

    // // print RSSI of packet
    // Serial.print("' with RSSI ");
    // Serial.println(LoRa.packetRssi());
    // Serial.print("' with Snr ");
    // Serial.println(LoRa.packetSnr());
  }
}
