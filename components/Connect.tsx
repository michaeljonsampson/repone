import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { sortBy } from 'lodash';
import { Device } from 'react-native-ble-plx';
import { MakeStyles, useMakeStyles } from '../hooks/useMakeStyles';
import { DeviceInfo } from '../types';
import { signalStrengthMap } from '../lib/signalStrengthMap';

export default function Connect({
  scanning,
  scanForDevices,
  stopScan,
  devices,
  connect,
  connectDirect,
  connectError,
  errors,
  lastDevice,
  connecting,
  sensor,
  disconnect,
  rssi,
}: {
  scanning: boolean;
  scanForDevices: () => void;
  stopScan: () => void;
  devices: Device[];
  connect: (d: Device) => void;
  connectDirect: () => void;
  connectError: string | null;
  errors: any[];
  lastDevice: DeviceInfo | null | undefined;
  connecting: boolean;
  sensor: Device | undefined | null;
  disconnect: () => void;
  rssi: number | undefined | null;
}) {
  const styles = useMakeStyles(makeStyles);

  const sensorStrength = React.useMemo(() => {
    if (!sensor) {
      return '';
    }
    return `${rssi ? signalStrengthMap[rssi] ?? '0' : '0'}% ( ${rssi ?? '0'} )`;
  }, [rssi, sensor]);

  if (connecting) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Connecting...</Text>
      </View>
    );
  }

  if (sensor) {
    return (
      <View style={styles.container}>
        <Text style={styles.connectionText}>Connected to {sensor?.name}</Text>
        <Text style={styles.sensorStrength}>{sensorStrength}</Text>
        <Pressable style={styles.button} onPress={disconnect}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <>
        {!scanning && (
          <Pressable style={styles.button} onPress={scanForDevices}>
            <Text style={styles.buttonText}>Start Scan</Text>
          </Pressable>
        )}
        {scanning && (
          <Pressable style={styles.button} onPress={stopScan}>
            <Text style={styles.buttonText}>Stop Scan</Text>
          </Pressable>
        )}
      </>

      {sortBy(
        devices.map((d) => {
          return (
            <View key={d.id}>
              <Pressable style={styles.button} onPress={() => connect(d)}>
                <Text style={styles.buttonText}>Connect to {d.name}</Text>
              </Pressable>
            </View>
          );
        }),
        'name'
      )}
      {!!lastDevice?.id && (
        <View>
          <Pressable style={styles.button} onPress={() => connectDirect()}>
            <Text style={styles.buttonText}>Connect to last device ({lastDevice.name})</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.text}>{errors.length > 0 && JSON.stringify(errors)}</Text>
      {!!connectError && (
        <View>
          <View>
            <Text style={styles.text}>
              Failed to connect to device. Make sure it is turned on and within range.
            </Text>
          </View>
          <View>
            <Text style={styles.text}>{JSON.stringify(connectError)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = ({ vmin }: MakeStyles) => {
  return StyleSheet.create({
    container: {
      backgroundColor: 'black',
      padding: 5 * vmin,
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 3 * vmin,
      elevation: 10,
      backgroundColor: '#222222',
      marginBottom: 5 * vmin,
      borderRadius: 5 * vmin,
      borderWidth: 0.5 * vmin,
      borderColor: 'white',
      minWidth: 60 * vmin,
    },
    buttonText: {
      fontSize: 3 * vmin,
      fontWeight: 'bold',
      color: 'white',
    },
    connectionText: {
      color: 'white',
      fontSize: 4 * vmin,
      textAlign: 'center',
      marginBottom: 5 * vmin,
    },
    text: { color: 'white' },
    sensorStrength: {
      fontSize: 4 * vmin,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 4 * vmin,
      textAlign: 'center',
    },
  });
};
