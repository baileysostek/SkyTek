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
#define VERSION "0.3" // Board Software Version

// Define our Serial speeds.
#define HOST_SERIAL_SPEED 115200
#define GPS_SERIAL_SPEED 9600

// Define our LED info
#define RGB_LED_PIN 6
unsigned long led_on_time = 0;
unsigned long led_off_time = 0;
unsigned long led_blink_duration = 0;
char led_r = 255;
char led_g = 255;
char led_b = 255;

// Define our configuration command characters
#define COMMAND_START_CHARACTER '/'
#define COMMAND_END_CHARACTER '\n'
#define COMMAND_BUFFER_SIZE 64
// This buffer stores commands that a user might send to the controller.
char command_buffer[COMMAND_BUFFER_SIZE] = {'\0'};
int command_message_index = 0; 

// set this to the hardware serial port you wish to use
#define NEMA_GPS Serial2       // Hardware Serial 2 is used for the NEMA GPS reciever.
#define REQUIRED_SATELLITES 4  // We need 4 satellites in view to determing GPS pos.
#define NEMA_MESSAGE_START_CHARACTER '$'
char message_buffer[256] = {'\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0', '\0'};
int message_index = 0; 

// Here are buffers for the NEMA messages.
char nema_op_buffer[4] = {'\0', '\0', '\0', '\0'};
#define NEMA_ARGUMENT_BUFFER_SIZE 16
char nema_argument_buffer[NEMA_ARGUMENT_BUFFER_SIZE] = {'\0','\0','\0','\0','\0','\0','\0','\0','\0','\0','\0','\0','\0','\0','\0','\0'};

// Here are all of the NEMA GPS varables which we need to store
float gps_lat;  // Lattitude
float gps_lng;  // Longitude
float gps_alt;  // Altitude
bool  gps_lock = false; // If we are connected to GPS sattelites or not.
int   gps_sattelites_in_view = 0;

char degrees[] = {'\0','\0','\0','\0','\0','\0'}; // Only need 6

// Define an enum for the NEMA GPS FIX levels
enum FixQuality {
  INVALID,
  GPS_FIX,
  DGPS_FIX
};

// LoRa Variables
#define HEARTBEAT_TRANSMISSION_FREQUENCY 1000000 // This is transmission time in microseconds. value / 1000000 = Hz
#define LORA_RADIO_FREQUENCY 915E6
char lora_packet[11 + 1 + 11] = {'\0'}; //-000.000000
unsigned long last_heartbeat = 0;
unsigned int heartbeats = 0;

// PYRO Channels
#define PYRO_CHANNELS 3 // 0 - Main | 1 - Drogue | 2 - Alternate

// Screen variables
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 32 // OLED display height, in pixels
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// RGB Variables
Adafruit_NeoPixel pixels(1, RGB_LED_PIN, NEO_RGB + NEO_KHZ800);

// TODO remove
// Variables needed for Enable and Disable
// This enables and disables the GPS, not really needed
#define ENABLE_PIN 14
bool enable = true;

// BMP 390 Barometric Pressure Sensor
#define SEALEVELPRESSURE_HPA (1013.25)
Adafruit_BMP3XX bmp;
float base_altitude = 0;
#define BMP_SAMPLES 4
float bmp_samples[BMP_SAMPLES] = {0};
int bmp_sample_index = 0;

float arming_altitude = 100;
float highest_altitude = 0;

// ADXL375 Accelerometer Variables
Adafruit_ADXL375 accel = Adafruit_ADXL375(12345);
#define ADXL_HZ 200.0
#define ADXL_SAMLE_RATE 1000000.0 / ADXL_HZ
#define ADXL_NOISE_FLOOR 0.20
bool adxl_found = false;
unsigned long accel_last = 0;

// Acceleration
double accel_last_x = 0.0;
double accel_last_y = 0.0;
double accel_last_z = 0.0;

// Velocity
double vel_x = 0.0;
double vel_y = 0.0;
double vel_z = 0.0;
double vel_last_x = 0.0;
double vel_last_y = 0.0;
double vel_last_z = 0.0;

