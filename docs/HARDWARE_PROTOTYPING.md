# 🔌 Hardware Programming & Simulation Guide

This guide covers how to program hardware (Arduino/ESP32) and simulate it for prototyping smart dustbins.

## 🎯 Overview

For the EcoRewards smart dustbin, you'll need:
- **Microcontroller**: Arduino/ESP32 (ESP32 recommended for WiFi)
- **Sensors**: Ultrasonic, Load Cell (weight sensor), IR proximity
- **Actuators**: Servo motor (auto lid), LED indicators
- **Connectivity**: WiFi module for real-time data transmission

---

## 🛠️ Hardware Simulation Tools

### 1. **Wokwi** (Recommended ⭐)
**Best for**: ESP32, Arduino simulations with WiFi

**Features**:
- Free, browser-based
- Supports ESP32, Arduino, Raspberry Pi Pico
- Real-time code execution
- WiFi simulation (perfect for Firebase integration)
- Component library (sensors, displays, motors)
- Serial monitor for debugging

**Getting Started**:
1. Go to https://wokwi.com
2. Create new project → Select ESP32 or Arduino
3. Add components (sensors, actuators)
4. Write code in Arduino IDE syntax
5. Run simulation and debug

**Example Project Structure**:
```
wokwi-project/
├── diagram.json (circuit layout)
├── code.ino (Arduino code)
└── wokwi.toml (config)
```

---

### 2. **Tinkercad Circuits**
**Best for**: Beginners, Arduino basics

**Features**:
- Free, browser-based
- Drag-and-drop components
- Code blocks + Arduino C++
- Great for learning

**Limitations**:
- No ESP32 support
- Limited WiFi simulation
- Less realistic than Wokwi

---

### 3. **Proteus**
**Best for**: Advanced simulations, professional prototyping

**Features**:
- Professional-grade simulation
- Extensive component library
- PCB design capabilities

**Limitations**:
- Paid software
- Steeper learning curve

---

## 💻 Setting Up Arduino/ESP32 Development

### Installation Steps

#### 1. **Arduino IDE Setup**
```bash
# Download from https://www.arduino.cc/en/software
# Or use Arduino CLI for command-line
```

#### 2. **ESP32 Board Support**
Add ESP32 board manager URL:
```
File → Preferences → Additional Boards Manager URLs
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

Install ESP32 board package:
```
Tools → Board → Boards Manager → Search "ESP32" → Install
```

#### 3. **Required Libraries**
```cpp
// Install via Library Manager or manually:
- Firebase ESP32 Client
- ArduinoJson
- WiFi
- HX711 (for load cell)
- Servo
```

---

## 📝 Smart Dustbin Code Template

### Basic ESP32 Structure

```cpp
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <HX711.h>  // Load cell
#include <Servo.h>  // Lid motor

// WiFi Credentials
#define WIFI_SSID "your-wifi"
#define WIFI_PASSWORD "your-password"

// Firebase
#define FIREBASE_HOST "your-project.firebaseio.com"
#define FIREBASE_AUTH "your-secret-key"

FirebaseData fbdo;
HX711 scale;
Servo lidServo;

// Pins
const int TRIGGER_PIN = 5;   // Ultrasonic trigger
const int ECHO_PIN = 18;     // Ultrasonic echo
const int SERVO_PIN = 19;    // Lid servo
const int LOAD_DOUT = 21;    // Load cell data
const int LOAD_SCK = 22;     // Load cell clock
const int LED_PIN = 2;       // Status LED

// Dustbin ID (unique per bin)
const String DUSTBIN_ID = "BIN001";

void setup() {
  Serial.begin(115200);
  
  // Initialize WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  
  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  
  // Initialize sensors
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  scale.begin(LOAD_DOUT, LOAD_SCK);
  scale.set_scale(2280.f); // Calibration factor
  scale.tare();
  
  lidServo.attach(SERVO_PIN);
  lidServo.write(0); // Closed position
  
  Serial.println("Smart Dustbin Ready!");
}

void loop() {
  // Check for QR code scan (via Firebase)
  if (checkQRCodeScanned()) {
    openLid();
    delay(5000); // Wait 5 seconds for deposit
    validateDeposit();
    closeLid();
  }
  
  // Monitor bin capacity
  checkBinCapacity();
  
  delay(1000);
}

bool checkQRCodeScanned() {
  // Read from Firebase: /dustbins/{DUSTBIN_ID}/status/scanRequest
  if (Firebase.getBool(fbdo, "/dustbins/" + DUSTBIN_ID + "/status/scanRequest")) {
    if (fbdo.boolData()) {
      // Reset the flag
      Firebase.setBool(fbdo, "/dustbins/" + DUSTBIN_ID + "/status/scanRequest", false);
      return true;
    }
  }
  return false;
}

