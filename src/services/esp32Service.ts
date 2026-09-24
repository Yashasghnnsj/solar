/**
 * ESP32 Net-Metering Telemetry Service
 * Connects via WebSocket to the ESP32 IP address on the local network.
 */
import { LiveTelemetry } from '../types';

export class ESP32Service {
  private socket: WebSocket | null = null;
  private ipAddress: string = '192.168.1.150';
  private reconnectInterval: any = null;
  private onMessageCallback: ((data: LiveTelemetry) => void) | null = null;
  private onStatusCallback: ((connected: boolean) => void) | null = null;

  public setIpAddress(ip: string) {
    this.ipAddress = ip;
    if (this.socket) {
      this.disconnect();
      if (this.onMessageCallback && this.onStatusCallback) {
        this.connect(this.onMessageCallback, this.onStatusCallback);
      }
    }
  }

  public getIpAddress(): string {
    return this.ipAddress;
  }

  public connect(
    onMessage: (data: LiveTelemetry) => void,
    onStatusChange: (connected: boolean) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onStatusCallback = onStatusChange;

    try {
      this.socket = new WebSocket(`ws://${this.ipAddress}:81`);

      this.socket.onopen = () => {
        console.log('[ESP32] Connected via WebSocket to ' + this.ipAddress);
        onStatusChange(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const telemetry: LiveTelemetry = JSON.parse(event.data);
          onMessage(telemetry);
        } catch (e) {
          console.error('[ESP32] Error parsing JSON telemetry:', e);
        }
      };

      this.socket.onclose = () => {
        console.log('[ESP32] Disconnected');
        onStatusChange(false);
      };

      this.socket.onerror = (err) => {
        console.warn('[ESP32] WebSocket error, fallback to simulated stream:', err);
        onStatusChange(false);
      };
    } catch (e) {
      console.warn('[ESP32] Connection failed, running in test mode');
      onStatusChange(false);
    }
  }

  public disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        // ignore
      }
      this.socket = null;
    }
  }

  public sendRelayCommand(relay: 'inverter' | 'grid', state: boolean) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        action: 'set_relay',
        target: relay,
        state: state ? 1 : 0
      });
      this.socket.send(payload);
    }
  }

  public sendCalibrationReset(target: 'energy' | 'all') {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        action: 'reset_counter',
        target: target
      });
      this.socket.send(payload);
    }
  }
}

export const esp32Service = new ESP32Service();
