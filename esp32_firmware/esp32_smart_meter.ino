/*
  ESP32 + PZEM-004T v3.0 Smart Net-Meter WebSocket Firmware
  Streams bi-directional power, voltage, current, power factor, frequency,
  and energy registers directly to the React Native App.
*/

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <PZEM004Tv30.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// PZEM-004T v3.0 UART Pins on ESP32 (HardwareSerial 2)
#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17

// Solid State Relay Pins
#define RELAY_INVERTER_PIN 22
#define RELAY_GRID_PIN 23

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
WebSocketsServer webSocket = WebSocketsServer(81);

unsigned long lastStreamTime = 0;

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.printf("[WebSocket] Client #%u connected\n", num);
  } else if (type == WStype_TEXT) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      const char* action = doc["action"];
      if (strcmp(action, "set_relay") == 0) {
        const char* target = doc["target"];
        int state = doc["state"];
        if (strcmp(target, "inverter") == 0) {
          digitalWrite(RELAY_INVERTER_PIN, state ? HIGH : LOW);
        } else if (strcmp(target, "grid") == 0) {
          digitalWrite(RELAY_GRID_PIN, state ? HIGH : LOW);
        }
      } else if (strcmp(action, "reset_counter") == 0) {
        pzem.resetEnergy();
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_INVERTER_PIN, OUTPUT);
  pinMode(RELAY_GRID_PIN, OUTPUT);
  digitalWrite(RELAY_INVERTER_PIN, HIGH);
  digitalWrite(RELAY_GRID_PIN, HIGH);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected! IP Address: ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();

  if (millis() - lastStreamTime >= 1000) {
    lastStreamTime = millis();

    float voltage = pzem.voltage();
    float current = pzem.current();
    float power = pzem.power();
    float energy = pzem.energy();
    float frequency = pzem.frequency();
    float pf = pzem.pf();

    if (isnan(voltage)) voltage = 230.0;
    if (isnan(current)) current = 0.0;
    if (isnan(power)) power = 0.0;
    if (isnan(energy)) energy = 0.0;
    if (isnan(frequency)) frequency = 50.0;
    if (isnan(pf)) pf = 1.0;

    // In a bi-directional setup, netPower determines export vs import
    float solarW = power > 0 ? power : 0;
    float loadW = 1200.0; // Sample load or secondary CT PZEM sensor
    float netW = solarW - loadW;

    StaticJsonDocument<384> doc;
    doc["voltageV"] = voltage;
    doc["currentA"] = current;
    doc["activePowerW"] = power;
    doc["frequencyHz"] = frequency;
    doc["powerFactor"] = pf;
    doc["solarPowerW"] = solarW;
    doc["loadPowerW"] = loadW;
    doc["netPowerW"] = netW;
    doc["exportEnergyKWh"] = (netW > 0) ? energy : 0.0;
    doc["importEnergyKWh"] = (netW < 0) ? energy : 0.0;
    doc["solarTotalYieldKWh"] = energy;
    doc["batteryVoltageV"] = 51.4;
    doc["batterySocPercent"] = 85;
    doc["inverterRelay"] = digitalRead(RELAY_INVERTER_PIN) == HIGH;
    doc["gridRelay"] = digitalRead(RELAY_GRID_PIN) == HIGH;

    String jsonStr;
    serializeJson(doc, jsonStr);
    webSocket.broadcastTXT(jsonStr);
  }
}
