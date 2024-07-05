/**
 * Here we define the API used for both the SkyTek system and SkyTek devices 
 */

// Device Constants 
export const ADD_DEVICE    = "/addDevice";
export const REMOVE_DEVICE = "/removeDevice";
export const LIST_DEVICES = "/listDevices";

// Device Capabilities
export const DEVICE_CAPABILITIES = "/getRegisteredCapabilities"
export const DEVICE_CAPABILITY_DATA = "/getCapability/:capability/"