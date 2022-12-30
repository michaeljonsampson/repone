import React from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, StyleSheet, Text, View, LogBox } from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  ConnectionPriority,
  Device,
  Subscription,
} from 'react-native-ble-plx';
import { uniqBy } from 'lodash';
import { Buffer } from 'buffer';
import { DeviceInfo, Rep } from './types';
import LastRep from './components/LastRep';
import SetTable from './components/SetTable';
import Connect from './components/Connect';
import { MakeStyles, useMakeStyles } from './hooks/useMakeStyles';
import Settings from './components/Settings';
import Log from './components/Log';
import Modal from './components/Modal';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); // Ignore all log notifications

const bluetoothManager = new BleManager();

const serviceUuid = 'A5183278-CA65-45B7-B6C3-A68552F2026D';
const characteristicUuid = 'A5183278-CA65-45B7-B6C3-A68552F20273';

// const testData = {
//   averageVelocity: 1014,
//   deviceRepId: 2,
//   duration: 919,
//   other1: 364,
//   other2: 65535,
//   other3: 65535,
//   peakHeight: 565,
//   peakVelocity: 1609,
//   repNumber: 7,
//   rom: 932,
//   recordedAt: Date.now(),
// };

export default function App() {
  const styles = useMakeStyles(makeStyles);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = React.useState(false);
  const [logModalOpen, setLogModalOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<(BleError | string)[]>([]);
  const [connectError, setConnectError] = React.useState<any>();
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [sensor, setSensor] = React.useState<null | Device>(null);
  const [scanning, setScanning] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [reps, setReps] = React.useState<Rep[]>([]);
  const [lastRepRecordedAt, setLastRepRecordedAt] = React.useState<number | null>();
  const [rssi, setRssi] = React.useState<number | null | undefined>();
  const [lastDevice, setLastDevice] = React.useState<DeviceInfo | null>();

  const [minRomForValidRep, setMinRomForValidRep] = React.useState<number | null>(null);
  const [alertVelocityThreshold, setAlertVelocityThreshold] = React.useState<number | null>(null);

  const connectionCheckerRef = React.useRef<NodeJS.Timeout | null>(null);
  const subscription = React.useRef<Subscription | null>();

  const validReps = React.useMemo(
    () => reps.filter((r) => r.rom && (!minRomForValidRep || r.rom >= minRomForValidRep)),
    [minRomForValidRep, reps]
  );

  const beepPlayForRepId = React.useRef<number | null>();
  React.useEffect(() => {
    if (validReps.length && alertVelocityThreshold) {
      const lastRep = validReps[0];
      if (
        lastRep.averageVelocity &&
        lastRep.averageVelocity < alertVelocityThreshold &&
        beepPlayForRepId.current !== lastRep.deviceRepId
      ) {
        playBeep();
        beepPlayForRepId.current = lastRep.deviceRepId;
      }
    }
  }, [alertVelocityThreshold, minRomForValidRep, validReps]);

  React.useEffect(() => {
    const readLocalStorage = async () => {
      const d = await getStoredDevice();
      setLastDevice(d);

      const { minRomForValidRep, alertVelocityThreshold } = await getStoredSettings();
      setMinRomForValidRep(minRomForValidRep);
      setAlertVelocityThreshold(alertVelocityThreshold);
    };

    readLocalStorage();
  }, []);

  const stopScan = React.useCallback(() => {
    bluetoothManager.stopDeviceScan();
    setScanning(false);
  }, []);

  const connect = React.useCallback(
    (d: Device) => {
      const startConnection = async () => {
        console.log('connected device', d);
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
    [stopScan]
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
          console.log('just connected');
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
        // console.log('connected', c);
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

  // const manualDataRead = React.useCallback(
  //   async (sensor: null | Device) => {
  //     if (sensor) {
  //       try {
  //         const device = await sensor.discoverAllServicesAndCharacteristics();
  //         const char = await device.readCharacteristicForService(serviceUuid, characteristicUuid);
  //         console.log('manualDataRead');
  //         const rep = getRepDataFromChar({ char, setLog });
  //         console.log(rep);
  //         console.log('--------------------------------------------------------------');
  //         connectionCheckerRef.current = setTimeout(() => {
  //           manualDataRead(device);
  //         }, 500);
  //       } catch (e) {
  //         console.log('Reading Data', e);
  //         if (e) {
  //           setLog((prev) => [...prev, 'reading data', e.message]);
  //           console.log('reconnecting');
  //           connectDirect();
  //         }
  //       }
  //     } else {
  //       setSensor(null);
  //     }
  //   },
  //   [connectDirect]
  // );

  const watchForData = React.useCallback(async (sensor: null | Device) => {
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
            setLog((prev) => [...prev, 'Characteristic monitor triggered but there was no data.']);
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
  }, []);

  React.useEffect(() => {
    checkConnection(sensor);
    watchForData(sensor);
    // manualDataRead(sensor);
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
      console.log('Device Name', device?.name);
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

  const sensorStrength = React.useMemo(() => {
    if (!sensor) {
      return '';
    }
    return `${rssi ? signalStrengthMap[rssi] ?? '0' : '0'}% ( ${rssi ?? '0'} )`;
  }, [rssi, sensor]);

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={() => setConnectionModalOpen(true)}>
          <Text style={styles.buttonText}>Connect</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setLogModalOpen(true)}>
          <Text style={styles.buttonText}>Log</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setSettingsModalOpen(true)}>
          <Text style={styles.buttonText}>Settings</Text>
        </Pressable>
      </View>
      <Modal
        open={connectionModalOpen}
        onClose={() => {
          setConnectionModalOpen(false);
        }}
      >
        <Connect
          scanning={scanning}
          scanForDevices={scanForDevices}
          stopScan={stopScan}
          devices={devices}
          connect={connect}
          connectDirect={connectDirect}
          connectError={connectError}
          errors={errors}
          lastDevice={lastDevice}
          connecting={connecting}
          sensor={sensor}
          disconnect={disconnect}
        />
      </Modal>
      <Modal
        open={settingsModalOpen}
        onClose={() => {
          storeSettings({ minRomForValidRep, alertVelocityThreshold });
          setSettingsModalOpen(false);
        }}
      >
        <Settings
          minRomForValidRep={minRomForValidRep}
          setMinRomForValidRep={setMinRomForValidRep}
          alertVelocityThreshold={alertVelocityThreshold}
          setAlertVelocityThreshold={setAlertVelocityThreshold}
        />
      </Modal>
      <Modal
        open={logModalOpen}
        onClose={() => {
          setLogModalOpen(false);
        }}
      >
        <Log log={log} />
      </Modal>
      <LastRep
        onClickNewSet={() => setReps([])}
        reps={validReps}
        sensorName={sensor ? sensor.name ?? 'RepOne' : 'Not Connected'}
        sensorStrength={sensorStrength}
        lastRepRecordedAt={lastRepRecordedAt}
      />
      <SetTable reps={validReps} />
    </View>
  );
}

const makeStyles = ({ vmin }: MakeStyles) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: 'white',
      fontSize: 5 * vmin,
    },
    buttonRow: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      maxHeight: 8 * vmin,
      marginVertical: 2 * vmin,
      width: 90 * vmin,
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 1 * vmin,
      elevation: 10,
      backgroundColor: '#222222',
      borderRadius: 5 * vmin,
      borderWidth: 0.5 * vmin,
      borderColor: 'white',
      minWidth: 20 * vmin,
    },
    buttonText: {
      fontSize: 3 * vmin,
      fontWeight: 'bold',
      color: 'white',
    },
  });
};