// Position
double accel_pos_x = 0.0;
double accel_pos_y = 0.0;
double accel_pos_z = 0.0;

// Veraibles for representing if different pieces of hardware were found or not.
bool has_bmp = false;
bool has_lora = false;
bool has_screen = false;
bool has_gps = false;
bool has_accel = false;

// Variables for Kalman Filter


// Main timing info
double dt = 0;
unsigned long last_time = 0;

// Unit conversion
float m_to_ft = 3.28084;

// The units to display
enum Units {
  FEET,
  METERS
};

// Define an enum for the states our Flight Computer
enum FlightComputerState {
  CONFIGURATION,        // The flight computer is connected to the host software for configuration mode.
  BOOT,                 // Initialization Stuff
  SEARCH_GPS,           // Search For sattelitesx
  SEARCH_BASE_STATION,  // Search for a Base Station -Maybe this can happen during sattelite search
  FLIGHT_CONFIG,        // Once connected to base station, let user configure rocket for this flight.
  STANDBY,              // Wait for Rocket to be on the pad in the Upright direction
  SELECT_ROCKET
};

// Define our initial flight computer state. Initial state is BOOT
FlightComputerState state = BOOT;
bool connected_to_cpu = false;

void setup() {
  // Initialize our primary serial communication
  Serial.begin(HOST_SERIAL_SPEED); 

  // Initialize RGB LED
  pixels.begin(); // INITIALIZE NeoPixel strip object (REQUIRED)
  pixels.clear();
  pixels.show();

  // Initialize our GPS Serial Connection.
  NEMA_GPS.begin(GPS_SERIAL_SPEED);
  while (!NEMA_GPS); // Wait for NEMA_GPS serial to start.
  has_gps = true;

  // Print out the Version.
  Serial.printf("SkyTek controller Version:%s\n", VERSION);

  // Here we check to see if we have a serial connection on this port. If we do we put the controller into a settings mode that allows it to process commands.
  if(Serial){
    connected_to_cpu = true;
  }else{
    setState(BOOT);
  }

  // Start by initializing our display
  if(display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    has_screen = true;
    display.setRotation(90); // Rotate the Display
  }else{
    Serial.println("Error: Unable to communicate with screen.");
  }

  // Init LoRa
  LoRa.setPins(10, 9, 0);
  if (LoRa.begin(LORA_RADIO_FREQUENCY)) {
    has_lora = true;
  }else{
    // Cant Start LORA
    Serial.println("Error: Starting LoRa failed!");
  }

  // Configure enable
  pinMode(ENABLE_PIN,OUTPUT);
  digitalWrite(ENABLE_PIN, enable);

  init_bmp();

  // Init Accelerometer
  if(!accel.begin()){
    /* There was a problem detecting the ADXL375 ... check your connections */
    Serial.println("Ooops, no ADXL375 detected ... Check your wiring!");
  } else {
    has_accel = true;

    // Set the Rate at which we poll.
    accel.setDataRate(ADXL3XX_DATARATE_200_HZ);

     // init offsets to zero
    accel.setTrimOffsets(0, 0, 0);
    
    Serial.println("Hold accelerometer flat to set offsets to 0, 0, and -1g...");
    delay(1000);
    int16_t x, y, z;
    x = accel.getX();
    y = accel.getY();
    z = accel.getZ();
    Serial.print("Raw X: "); Serial.print(x); Serial.print("  ");
    Serial.print("Y: "); Serial.print(y); Serial.print("  ");
    Serial.print("Z: "); Serial.print(z); Serial.print("  ");Serial.println(" counts");

    // the trim offsets are in 'multiples' of 4, we want to round, so we add 2
    accel.setTrimOffsets(-(x+2)/4, 
                        -(y+2)/4, 
                        -(z-20+2)/4);  // Z should be '20' at 1g (49mg per bit)
  }

  // Initialize variables for the Kalman Filter
  last_time = micros();
}

