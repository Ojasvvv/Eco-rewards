# Hardware Integration Guide

This document explains how the smart bin hardware integration works and how to connect real hardware.

## Overview

The smart bin system simulates communication with ESP32/Arduino hardware that controls:
- **Servo Motor**: Opens and closes the bin lid
- **Weight Sensor**: Validates trash deposits
- **Network Module**: Wi-Fi/Bluetooth communication

## Current Implementation

### Simulation Mode (Default)

The system uses `hardwareService.js` which simulates:
- Hardware connection with configurable delays
- Servo motor control (opening/closing with angle control)
- Weight sensor readings with validation
- Error handling and retries
- Signal validation

**Location**: `src/services/hardwareService.js`

### Flow Diagram

```
User Enters Code
    ↓
Location Validation
    ↓
Connect to Hardware (hardwareService.connectToBin)
    ↓
Send Open Command (hardwareService.openBin)
    ↓
Wait 10 seconds (bin stays open)
    ↓
Send Close Command (hardwareService.closeBin)
    ↓
Validate Deposit (hardwareService.validateDeposit)
    ↓
Credit Rewards
```

## Hardware Communication Methods

### Option 1: HTTP/REST API (Recommended)

The ESP32 runs a web server that accepts HTTP requests:

```javascript
// Example HTTP request
POST http://192.168.1.100/bin/open
Headers: { Authorization: "Bearer <token>", "X-Bin-Code": "AB123" }
Body: { "angle": 90, "duration": 10000 }
```

**Pros**: Simple, reliable, works over Wi-Fi
**Cons**: Requires ESP32 to maintain web server

### Option 2: MQTT (Real-time IoT)

Use MQTT broker for pub/sub messaging:

```javascript
// Subscribe to commands
Topic: smart-bin/AB123/command
Message: { "action": "open", "angle": 90 }

// Publish status
Topic: smart-bin/AB123/status
Message: { "status": "open", "timestamp": 1234567890 }
```

**Pros**: Real-time, scalable, standard IoT protocol
**Cons**: Requires MQTT broker setup

### Option 3: WebSocket (Real-time bidirectional)

Direct WebSocket connection for real-time communication:

```javascript
// WebSocket connection
ws://192.168.1.100:8080

// Send command
{ "type": "open", "binCode": "AB123", "angle": 90 }

// Receive status
{ "type": "status", "status": "open", "data": {...} }
```

**Pros**: Low latency, bidirectional
**Cons**: Connection management complexity

## Real Hardware Integration

To connect real hardware, modify `hardwareService.js`:

### Example: HTTP Integration

```javascript
// In hardwareService.js - openBin function
export async function openBin(binCode) {
  const esp32IP = getBinIPAddress(binCode); // Get IP from database/config
  
  const response = await fetch(`http://${esp32IP}/api/bin/open`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bin-Code': binCode,
    },
    body: JSON.stringify({
      angle: HARDWARE_CONFIG.SERVO.OPEN_ANGLE,
      duration: 10000, // 10 seconds
    }),
  });
  
  if (!response.ok) {
    throw new Error('Hardware command failed');
  }
  
  const result = await response.json();
  return {
    success: true,
    status: HardwareStatus.OPEN,
    data: result,
  };
}
```

### Example: MQTT Integration

```javascript
// Install: npm install mqtt
import mqtt from 'mqtt';

let mqttClient = null;

export function initializeMQTT(brokerUrl) {
  mqttClient = mqtt.connect(brokerUrl);
  
  mqttClient.on('connect', () => {
    console.log('[Hardware] MQTT connected');
  });
}

export async function openBin(binCode) {
  const commandTopic = `smart-bin/${binCode}/command`;
  const statusTopic = `smart-bin/${binCode}/status`;
  
  return new Promise((resolve, reject) => {
    // Subscribe to status updates
    mqttClient.subscribe(statusTopic);
    
    // Listen for status response
    mqttClient.once('message', (topic, message) => {
      if (topic === statusTopic) {
        const status = JSON.parse(message.toString());
        resolve({
          success: status.status === 'open',
          status: HardwareStatus.OPEN,
          data: status,
        });
      }
    });
    
    // Send open command
    mqttClient.publish(commandTopic, JSON.stringify({
      action: 'open',
      angle: HARDWARE_CONFIG.SERVO.OPEN_ANGLE,
    }));
    
    // Timeout after 5 seconds
    setTimeout(() => reject(new Error('Timeout')), 5000);
  });
}
```

## ESP32/Arduino Code Example

Here's example code for ESP32 that works with the HTTP API:

```cpp
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <Servo.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Servo motor
Servo lidServo;
const int SERVO_PIN = 14;
const int OPEN_ANGLE = 90;
const int CLOSE_ANGLE = 0;

// Weight sensor (HX711)
// #include "HX711.h"
// HX711 scale;
// const int DOUT_PIN = 16;
// const int SCK_PIN = 17;

AsyncWebServer server(80);