const playBeep = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sound } = await Audio.Sound.createAsync(require('./assets/beep.mp3'));
  await sound.playAsync();
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

const getRepDataFromChar = ({
  char,
  setLog,
}: {
  char: Characteristic;
  setLog: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  if (!char.value) {
    return null;
  }

  const buffer = Buffer.from(char.value, 'base64');
  const data = new Uint16Array(buffer.buffer);
  setLog((prev) => [...prev, JSON.stringify(data)]);
  console.log('repNumber', data[1]);
  console.log('deviceRepId', data[0]);
  console.log('-');
  const rep = {
    deviceRepId: data[0],
    repNumber: data[1],
    averageVelocity: data[2],
    rom: data[3],
    peakVelocity: data[4],
    peakHeight: data[5],
    duration: data[6],
    other1: data[7],
    other2: data[8],
    other3: data[9],
    recordedAt: Date.now(),
  };

  return rep;
};

const signalStrengthMap = {
  '-100': '0',
  '-99': '0',
  '-98': '0',
  '-97': '0',
  '-96': '0',
  '-95': '0',
  '-94': '4',
  '-93': '6',
  '-92': '8',
  '-91': '11',
  '-90': '13',
  '-89': '15',
  '-88': '17',
  '-87': '19',
  '-86': '21',
  '-85': '23',
  '-84': '26',
  '-83': '28',
  '-82': '30',
  '-81': '32',
  '-80': '34',
  '-79': '35',
  '-78': '37',
  '-77': '39',
  '-76': '41',
  '-75': '43',
  '-74': '45',
  '-73': '46',
  '-72': '48',
  '-71': '50',
  '-70': '52',
  '-69': '53',
  '-68': '55',
  '-67': '56',
  '-66': '58',
  '-65': '59',
  '-64': '61',
  '-63': '62',
  '-62': '64',
  '-61': '65',
  '-60': '67',
  '-59': '68',
  '-58': '69',
  '-57': '71',
  '-56': '72',
  '-55': '73',
  '-54': '75',
  '-53': '76',
  '-52': '77',
  '-51': '78',
  '-50': '79',
  '-49': '80',
  '-48': '81',
  '-47': '82',
  '-46': '83',
  '-45': '84',
  '-44': '85',
  '-43': '86',
  '-42': '87',
  '-41': '88',
  '-40': '89',
  '-39': '90',
  '-38': '90',
  '-37': '91',
  '-36': '92',
  '-35': '93',
  '-34': '93',
  '-33': '94',
  '-32': '95',
  '-31': '95',
  '-30': '96',
  '-29': '96',
  '-28': '97',
  '-27': '97',
  '-26': '98',
  '-25': '98',
  '-24': '99',
  '-23': '99',
  '-22': '99',
  '-21': '100',
  '-20': '100',
  '-19': '100',
  '-18': '100',
  '-17': '100',
  '-16': '100',
  '-15': '100',
  '-14': '100',
  '-13': '100',
  '-12': '100',
  '-11': '100',
  '-10': '100',
  '-9 ': '100',
  '-8 ': '100',
  '-7 ': '100',
  '-6 ': '100',
  '-5 ': '100',
  '-4 ': '100',
  '-3 ': '100',
  '-2 ': '100',
  '-1 ': '100',
};