void openLid() {
  lidServo.write(90); // Open position
  digitalWrite(LED_PIN, HIGH); // Green light
  Serial.println("Lid opened");
}

void closeLid() {
  lidServo.write(0); // Closed position
  digitalWrite(LED_PIN, LOW);
  Serial.println("Lid closed");
}

void validateDeposit() {
  // Get initial weight
  float initialWeight = scale.get_units(10);
  
  delay(2000);
  
  // Get final weight
  float finalWeight = scale.get_units(10);
  float depositWeight = finalWeight - initialWeight;
  
  // Validate minimum weight (10g = 0.01kg)
  if (depositWeight >= 0.01) {
    // Check ultrasonic sensor (distance decreased = item inside)
    long distance = getUltrasonicDistance();
    
    if (distance < 10) { // Item detected inside
      // Send validation to Firebase
      FirebaseJson depositData;
      depositData.set("weight", depositWeight);
      depositData.set("timestamp", Firebase.getCurrentTime());
      depositData.set("validated", true);
      
      Firebase.setJSON(fbdo, "/dustbins/" + DUSTBIN_ID + "/lastDeposit", depositData);
      Firebase.setBool(fbdo, "/dustbins/" + DUSTBIN_ID + "/status/depositValidated", true);
      
      Serial.println("Deposit validated! Weight: " + String(depositWeight) + " kg");
    } else {
      Serial.println("Validation failed: No item detected");
    }
  } else {
    Serial.println("Validation failed: Weight too low");
  }
}

long getUltrasonicDistance() {
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  long distance = (duration * 0.034) / 2; // cm
  
  return distance;
}

void checkBinCapacity() {
  float currentWeight = scale.get_units(5);
  
  // Update Firebase with current capacity
  Firebase.setFloat(fbdo, "/dustbins/" + DUSTBIN_ID + "/capacity/current", currentWeight);
  Firebase.setFloat(fbdo, "/dustbins/" + DUSTBIN_ID + "/capacity/max", 50.0); // 50kg max
  
  float capacityPercent = (currentWeight / 50.0) * 100;
  Firebase.setFloat(fbdo, "/dustbins/" + DUSTBIN_ID + "/capacity/percent", capacityPercent);
  
  if (capacityPercent >= 90) {
    // Alert: Bin almost full
    Firebase.setBool(fbdo, "/dustbins/" + DUSTBIN_ID + "/alerts/full", true);
  }
}
```

---

## 🎮 Wokwi Simulation Setup

### 1. Create Project Structure

Create `diagram.json`:
```json
{
  "version": 1,
  "author": "EcoRewards Team",
  "editor": "wokwi",
  "parts": [
    { "type": "esp32-devkit-v1", "id": "esp1", "top": 0, "left": 0 },
    { "type": "wokwi-ultrasonic-distance-sensor", "id": "sensor1", "top": 200, "left": 0 },
    { "type": "wokwi-hx711", "id": "scale1", "top": 300, "left": 0 },
    { "type": "wokwi-servo", "id": "servo1", "top": 400, "left": 0 },
    { "type": "wokwi-led", "id": "led1", "top": 500, "left": 0 }
  ],
  "connections": [
    [ "esp1:GPIO5", "sensor1:TRIG", "green", [ "h0" ] ],
    [ "esp1:GPIO18", "sensor1:ECHO", "yellow", [ "h0" ] ],
    [ "esp1:GPIO21", "scale1:DOUT", "blue", [ "h0" ] ],
    [ "esp1:GPIO22", "scale1:SCK", "purple", [ "h0" ] ],
    [ "esp1:GPIO19", "servo1:SIG", "orange", [ "h0" ] ],
    [ "esp1:GPIO2", "led1:A", "red", [ "h0" ] ]
  ]
}
```

### 2. Create `code.ino`
Paste the Arduino code above.

### 3. Create `wokwi.toml`
```toml
[wokwi]
version = 1
firmware = 'code.ino'

[env.esp32]
platform = espressif32
board = esp32dev
framework = arduino

lib_deps = 
    firebase-esp32-client
    olikraus/U8g2
    adafruit/HX711
    servo
```

---

## 🔄 Integration with Your Firebase Backend

### Firebase Structure

```
firebase-database/
├── dustbins/
│   ├── BIN001/
│   │   ├── location/
│   │   │   ├── lat: 28.6139
│   │   │   └── lng: 77.2090
│   │   ├── status/
│   │   │   ├── scanRequest: false
│   │   │   └── depositValidated: false
│   │   ├── capacity/
│   │   │   ├── current: 25.5
│   │   │   ├── max: 50.0
│   │   │   └── percent: 51.0
│   │   └── lastDeposit/
│   │       ├── weight: 1.2
│   │       ├── timestamp: 1234567890
│   │       └── validated: true
```

### When User Scans QR Code (from your React app)

```javascript
// In your React app
import { ref, set } from 'firebase/database';

