import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { DeviceInfo } from '../types';

export const useLocalStorage = ({
  setLastDevice,
  setMinRomForValidRep,
  setAlertVelocityThreshold,
}: {
  setLastDevice: (device: DeviceInfo | undefined | null) => void;
  setMinRomForValidRep: (min: number | null) => void;
  setAlertVelocityThreshold: (vel: number | null) => void;
}) => {
  React.useEffect(() => {
    const readLocalStorage = async () => {
      const d = await getStoredDevice();
      setLastDevice(d);

      const { minRomForValidRep, alertVelocityThreshold } = await getStoredSettings();
      setMinRomForValidRep(minRomForValidRep);
      setAlertVelocityThreshold(alertVelocityThreshold);
    };

    readLocalStorage();
  }, [setAlertVelocityThreshold, setLastDevice, setMinRomForValidRep]);

  const getStoredDevice = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('repone-device');
      const data = jsonValue != null ? (JSON.parse(jsonValue) as DeviceInfo) : null;
      console.log(data);
      return data;
    } catch (e) {
      console.log(e);
    }
  };

  const getStoredSettings = async () => {
    const defaultSettings = { alertVelocityThreshold: null, minRomForValidRep: null };
    try {
      const jsonValue = await AsyncStorage.getItem('repone-settings');

      const data =
        jsonValue != null
          ? (JSON.parse(jsonValue) as {
              alertVelocityThreshold: number | null;
              minRomForValidRep: number | null;
            })
          : defaultSettings;
      console.log(data);
      return data;
    } catch (e) {
      console.log(e);
    }

    return defaultSettings;
  };

  const storeDevice = async (deviceInfo: DeviceInfo) => {
    try {
      const jsonValue = JSON.stringify(deviceInfo);
      await AsyncStorage.setItem('repone-device', jsonValue);
    } catch (e) {
      console.log(e);
    }
  };

  const storeSettings = async ({
    alertVelocityThreshold,
    minRomForValidRep,
  }: {
    alertVelocityThreshold: number | null;
    minRomForValidRep: number | null;
  }) => {
    console.log('storing', {
      alertVelocityThreshold,
      minRomForValidRep,
    });
    try {
      const jsonValue = JSON.stringify({
        alertVelocityThreshold,
        minRomForValidRep,
      });
      await AsyncStorage.setItem('repone-settings', jsonValue);
      console.log('stored', {
        alertVelocityThreshold,
        minRomForValidRep,
      });
    } catch (e) {
      console.log(e);
    }
  };

  return { storeDevice, storeSettings };
};
