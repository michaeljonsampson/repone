import React from 'react';

import { Pressable, StyleSheet, Text, View, LogBox } from 'react-native';
import { DeviceInfo, Rep, SettingsData } from './types';
import LastRep from './components/LastRep';
import SetTable from './components/SetTable';
import Connect from './components/Connect';
import { MakeStyles, useMakeStyles } from './hooks/useMakeStyles';
import Settings from './components/Settings';
import Log from './components/Log';
import Modal from './components/Modal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNegativeBeep } from './hooks/useNegativeBeep';
import { useDevice } from './hooks/useDevice';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); // Ignore all log notifications

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
  const [reps, setReps] = React.useState<Rep[]>([]);
  const [lastDevice, setLastDevice] = React.useState<DeviceInfo | null>();

  const [settings, setSettings] = React.useState<SettingsData>({});

  const validReps = React.useMemo(
    () =>
      reps.filter(
        (r) => r.rom && (!settings.minRomForValidRep || r.rom >= settings.minRomForValidRep)
      ),
    [reps, settings.minRomForValidRep]
  );

  const { storeDevice, storeSettings } = useLocalStorage({
    setLastDevice,
    setSettings,
  });

  useNegativeBeep({ validReps, settings });

  const {
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
  } = useDevice({ lastDevice, storeDevice, setReps });

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={() => setConnectionModalOpen(true)}>
          <Text style={styles.buttonText}>{sensor ? 'Connected' : 'Connect'}</Text>
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
          rssi={rssi}
        />
      </Modal>
      <Modal
        open={settingsModalOpen}
        onClose={() => {
          storeSettings(settings);
          setSettingsModalOpen(false);
        }}
      >
        <Settings settings={settings} setSettings={setSettings} />
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