const handleQRCodeScan = async (dustbinCode) => {
  // Trigger hardware to open lid
  await set(ref(db, `dustbins/${dustbinCode}/status/scanRequest`), true);
  
  // Monitor for deposit validation
  const depositRef = ref(db, `dustbins/${dustbinCode}/status/depositValidated`);
  onValue(depositRef, (snapshot) => {
    if (snapshot.val() === true) {
      // Deposit validated! Award points
      awardPoints();
      
      // Reset flag
      set(ref(db, `dustbins/${dustbinCode}/status/depositValidated`), false);
    }
  });
};
```

---

## 🧪 Testing Without Hardware (Mock Simulation)

### Mock Hardware Service for Development

Create `src/services/mockHardware.js`:

```javascript
// Mock hardware service for development/testing
export class MockHardware {
  constructor(dustbinId) {
    this.dustbinId = dustbinId;
    this.isLidOpen = false;
    this.currentWeight = 0;
    this.isDepositValid = false;
  }

  async openLid() {
    console.log(`[Mock Hardware] Opening lid for ${this.dustbinId}`);
    this.isLidOpen = true;
    
    // Simulate lid opening
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  async validateDeposit() {
    console.log(`[Mock Hardware] Validating deposit...`);
    
    // Simulate sensor reading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Random validation (90% success rate for testing)
    this.isDepositValid = Math.random() > 0.1;
    
    if (this.isDepositValid) {
      // Simulate weight measurement (0.1 to 5 kg)
      this.currentWeight = (Math.random() * 4.9 + 0.1).toFixed(2);
    }
    
    return {
      valid: this.isDepositValid,
      weight: parseFloat(this.currentWeight)
    };
  }

  async closeLid() {
    console.log(`[Mock Hardware] Closing lid`);
    this.isLidOpen = false;
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  async checkCapacity() {
    // Simulate capacity check
    return {
      current: this.currentWeight,
      max: 50,
      percent: (this.currentWeight / 50) * 100
    };
  }
}

// Use in development
if (process.env.NODE_ENV === 'development') {
  window.mockHardware = new MockHardware('BIN001');
}
```

---

## 📚 Additional Resources

### Tutorials & Documentation
- **Wokwi Docs**: https://docs.wokwi.com
- **ESP32 Arduino Core**: https://github.com/espressif/arduino-esp32
- **Firebase ESP32**: https://github.com/mobizt/Firebase-ESP32
- **HX711 Library**: https://github.com/bogde/HX711

### Circuit Design Tools
- **Fritzing**: https://fritzing.org (Circuit diagrams)
- **EasyEDA**: https://easyeda.com (PCB design)
- **KiCad**: https://www.kicad.org (Professional PCB)

### Sample Projects
- **IoT Smart Bin**: Search on GitHub
- **ESP32 Firebase Examples**: Firebase-ESP32 repository
- **Arduino Sensor Libraries**: Arduino Library Manager

---

## 🚀 Quick Start Checklist

- [ ] Install Arduino IDE or VS Code with PlatformIO
- [ ] Add ESP32 board support
- [ ] Install required libraries (Firebase, HX711, Servo)
- [ ] Create Wokwi account and project
- [ ] Design circuit diagram in Wokwi
- [ ] Write and test code in simulation
- [ ] Set up Firebase Realtime Database
- [ ] Connect hardware to WiFi
- [ ] Test Firebase communication
- [ ] Integrate with React frontend
- [ ] Deploy to physical hardware

---

## 🔧 Troubleshooting

### Common Issues

1. **WiFi Connection Failed**
   - Check credentials
   - Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
   - Check signal strength

2. **Firebase Connection Issues**
   - Verify Firebase project settings
   - Check database rules allow read/write
   - Ensure Firebase secret key is correct

3. **Sensor Reading Errors**
   - Calibrate load cell (use `scale.set_scale()`)
   - Check pin connections
   - Verify sensor power supply

4. **Simulation vs Real Hardware**
   - Sensors behave differently in simulation
   - Test on real hardware before deployment
   - Use mock service for development

---

## 📞 Next Steps

1. **Start with Wokwi**: Create a simulation project
2. **Prototype Circuit**: Add sensors and actuators
3. **Write Firmware**: Use the template code above
4. **Test Integration**: Connect to Firebase
5. **Build Physical Prototype**: Order components and assemble
6. **Deploy**: Install at test locations

---

*Happy Prototyping! 🔌✨*