// Initialization functions for all of our different modules and things.
void init_bmp(){
  // Init BMP
  if (!bmp.begin_I2C()) {  
    Serial.println("Could not find a valid BMP3 sensor, check wiring!");
    has_bmp = false;
  }else{
    has_bmp = true;
    // Calibrate our BMP and compute our starting value
    calibrateBMP();
  }
}

// Test method for all of our sensors


// The main loop for the program
void loop() {
  // Compute delta time
  unsigned long now = micros();
  dt = ((now - last_time) / 1000000.0);
  last_time = now;

  // Process commands sent to the SkyTek Device
  if(connected_to_cpu){
    bool parsing_command = false;
    while(Serial.available()){
      char command_character = (char)Serial.read();
      if(!parsing_command){
        if(command_character == COMMAND_START_CHARACTER){
          command_message_index = 0;
          parsing_command = true;
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

    // Decode which command the user indicated
    if(parsing_command){
      Serial.println(command_buffer);
      if (strcmp(command_buffer, "help") == 0) {
        // List available commands
      } else if (strcmp(command_buffer, "skytek") == 0) {
        // List software Version
        Serial.printf("SkyTek API Version:%s\n", SKYTEK_API_VERSION);
      } else if (strcmp(command_buffer, "version") == 0) {
        // List software Version
        Serial.printf("Board Software Version:%s\n", VERSION);
      } else if (strcmp(command_buffer, "connected") == 0) {
        // List Connected Devices
        Serial.println("Connected Devices:");
        // GPS
        Serial.printf("GPS Module: %s\n", has_gps ? "Connected" : "Disconnected");
        // RADIO
        Serial.printf("LoRa Module: %s\n", has_lora ? "Connected" : "Disconnected");
        // SCREEN
        Serial.printf("Screen Module: %s\n", has_screen ? "Connected" : "Disconnected");
        // PYRO Channels
        for(int i = 0; i < PYRO_CHANNELS; i++){
        Serial.printf("Pyro Channel %d:\n", i);
        }
        // BMP
        Serial.printf("Barometric Pressure Sensor: %s\n", has_bmp ? "Connected" : "Disconnected");
        // ACCELEROMETER
        Serial.printf("Accelerometer Accelerometer: %s\n", has_accel ? "Connected" : "Disconnected");

      } else if (strcmp(command_buffer, "reconnect") == 0) {
        // List Connected Devices
        Serial.println("Attempting to reconnect to Devices:");
        // GPS
        Serial.printf("GPS Module: %s\n", has_gps ? "Connected" : "Disconnected");
        // RADIO
        Serial.printf("LoRa Module: %s\n", has_lora ? "Connected" : "Disconnected");
        // SCREEN
        Serial.printf("Screen Module: %s\n", has_screen ? "Connected" : "Disconnected");
        // PYRO 1

        // PYRO 2

        // BMP
        init_bmp();
        Serial.printf("GPS Module: %s\n", has_bmp ? "Connected" : "Disconnected");
        // ACCELEROMETER
        Serial.printf("GPS Accelerometer: %s\n", has_accel ? "Connected" : "Disconnected");

      } else if (strcmp(command_buffer, "gps") == 0) {
        Serial.printf("{lat:%f,lng:%f}\n" , gps_lat, gps_lng);
      }else {
        Serial.printf("Error: Command '%s' was not recognised.\n", command_buffer);
      }
    }
    // Cleanup our buffers to do this again.
    for(int i = 0; i < command_message_index; i++){
      command_buffer[i] = '\0';
    }
  }

  // Do an action based on the current state of the flight computer
  switch(state){
    case BOOT:{
      // Maybe do an animation or display a bitmap.

      // Now we look for GPS
      setState(SEARCH_GPS);

      break;
    }
    case SEARCH_GPS:{
      // Read all of the serial data from the GPS
      check_gps();

      // If we got a screen connected try to display the connected information
      if(has_screen){
        display.clearDisplay();
        display.setTextSize(2); // Draw 2X-scale text
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(0, 0);
        display.println(F("Searching"));
        display.printf("%d / %d\n", gps_sattelites_in_view, REQUIRED_SATELLITES);
        display.display();      // Show initial text
      }

      // If we are now in a state where we have GPS Lock
      if(gps_lock){
        // Now that we have GPS Lock we need to Emit the event that states we have GPS lock.
        setState(SELECT_ROCKET);
      }

      break;
    }
    case SELECT_ROCKET:{ // TODO let a user select a flight-profile
      check_gps();

      if(has_screen){
        display.clearDisplay();
        display.setTextSize(1); // Draw 2X-scale text
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(0, 0);
        display.printf("lat:%f\n", gps_lat);
        display.printf("lng:%f\n", gps_lng);
        display.display();      // Show initial text
      }

      break;
    }
    default:{
      // TODO
    }
  }

  // Independant of Mode send the radio pings.

  // Beat if it is time to
  heartbeat(now);


  // digitalWrite(33, gps_lock);

  // Store initial BMP Values
  
  // Average BMP
  // printBMPValues();

  // printADXLValues(now);

  // Used to avoid delay
  update_led();
}

void heartbeat(unsigned long now){
  // If one second has elapsed since the last LoRa packet was sent, send another packet.
  if((now - last_heartbeat) >= HEARTBEAT_TRANSMISSION_FREQUENCY){
    // Stor the current time so we can determine when to send the next message.
    last_heartbeat = micros();

    switch(state){
      case SEARCH_GPS:{
        char sattelites_clamped = min(4, max(1, gps_sattelites_in_view));
        blink(sattelites_clamped * 100, sattelites_clamped, 0, 0, 255);
        break;
      }
      default:{
        blink(100, 255, 255, 255);
        break;
      }
    }

    // Send our LORA Data
    send_lora();

    // If connected to a computer also echo the packet over serial.
    if(connected_to_cpu){
      // Send Heartbeat over serial as well.
      Serial.printf("{id:%d,msg:%d}\n", 1, heartbeats);
    }

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
    case CONFIGURATION:{
      Serial.println("Connected to Computer!");
    }
    case SELECT_ROCKET:{
      // blink(100, 0, 0, 255);
    }
    default:{
      // Nothing
    }
  }
}

// Command handler to read and process the incomming serial commands from the SkyTek Flight Software.
void process_serial_command(){

}

// This is a blocking function which reads in all incomming data from the UART connected to the NEMA GPS board and updates our lat and lng positions.
void check_gps() {
  if(!has_lora){
    return;
  }
  // Take in all incomming characters from the GPS.
  while (NEMA_GPS.available()) {
    char gps_character = (char)NEMA_GPS.read();

    // When we find the nema string indicating a start 
    if(gps_character == NEMA_MESSAGE_START_CHARACTER || gps_character == '\n'){
      if(message_index > 0){
        // If valid, send the message.
        process_gps_message(message_buffer);

        // Clear out the message buffer
        for(int i = 0; i < message_index; i++){
          message_buffer[i] = '\0';
        }

        // Reset the message index
        message_index = 0;
      }
      continue;
    }

    // Increment the index
    message_buffer[message_index] = gps_character;
    message_index++;
    message_index %= 256;
  }
}

/**
  This function processes the NEMA GPS string that we recived from space.
*/
void process_gps_message(char* gps_message){
  int index = index_of(gps_message, ',');
  if(index != 5){
    return;
  }

  // If we get to this point we have a valid NEMA message, lets figure out its name.
  nema_op_buffer[0] = *(gps_message + 2);
  nema_op_buffer[1] = *(gps_message + 3);
  nema_op_buffer[2] = *(gps_message + 4);

  char* nema_sentence = nema_op_buffer;
  char* nema_data     = gps_message + 5;

  // Serial.println(nema_sentence);
  // Serial.println(nema_data);

  // Since we cant switch on strings we do this garbage.
  if(is_valid_message(nema_sentence, "GGA", nema_data, 14)){ // Global Positioning System Fix Data
    // Determine if we have a GPS FIX or not.
    int fix_level = gps_parse_int(nema_data, 6);
    gps_lock = (fix_level >= 1);
    // Serial.printf("Lock:%d\n", fix_level);

    // Calculate the number of visible GPS sattelites.
    gps_sattelites_in_view = gps_parse_int(nema_data, 7);
    // Serial.printf("Sattelites:%d\n", gps_sattelites_in_view);

    if(gps_lock){
      char degree_minute_buffer[NEMA_ARGUMENT_BUFFER_SIZE];

      // N or S
      gps_parse_string(nema_data, 2);
      // Serial.printf("Lat1:%s\n" , nema_argument_buffer);
      strcpy(degree_minute_buffer, nema_argument_buffer);
      // Serial.printf("Lat2:%s\n" , degree_minute_buffer);
      gps_parse_string(nema_data, 3);
      // Serial.printf("Lat3:%s\n" , nema_argument_buffer);
      gps_lat = gps_to_decimal_degrees(degree_minute_buffer, nema_argument_buffer);

      // E or W
      gps_parse_string(nema_data, 4);
      strcpy(degree_minute_buffer, nema_argument_buffer);
      gps_parse_string(nema_data, 5);
      gps_lng = gps_to_decimal_degrees(degree_minute_buffer, nema_argument_buffer);

      // Serial.printf("Lat%f:\n" , gps_lat);
      // Serial.printf("Lng%f:\n" , gps_lng);
    }

    // Calculate the Altitude.
    gps_alt = gps_parse_float(nema_data, 8); // In Meters. We use Metric for everything.

    return;
  }

  if(is_valid_message(nema_sentence, "GLL", nema_data, 7)){ // Geographic position, latitude / longitude
    // If we have a GPS lock.
    if(gps_lock){

      char degree_minute_buffer[NEMA_ARGUMENT_BUFFER_SIZE];

      gps_parse_string(nema_data, 1);
      // Serial.printf("Lat1:%s\n" , nema_argument_buffer);
      strcpy(degree_minute_buffer, nema_argument_buffer);

      // Serial.printf("Lat2:%s\n" , degree_minute_buffer);
      gps_parse_string(nema_data, 2); // N or S
      // Serial.printf("Lat3:%s\n" , nema_argument_buffer);
      gps_lat = gps_to_decimal_degrees(degree_minute_buffer, nema_argument_buffer);

      gps_parse_string(nema_data, 3);
      strcpy(degree_minute_buffer, nema_argument_buffer);
      gps_parse_string(nema_data, 4); // E or W
      gps_lng = gps_to_decimal_degrees(degree_minute_buffer, nema_argument_buffer);

      // Serial.printf("Lat%f:\n" , gps_lat);
      // Serial.printf("Lng%f:\n" , gps_lng);
    }

    return;
  }
}

int index_of(char* message, char search){
  char* head = message;
  int length = strlen(message);
  for(int i = 0; i < length; i++){
    if(*head == search){
      return i;
    }
    head++;
  }
  return -1;
}

float gps_to_decimal_degrees(char* nema_position, char* quadrant){
  float pos = 0.0;

  int minute_characters = index_of(nema_position, '.');
  // Serial.printf("Offset to '.':%d\n", minute_characters);
  // if(minute_characters != 4 || minute_characters != 5){
  //   return 0.0; // Invalid
  // }
  int minute_index_start = minute_characters - 2;

  int degree_array_size = minute_index_start + 1;
  for(int i = 0; i <  minute_index_start; i++){
    degrees[i] = *(nema_position + i); 
  }
  degrees[degree_array_size - 1] = '\0';
  char* minutes = nema_position + minute_index_start; // Offset by index of '.'

  // Serial.printf("degrees:%s minutes:%s\n", degrees , minutes);
  // Serial.printf("degrees:%f,minutes:%f\n", atof(degrees), atof(minutes));

  pos = atof(degrees) + (atof(minutes) / 60.0);
  // Serial.printf("Pos:%f\n", pos);
  
  return pos;
}

void clear_nema_argument_buffer(){
  for(int i = 0; i < NEMA_ARGUMENT_BUFFER_SIZE; i++){
    nema_argument_buffer[i] = '\0';
  }
}


int gps_parse_int(char* gps_message, int index){
  if(gps_parse_string(gps_message, index)){
    return atoi(nema_argument_buffer);
  }
  return 0;
}

float gps_parse_float(char* gps_message, int index){
  if(gps_parse_string(gps_message, index)){
    return atof(nema_argument_buffer);
  }
  return 0.0;
}

// Finds the string delimited by index'index'
bool gps_parse_string(char* gps_message, int index){
  clear_nema_argument_buffer();
  
  char* search_index = gps_message;

  int cur_index = 0;
  int argument_length = 0;
  int message_length = strlen(gps_message);

  for(int i = 0; i < message_length; i++){
    // Search for commas
    if(*search_index == ','){ // Comma Delimited
      cur_index++;
      if(cur_index > index){ // We are now out of range.
        return true;
      }
      search_index++;
      continue;
    }

    // If the current character is not a comma.
    if(cur_index == index){
      nema_argument_buffer[argument_length] = *search_index;
      argument_length++;
      if(argument_length >= NEMA_ARGUMENT_BUFFER_SIZE){ // TODO 16 here should be a constant.
        return false;
      }
    }

    search_index++;
  }

  // If we ran out of characters to parse but we are still at the correct index, everything is fine.
  return (cur_index == index);
}

bool is_valid_message(char* nema_sentence, const char* expected_sentence, char* nema_data, int expected_delimiters){
  if(strcmp(nema_sentence, expected_sentence) == 0){
    char* data_copy = nema_data;
    int data_length= strlen(nema_data);
    int delimiter_count = 0;
    for(int i = 0; i < data_length; i++){
      if(*data_copy == ','){
        delimiter_count++;
      }
      data_copy++;
    }
    return delimiter_count == expected_delimiters;
  }
  return false;
}

// Define functions which get specific values like altitude or current_lat_long data.

// Define functions which interface with LORA and allow us to send messages.


// Radio functions
void send_lora(){
  // If we dont have a LoRa module return from thnis function.
  if(!has_lora){
    return;
  }

  // Write our float data into our buffer. 
  int size = 11;
  dtostrf(gps_lat, size, 6, lora_packet);
  lora_packet[size] = ',';
  dtostrf(gps_lng, size, 6, lora_packet + size + 1);

  // Start and send our LoRa packet to the base station.
  LoRa.beginPacket();
  LoRa.print(lora_packet);
  LoRa.endPacket();
}

// Try to Parse data coming from the base station
void parse_lora(){
  
  // try to parse packet
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    // received a packet
    Serial.print("Received packet '");

    // read packet
    while (LoRa.available()) {
      Serial.print((char)LoRa.read());
    }

    // print RSSI of packet
    Serial.print("' with RSSI ");
    Serial.println(LoRa.packetRssi());
  }

}

// Print the BMP390 Values
void printBMPValues(){
  // Serial.print("Temperature = ");
  // Serial.print(bmp.temperature);
  // Serial.println(" *C");

  // Serial.print("Pressure = ");
  // Serial.print(bmp.pressure / 100.0);
  // Serial.println(" hPa");

  // Serial.print("Approx. Altitude = ");
  
  bmp_samples[bmp_sample_index] = bmp.readAltitude(SEALEVELPRESSURE_HPA) - base_altitude;
  bmp_sample_index++;
  bmp_sample_index %= BMP_SAMPLES;
  float average_altitude = 0;
  for(int i = 0; i < BMP_SAMPLES; i++){
    average_altitude += bmp_samples[i];
  }
  average_altitude /= BMP_SAMPLES;
  Serial.println(average_altitude);
}

void calibrateBMP(){
  
  // Set up oversampling and filter initialization
  bmp.setTemperatureOversampling(BMP3_OVERSAMPLING_8X);
  bmp.setPressureOversampling(BMP3_OVERSAMPLING_4X);
  bmp.setIIRFilterCoeff(BMP3_IIR_FILTER_COEFF_3);
  bmp.setOutputDataRate(BMP3_ODR_50_HZ);

  delay(1000);
  bmp.readAltitude(SEALEVELPRESSURE_HPA); // The first reading is some times an outlier full of junk data.

  int samples = 10;
  float height = 0;
  for(int i = 0 ; i < samples; i++){
    delay(1000 / samples);
    float value = bmp.readAltitude(SEALEVELPRESSURE_HPA);
    Serial.print("test Elivation: "); Serial.println(value);
    height += value;
  }
  base_altitude = height / samples;
  Serial.print("Starting Elivation: "); Serial.println(base_altitude);
}

/**
  This function integrates our Acceleration to get a Velocity and Position estimate.
*/
void printADXLValues(unsigned long now){
    // There is a lockout so we dont integrate faster than we are geting data out of the sensor.
    if(now < (accel_last + ADXL_SAMLE_RATE)){
      return; // Not enough time has passed
    }

    // Compute the Delta Time
    double delta_time = ((now - accel_last) / 1000000.0);

    // Get a new Sample Rate
    sensors_event_t event;
    accel.getEvent(&event);

    // Integrate event over DT Acceleration Values
    // Record the previous acceleration

    // Acceleration NOW
    double accel_now_x = event.acceleration.x;
    double accel_now_y = event.acceleration.y;
    double accel_now_z = event.acceleration.z;

    // Low Pass Filter ACC

    // Calculate Change in Acceleration Over
    vel_x += (accel_now_x - accel_last_x) * delta_time; 
    vel_y += (accel_now_y - accel_last_y) * delta_time; 
    vel_z += (accel_now_z - accel_last_z) * delta_time; 

    // Add velocity to our position
    double impulse_x = (vel_x - vel_last_x);
    if(abs(impulse_x) <= ADXL_NOISE_FLOOR){
      impulse_x = 0;
    }
    double impulse_y = (vel_y - vel_last_y);
    if(abs(impulse_y) <= ADXL_NOISE_FLOOR){
      impulse_y = 0;
    }
    double impulse_z = (vel_z - vel_last_z);
    if(abs(impulse_z) <= ADXL_NOISE_FLOOR){
      impulse_z = 0;
    }

    // Add Impulse to the Position
    accel_pos_x += impulse_x;
    accel_pos_y += impulse_y;
    accel_pos_z += impulse_z;

    // Print values
    Serial.print("x:"); Serial.println(accel_pos_x);
    Serial.print("y:"); Serial.println(accel_pos_y);
    Serial.print("z:"); Serial.println(accel_pos_z);

    // Records the last time this was integrated.
    accel_last = now;

    // Record our last acceleration values.
    accel_last_x = accel_now_x;
    accel_last_y = accel_now_y;
    accel_last_z = accel_now_z;

    vel_last_x = vel_x;
    vel_last_y = vel_y;
    vel_last_z = vel_z;

    /* Get a new sensor event */
  // sensors_event_t event;
  // accel.getEvent(&event);

  /* Display the results (acceleration is measured in m/s^2) */
  // Serial.print(event.acceleration.x); Serial.print(",");
  // Serial.print(event.acceleration.y); Serial.print(",");
  // Serial.print(event.acceleration.z); Serial.print("\n");

}

// LED functions
void blink(int duration, char r, char g, char b){
  blink(duration, 1, r, g, b);
}

void blink(int duration, int blinks, char r, char g, char b){
  if (millis() < led_off_time) { // Blink In Progress
    // TODO Implement a buffering strategy
    return;
  }

  set_led(r, g, b);

  led_r = r;
  led_g = g;
  led_b = b;
  led_on_time = millis();
  led_off_time = led_on_time + duration;
  int blink_states = ((blinks * 2.0) - 1);
  led_blink_duration = duration / blink_states;
}

void set_led(char r, char g, char b){
  pixels.setPixelColor(0, pixels.Color(g, r, b));
  pixels.show(); 
}

void blank_led(){
  pixels.clear();
  pixels.show();
}

void update_led(){
  unsigned long now = millis();
  if (now >= led_off_time) {
    blank_led();
  } else {
    // Determine Blink Status
    if(((led_off_time - now) / led_blink_duration) % 2 == 1){
      blank_led();
    }else{
      set_led(led_r, led_g, led_b);
    }
  }
}
