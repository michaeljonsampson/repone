import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { sortBy } from 'lodash';
import { Device } from 'react-native-ble-plx';
import { useMakeStyles } from '../hooks/useMakeStyles';
import { DeviceInfo } from '../types';

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
}: {
  scanning: boolean;
  scanForDevices: () => void;
  stopScan: () => void;
  devices: Device[];
  connect: (d: Device) => void;
  connectDirect: () => void;
  connectError: string | null;
  errors: any[];
  lastDevice: DeviceInfo;
}) {
  const styles = useMakeStyles(makeStyles);

  return (
    <View>
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
            <View>
              <Pressable style={styles.button} onPress={() => connect(d)}>
                <Text style={styles.buttonText}>Connect to {d.name}</Text>
              </Pressable>
            </View>
          );
        }),
        'name'
      )}
      {!!lastDevice && (
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

const makeStyles = (vmin: number) => {
  return StyleSheet.create({
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
      minWidth: 80 * vmin,
    },
    buttonText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
    },
    text: { color: 'white' },
  });
};
