import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LiveTelemetry, TariffConfig, HourlyDataPoint, DailyDataPoint, SystemAlert } from '../types';
import { esp32Service } from '../services/esp32Service';

interface TelemetryContextType {
  telemetry: LiveTelemetry;
  isConnected: boolean;
  espIp: string;
  tariff: TariffConfig;
  alerts: SystemAlert[];
  hourlyHistory: HourlyDataPoint[];
  dailyHistory: DailyDataPoint[];
  setEspIp: (ip: string) => void;
  setTariff: (tariff: TariffConfig) => void;
  toggleRelay: (relay: 'inverter' | 'grid') => void;
  resetEnergyCounters: () => void;
  dismissAlert: (id: string) => void;
}

const defaultTelemetry: LiveTelemetry = {
  voltageV: 231.5,
  currentA: 4.85,
  activePowerW: 1120,
  frequencyHz: 50.02,
  powerFactor: 0.98,
  solarPowerW: 2450,
  loadPowerW: 1120,
  netPowerW: 1330,
  exportEnergyKWh: 34.85,
  importEnergyKWh: 18.20,
  solarTotalYieldKWh: 53.05,
  batteryVoltageV: 51.4,
  batterySocPercent: 86,
  inverterRelay: true,
  gridRelay: true,
  timestamp: new Date().toISOString(),
};

const defaultTariff: TariffConfig = {
  importRatePerKWh: 7.50, // e.g. INR or Cents
  exportCreditPerKWh: 4.25,
  fixedMonthlyCharge: 150.00,
  currencySymbol: '₹',
};

const initialHourly: HourlyDataPoint[] = [
  { hour: '06:00', solarW: 120, loadW: 650, netW: -530 },
  { hour: '08:00', solarW: 980, loadW: 820, netW: 160 },
  { hour: '10:00', solarW: 2150, loadW: 950, netW: 1200 },
  { hour: '12:00', solarW: 3200, loadW: 1400, netW: 1800 },
  { hour: '14:00', solarW: 2850, loadW: 1200, netW: 1650 },
  { hour: '16:00', solarW: 1600, loadW: 1100, netW: 500 },
  { hour: '18:00', solarW: 300, loadW: 1850, netW: -1550 },
  { hour: '20:00', solarW: 0, loadW: 1620, netW: -1620 },
];

const initialDaily: DailyDataPoint[] = [
  { day: 'Mon', solarKWh: 18.4, loadKWh: 12.2, exportKWh: 9.8, importKWh: 3.6, netSavings: 92.5 },
  { day: 'Tue', solarKWh: 21.2, loadKWh: 13.0, exportKWh: 12.1, importKWh: 3.9, netSavings: 112.4 },
  { day: 'Wed', solarKWh: 19.8, loadKWh: 14.5, exportKWh: 9.5, importKWh: 4.2, netSavings: 96.8 },
  { day: 'Thu', solarKWh: 24.1, loadKWh: 11.8, exportKWh: 15.6, importKWh: 3.3, netSavings: 134.2 },
  { day: 'Fri', solarKWh: 22.7, loadKWh: 13.4, exportKWh: 13.2, importKWh: 3.9, netSavings: 119.5 },
  { day: 'Sat', solarKWh: 25.4, loadKWh: 16.8, exportKWh: 13.1, importKWh: 4.5, netSavings: 122.0 },
  { day: 'Sun', solarKWh: 23.9, loadKWh: 15.2, exportKWh: 12.8, importKWh: 4.1, netSavings: 116.3 },
];

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(defaultTelemetry);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [espIp, setEspIpState] = useState<string>('192.168.1.150');
  const [tariff, setTariff] = useState<TariffConfig>(defaultTariff);
  const [hourlyHistory] = useState<HourlyDataPoint[]>(initialHourly);
  const [dailyHistory] = useState<DailyDataPoint[]>(initialDaily);
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'info',
      title: 'Grid Synchronized',
      message: 'Mains frequency is stable at 50.0 Hz with nominal voltage.',
      time: '10 mins ago',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Peak Solar Generation',
      message: 'Generating >2.4 kW. Net surplus is currently exporting to the grid.',
      time: 'Just now',
    },
  ]);

  const setEspIp = (ip: string) => {
    setEspIpState(ip);
    esp32Service.setIpAddress(ip);
  };

  const toggleRelay = (relay: 'inverter' | 'grid') => {
    setTelemetry((prev) => {
      const nextState = relay === 'inverter' ? !prev.inverterRelay : !prev.gridRelay;
      esp32Service.sendRelayCommand(relay, nextState);
      return {
        ...prev,
        [relay === 'inverter' ? 'inverterRelay' : 'gridRelay']: nextState,
      };
    });
  };

  const resetEnergyCounters = () => {
    esp32Service.sendCalibrationReset('energy');
    setTelemetry((prev) => ({
      ...prev,
      exportEnergyKWh: 0.0,
      importEnergyKWh: 0.0,
      solarTotalYieldKWh: 0.0,
    }));
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Connect to ESP32 WebSocket
  useEffect(() => {
    esp32Service.connect(
      (data) => {
        setTelemetry(data);
      },
      (connected) => {
        setIsConnected(connected);
      }
    );

    return () => {
      esp32Service.disconnect();
    };
  }, [espIp]);

  // Simulation fallback when offline
  useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        // Subtle realistic variations
        const solarJitter = Math.floor(Math.random() * 40 - 20);
        const loadJitter = Math.floor(Math.random() * 60 - 30);
        const voltJitter = (Math.random() * 0.8 - 0.4);
        const freqJitter = (Math.random() * 0.06 - 0.03);

        const newSolar = prev.inverterRelay ? Math.max(0, prev.solarPowerW + solarJitter) : 0;
        const newLoad = Math.max(200, prev.loadPowerW + loadJitter);
        const newNet = newSolar - newLoad;
        const newVolt = +(Math.min(238, Math.max(226, prev.voltageV + voltJitter))).toFixed(1);
        const newFreq = +(Math.min(50.15, Math.max(49.85, prev.frequencyHz + freqJitter))).toFixed(2);
        const newCurrent = +(newLoad / (newVolt * prev.powerFactor)).toFixed(2);

        const exportInc = newNet > 0 ? (newNet / 1000) * (2 / 3600) : 0;
        const importInc = newNet < 0 ? (Math.abs(newNet) / 1000) * (2 / 3600) : 0;
        const solarYieldInc = (newSolar / 1000) * (2 / 3600);

        return {
          ...prev,
          voltageV: newVolt,
          currentA: newCurrent,
          activePowerW: Math.round(newLoad),
          frequencyHz: newFreq,
          solarPowerW: newSolar,
          loadPowerW: newLoad,
          netPowerW: newNet,
          exportEnergyKWh: +(prev.exportEnergyKWh + exportInc).toFixed(3),
          importEnergyKWh: +(prev.importEnergyKWh + importInc).toFixed(3),
          solarTotalYieldKWh: +(prev.solarTotalYieldKWh + solarYieldInc).toFixed(3),
          batterySocPercent: Math.min(100, Math.max(20, Math.round(prev.batterySocPercent + (newNet > 0 ? 0.01 : -0.01)))),
          timestamp: new Date().toISOString(),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        isConnected,
        espIp,
        tariff,
        alerts,
        hourlyHistory,
        dailyHistory,
        setEspIp,
        setTariff,
        toggleRelay,
        resetEnergyCounters,
        dismissAlert,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
