export interface LiveTelemetry {
  voltageV: number;
  currentA: number;
  activePowerW: number;
  frequencyHz: number;
  powerFactor: number;
  solarPowerW: number;
  loadPowerW: number;
  netPowerW: number;
  exportEnergyKWh: number;
  importEnergyKWh: number;
  solarTotalYieldKWh: number;
  batteryVoltageV: number;
  batterySocPercent: number;
  inverterRelay: boolean;
  gridRelay: boolean;
  timestamp: string;
}

export interface HourlyDataPoint {
  hour: string;
  solarW: number;
  loadW: number;
  netW: number;
}

export interface DailyDataPoint {
  day: string;
  solarKWh: number;
  loadKWh: number;
  exportKWh: number;
  importKWh: number;
  netSavings: number;
}

export interface TariffConfig {
  importRatePerKWh: number;
  exportCreditPerKWh: number;
  fixedMonthlyCharge: number;
  currencySymbol: string;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  time: string;
}