String binCode = "AB123"; // Unique bin identifier
int currentWeight = 0;
bool isOpen = false;
unsigned long openTime = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize servo
  lidServo.attach(SERVO_PIN);
  lidServo.write(CLOSE_ANGLE);
  
  // Initialize weight sensor
  // scale.begin(DOUT_PIN, SCK_PIN);
  // scale.tare();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
  
  // API Endpoints
  server.on("/api/bin/open", HTTP_POST, handleOpenBin);
  server.on("/api/bin/close", HTTP_POST, handleCloseBin);
  server.on("/api/bin/status", HTTP_GET, handleGetStatus);
  server.on("/api/bin/weight", HTTP_GET, handleGetWeight);
  
  server.begin();
  Serial.println("Server started");
}

void loop() {
  // Auto-close after 10 seconds
  if (isOpen && (millis() - openTime > 10000)) {
    closeBin();
  }
  
  // Read weight sensor periodically
  // currentWeight = scale.get_units(10);
  
  delay(100);
}

void handleOpenBin(AsyncWebServerRequest *request) {
  // Validate bin code from header
  String requestBinCode = request->header("X-Bin-Code");
  if (requestBinCode != binCode) {
    request->send(403, "application/json", "{\"error\":\"Invalid bin code\"}");
    return;
  }
  
  openBin();
  request->send(200, "application/json", 
    "{\"success\":true,\"status\":\"open\",\"angle\":" + String(OPEN_ANGLE) + "}");
}

void handleCloseBin(AsyncWebServerRequest *request) {
  String requestBinCode = request->header("X-Bin-Code");
  if (requestBinCode != binCode) {
    request->send(403, "application/json", "{\"error\":\"Invalid bin code\"}");
    return;
  }
  
  closeBin();
  request->send(200, "application/json", 
    "{\"success\":true,\"status\":\"closed\",\"angle\":" + String(CLOSE_ANGLE) + "}");
}

void handleGetStatus(AsyncWebServerRequest *request) {
  String json = "{";
  json += "\"binCode\":\"" + binCode + "\",";
  json += "\"status\":" + String(isOpen ? "\"open\"" : "\"closed\"") + ",";
  json += "\"weight\":" + String(currentWeight) + ",";
  json += "\"uptime\":" + String(millis() / 1000);
  json += "}";
  
  request->send(200, "application/json", json);
}

void handleGetWeight(AsyncWebServerRequest *request) {
  // Read current weight
  // currentWeight = scale.get_units(10);
  
  String json = "{\"weight\":" + String(currentWeight) + "}";
  request->send(200, "application/json", json);
}

void openBin() {
  lidServo.write(OPEN_ANGLE);
  isOpen = true;
  openTime = millis();
  Serial.println("Bin opened");
}

void closeBin() {
  lidServo.write(CLOSE_ANGLE);
  isOpen = false;
  Serial.println("Bin closed");
}
```

## Configuration

Update hardware configuration in `hardwareService.js`:

```javascript
const HARDWARE_CONFIG = {
  SERVO: {
    OPEN_ANGLE: 90,      // Adjust for your servo
    CLOSE_ANGLE: 0,
    OPEN_DELAY: 500,     // Time for servo to open
    CLOSE_DELAY: 800,
  },
  WEIGHT_SENSOR: {
    MIN_WEIGHT: 50,      // Minimum deposit weight (grams)
    MAX_WEIGHT: 5000,    // Maximum weight (grams)
    READING_DELAY: 500,  // Sensor reading delay
  },
  SIGNAL: {
    TIMEOUT: 5000,       // Response timeout
    RETRY_COUNT: 3,      // Retry attempts
    RETRY_DELAY: 1000,   // Delay between retries
  },
};
```

## Testing

### Test Hardware Service Directly

```javascript
import { connectToBin, openBin, closeBin, validateDeposit } from './services/hardwareService';

// Test connection
const result = await connectToBin('AB123');
console.log('Connection:', result);

// Test opening
const open = await openBin('AB123');
console.log('Open:', open);

// Test validation
const validate = await validateDeposit('AB123');
console.log('Validation:', validate);

// Test closing
const close = await closeBin('AB123');
console.log('Close:', close);
```

## Security Considerations

1. **Authentication**: Always validate bin codes server-side
2. **Rate Limiting**: Prevent abuse of hardware commands
3. **Network Security**: Use HTTPS/WSS for production
4. **Access Control**: Verify user permissions before hardware access
5. **Error Handling**: Graceful degradation if hardware unavailable

## Troubleshooting

### Connection Issues
- Check WiFi credentials
- Verify ESP32 IP address
- Check firewall settings
- Test with ping/curl

### Servo Not Responding
- Verify wiring and power supply
- Check servo angle range
- Test servo independently
- Verify pin connections

### Weight Sensor Issues
- Calibrate sensor (tare)
- Check wiring (DOUT, SCK pins)
- Verify sensor library installation
- Test with known weights

## Future Enhancements

- [ ] Real-time weight monitoring
- [ ] Bin capacity tracking
- [ ] Multiple servo control (recycling compartments)
- [ ] LED indicators
- [ ] Sound alerts
- [ ] Camera integration for validation
- [ ] Temperature/humidity sensors
- [ ] Battery level monitoring
- [ ] OTA firmware updates

