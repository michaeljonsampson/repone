import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View } from 'react-native';
import { BleError, BleManager, Device, Subscription } from 'react-native-ble-plx';
import { uniqBy, sortBy } from 'lodash';
import { Buffer } from 'buffer';

import { LogBox } from 'react-native';
import { DeviceInfo, Rep } from './types';
import LastRep from './components/LastRep';
import SetTable from './components/SetTable';
import Connect from './components/Connect';
import { useMakeStyles } from './hooks/useMakeStyles';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

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
  const [errors, setErrors] = React.useState<(BleError | string)[]>([]);
  const [connectError, setConnectError] = React.useState<any>();
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [sensor, setSensor] = React.useState<null | Device>(null);
  const [scanning, setScanning] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [reps, setReps] = React.useState<Rep[]>([]);
  const [lastRepRecordedAt, setLastRepRecordedAt] = React.useState<number | null>();
  const [rssi, setRssi] = React.useState<number | null | undefined>();
  const [lastDevice, setLastDevice] = React.useState<DeviceInfo | null>();

  const connectionCheckerRef = React.useRef<NodeJS.Timeout | null>(null);
  const subscription = React.useRef<Subscription | null>();

  React.useEffect(() => {
    const readLocalStorage = async () => {
      const d = await getStoredDevice();
      setLastDevice(d);
    };

    readLocalStorage();
  }, []);

  const checkConnection = async (sensor: null | Device) => {
    if (sensor) {
      const c = await sensor.isConnected();
      setConnected(c);
      if (c) {
        const newDevice = await sensor.readRSSI();
        setRssi(newDevice.rssi);
      } else {
        setSensor(null);
      }
      connectionCheckerRef.current = setTimeout(() => {
        checkConnection(sensor);
      }, 5000);
    } else {
      setConnected(false);
    }
  };

  const watchForData = async (sensor: null | Device) => {
    if (sensor) {
      if (subscription.current) {
        subscription.current.remove();
      }
      subscription.current = sensor.monitorCharacteristicForService(
        serviceUuid,
        characteristicUuid,
        async (error, char) => {
          if (error) {
            console.log('Error monitoring', error);
            return;
          }
          try {
            const buffer = Buffer.from(char.value, 'base64');
            const data = new Uint16Array(buffer.buffer);

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
            // console.log('data2', rep);
            setLastRepRecordedAt(rep.recordedAt);
            setReps((prev) => [rep, ...prev]);
          } catch (e) {
            console.log('Error reading data', e);
          }
        }
      );
    }
  };

  React.useEffect(() => {
    checkConnection(sensor);
    watchForData(sensor);
    return () => {
      clearTimeout(connectionCheckerRef.current);
    };
  }, [sensor]);

  const scanForDevices = () => {
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
      console.log('Device Name', device.name);
      if (device.name && device.name.includes('RepOne')) {
        setDevices((prev) => uniqBy([device, ...prev], (d) => d.name));
      }
    });
  };

  const stopScan = () => {
    bluetoothManager.stopDeviceScan();
    setScanning(false);
  };

  const connect = (d: Device) => {
    console.log('connected device', d);
    setConnecting(true);
    stopScan();
    d.connect()
      .then((device) => {
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        setSensor(device);
        storeDevice({ name: device.name, id: device.id });
        setConnecting(false);
        // console.log('txPowerLevel', device.txPowerLevel);
        // const distance = Math.pow(10, (-69 - device.rssi) / (10 * device.txPowerLevel));
        // console.log('distance', distance);
      })
      .catch((error) => {
        console.log('Error', error);
        setConnectError(error);
        setSensor(null);
        setConnecting(false);
      });
  };

  const connectDirect = () => {
    if (lastDevice && lastDevice.id) {
      setConnecting(true);
      stopScan();
      bluetoothManager
        .connectToDevice(lastDevice.id)
        .then((device) => {
          return device.discoverAllServicesAndCharacteristics();
        })
        .then((device) => {
          setSensor(device);
          setConnecting(false);
          setConnectError(null);
        })
        .catch((error) => {
          console.log('Connect Direct Error', error);
          setConnectError(error);
          setSensor(null);
          setConnecting(false);
        });
    }
  };

  if (connecting) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Connecting...</Text>
      </View>
    );
  }

  if (!sensor || !connected) {
    return (
      <View style={styles.container}>
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
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LastRep
        onClickNewSet={() => setReps([])}
        reps={reps}
        sensorName={sensor?.name ?? 'RepOne'}
        sensorStrength={`${signalStrengthMap[rssi] ?? 0}% ( ${rssi} )`}
        lastRepRecordedAt={lastRepRecordedAt}
      />
      <SetTable reps={reps} />
    </View>
  );
}

const makeStyles = (vmin: number) => {
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
  });
};

const storeDevice = async (deviceInfo: DeviceInfo) => {
  try {
    const jsonValue = JSON.stringify(deviceInfo);
    await AsyncStorage.setItem('repone-device', jsonValue);
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
