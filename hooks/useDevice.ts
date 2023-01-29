import React from 'react';
import { BleError, ConnectionPriority, Device, Subscription } from 'react-native-ble-plx';
import { DeviceInfo, Rep } from '../types';
import { bluetoothManager } from '../lib/bluetoothManager';
import { uniqBy } from 'lodash';

import reponeConfig from '../devices/repone';

export const useDevice = ({
  lastDevice,
  storeDevice,
  setReps,
}: {
  lastDevice: DeviceInfo | null | undefined;
  storeDevice: (d: DeviceInfo) => Promise<void>;
  setReps: React.Dispatch<React.SetStateAction<Rep[]>>;
}) => {
  // When we start supporting other device types we can switch configs here.
  // Might need to refactor this some more if other devices use multiple characteristics
  const { getRepDataFromChar, serviceUuid, characteristicUuid } = reponeConfig;

  const [log, setLog] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<(BleError | string)[]>([]);
  const [connectError, setConnectError] = React.useState<any>();
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [sensor, setSensor] = React.useState<null | Device>(null);
  const [scanning, setScanning] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [lastRepRecordedAt, setLastRepRecordedAt] = React.useState<number | null>();
  const [rssi, setRssi] = React.useState<number | null | undefined>();

  const connectionCheckerRef = React.useRef<NodeJS.Timeout | null>(null);
  const subscription = React.useRef<Subscription | null>();

  const stopScan = React.useCallback(() => {
    bluetoothManager.stopDeviceScan();
    setScanning(false);
  }, []);

  const connect = React.useCallback(
    (d: Device) => {
      const startConnection = async () => {
        setConnecting(true);
        stopScan();
        try {
          let device = await d.connect();
          device = await device.discoverAllServicesAndCharacteristics();
          device = await device.requestConnectionPriority(ConnectionPriority.High);
          setSensor(device);
          storeDevice({ name: device.name, id: device.id });
          setConnecting(false);
        } catch (e) {
          console.log('Error', e);
          setConnectError(e);
          setSensor(null);
          setConnecting(false);
        }
      };

      startConnection();
    },
    [stopScan, storeDevice]
  );

  const connectDirect = React.useCallback(() => {
    const startConnection = async () => {
      if (lastDevice?.id) {
        setConnecting(true);
        stopScan();

        try {
          let device = await bluetoothManager.connectToDevice(lastDevice.id);
          device = await device.discoverAllServicesAndCharacteristics();
          device = await device.requestConnectionPriority(ConnectionPriority.High);
          setSensor(device);
          setConnecting(false);
          setConnectError(null);
        } catch (e) {
          console.log('Connect Direct Error', e);
          setConnectError(e);
          setSensor(null);
          setConnecting(false);
        }
      }
    };

    startConnection();
  }, [lastDevice, stopScan]);

  const checkConnection = React.useCallback(async (sensor: null | Device) => {
    if (sensor) {
      try {
        const c = await sensor.isConnected();
        if (c) {
          const newDevice = await sensor.readRSSI();
          setRssi(newDevice.rssi);
        } else {
          setSensor(null);
        }
        connectionCheckerRef.current = setTimeout(() => {
          checkConnection(sensor);
        }, 1000);
      } catch (e) {
        console.log('Checking connection', e);
        if (e) {
          setLog((prev) => [...prev, e.message]);
        }
      }
    } else {
      setSensor(null);
    }
  }, []);

  const watchForData = React.useCallback(
    async (sensor: null | Device) => {
      if (sensor) {
        if (subscription.current) {
          subscription.current.remove();
        }
        subscription.current = sensor.monitorCharacteristicForService(
          serviceUuid,
          characteristicUuid,
          (error, char) => {
            if (error) {
              console.log('Error monitoring', error);
              setLog((prev) => [...prev, 'Error monitoring', error.message]);
              return;
            }
            if (!char?.value) {
              setLog((prev) => [
                ...prev,
                'Characteristic monitor triggered but there was no data.',
              ]);
              return;
            }
            try {
              console.log('--- monitor ---');
              const rep = getRepDataFromChar({ char, setLog });
              // console.log('data2', rep);
              if (rep) {
                setLastRepRecordedAt(rep.recordedAt);
                setReps((prev) => [rep, ...prev]);
              }
            } catch (e) {
              console.log('Error reading data', e);
              if (e) {
                setLog((prev) => [...prev, e.message]);
              }
            }
          }
        );
      }
    },
    [characteristicUuid, getRepDataFromChar, serviceUuid, setReps]
  );

  const scanForDevices = React.useCallback(() => {
    console.log('scan started');
    setScanning(true);
    setErrors([]);
    bluetoothManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('scan error', error);
        // Handle error (scanning will be stopped automatically)
        if (
          error.message.includes('Device is not authorized') ||
          error.message.includes('Cannot start scanning operation')
        ) {
          setErrors([
            'You must enable location services and nearby devices permissions for this app.',
          ]);
        } else {
          setErrors((prev) => [...prev, error]);
        }
        return;
      }

      if (device?.name?.includes('RepOne')) {
        setDevices((prev) => uniqBy([device, ...prev], (d) => d.name));
      }
    });
  }, []);

  const disconnect = React.useCallback(() => {
    const cancelConnection = async () => {
      try {
        await sensor?.cancelConnection();
        setSensor(null);
      } catch (e) {
        console.log(e);
        setLog((prev) => [...prev, 'Failed to disconnect', e.message]);
      }
    };
    cancelConnection();
  }, [sensor]);

  React.useEffect(() => {
    checkConnection(sensor);
    watchForData(sensor);
    if (sensor) {
      sensor.onDisconnected((error) => {
        // if not error that means we called #cancelConnection.
        if (error) {
          console.log(error);
          setLog((prev) => [...prev, 'Disconnected', error.message]);
        }
      });
    }
    return () => {
      if (connectionCheckerRef.current) {
        clearTimeout(connectionCheckerRef.current);
      }
    };
  }, [checkConnection, sensor, watchForData]);

  return {
    log,
    errors,
    connectError,
    devices,
    sensor,
    scanning,
    connecting,
    lastRepRecordedAt,
    rssi,
    connect,
    connectDirect,
    scanForDevices,
    disconnect,
    stopScan,
  };
};
