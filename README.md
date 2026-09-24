# PV Smart Net-Meter Mobile App (React Native / Expo / TypeScript)

A modern mobile telemetry and control dashboard for **Solar PV Bi-Directional Net-Metering** powered by **ESP32** and **PZEM-004T v3.0** electrical energy monitors.

---

## 📱 Features

1. **Live Power Telemetry (`Live Power` Tab)**
   - Bi-directional net power flow (`P_net = P_solar - P_load`)
   - Real-time surplus export / grid import indicator
   - High-accuracy electrical parameters: Voltage (V), RMS Current (A), Active Power (W), Frequency (Hz), Power Factor (PF)
   - Energy counters: Accumulated Export (kWh), Import (kWh), Total Solar Yield (kWh)

2. **Energy Analytics (`Analytics` Tab)**
   - Hourly profile comparison (Solar Generation vs Household Load)
   - 7-Day Net Energy Production yield
   - Self-Consumption Ratio (%) and Grid Independence Index (%)
   - Net energy balance and weekly summary tables

3. **Net Metering & Billing (`Billing & ROI` Tab)**
   - Itemized DISCOM / Utility bill calculation
   - Solar feed-in tariff credit deductions & net payable total
   - Dynamic Tariff Configurator (Import rate, Export credit, Fixed meter charges)
   - Carbon offset calculator (CO₂ saved in kg & trees equivalent)

4. **System & Hardware Controls (`Controls` Tab)**
   - ESP32 local network IP bridge configuration (`ws://<IP>:81`)
   - Solid-state relay control for Solar Inverter and Grid-Tie synchronization
   - PZEM-004T EEPROM counter reset with confirmation dialogs
   - System alert feed and hardware diagnostic metrics

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Expo Development Server
```bash
npx expo start
```

### 3. Open on Your Phone
- Download the **Expo Go** app from Google Play Store or Apple App Store.
- Scan the QR code displayed in your terminal using the Expo Go app (Android) or the Camera app (iOS).
- You can also press `w` to preview in the web browser.

---

## 🛠️ Project Structure

```
pv-smart-netmeter/
├── App.tsx                      # Main application entry point with Tab navigation
├── app.json                     # Expo configuration
├── babel.config.js              # Babel preset config
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript strict configuration
├── src/
│   ├── context/
│   │   └── TelemetryContext.tsx # Central telemetry provider & simulation fallback
│   ├── screens/
│   │   ├── DashboardScreen.tsx  # Live power flow & electrical dials
│   │   ├── AnalyticsScreen.tsx  # Generation vs load analytics & KPI charts
│   │   ├── BillingScreen.tsx    # Net tariff bill breakdown & tariff editor
│   │   └── ControlScreen.tsx    # ESP32 IP bridge & relay breaker controls
│   ├── services/
│   │   └── esp32Service.ts      # WebSocket communication layer
│   └── types/
│       └── index.ts             # TypeScript interfaces for telemetry & tariffs
└── esp32_firmware/
    └── esp32_smart_meter.ino    # Arduino sketch for ESP32 + PZEM-004T v3.0
```

---

## ⚡ Hardware Wiring & Architecture

- **Microcontroller**: ESP32-WROOM-32
- **Energy Meter**: PZEM-004T v3.0 connected via UART (`RX: GPIO 16`, `TX: GPIO 17`)
- **Current Transformer**: 100A Split-Core CT clamped to mains bi-directional line
- **Actuators**: 2-Channel 5V/3.3V Relay Module (`GPIO 22` & `GPIO 23`)
- **Transport**: Real-time WebSocket streaming over LAN on port `81` (`ws://<ESP32_IP>:81`)
