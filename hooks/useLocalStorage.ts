import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { DeviceInfo, SettingsData } from '../types';

export const useLocalStorage = ({
  setLastDevice,
  setSettings,
}: {
  setLastDevice: (device: DeviceInfo | undefined | null) => void;
  setSettings: React.Dispatch<React.SetStateAction<SettingsData>>;
}) => {
  React.useEffect(() => {
    const readLocalStorage = async () => {
      const d = await getStoredDevice();
      setLastDevice(d);

      const settings = await getStoredSettings();
      setSettings(settings);
    };

    readLocalStorage();
  }, [setLastDevice, setSettings]);

  const getStoredDevice = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('repone-device');
      const data = jsonValue != null ? (JSON.parse(jsonValue) as DeviceInfo) : null;
      return data;
    } catch (e) {
      console.log(e);
    }
  };

  const getStoredSettings = async () => {
    const defaultSettings = {};
    try {
      const jsonValue = await AsyncStorage.getItem('repone-settings');
      const data = jsonValue != null ? (JSON.parse(jsonValue) as SettingsData) : defaultSettings;
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

  const storeSettings = async (settings: SettingsData) => {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem('repone-settings', jsonValue);
    } catch (e) {
      console.log(e);
    }
  };

  return { storeDevice, storeSettings };
};
