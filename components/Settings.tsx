import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MakeStyles, useMakeStyles } from '../hooks/useMakeStyles';
import { SettingsData } from '../types';

export default function Settings({
  settings,
  setSettings,
}: {
  settings: SettingsData;
  setSettings: React.Dispatch<React.SetStateAction<SettingsData>>;
}) {
  const styles = useMakeStyles(makeStyles);

  return (
    <View>
      <View style={styles.setting}>
        <Text style={styles.text}>Alert Velocity Threshold in mm/s: </Text>
        <TextInput
          style={styles.input}
          onChangeText={(v) =>
            setSettings((prev) => ({ ...prev, alertVelocityThreshold: Number(v) }))
          }
          value={settings.alertVelocityThreshold ? String(settings.alertVelocityThreshold) : ''}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.setting}>
        <Text style={styles.text}>Alert Velocity Drop Threshold in %:</Text>
        <TextInput
          style={styles.input}
          onChangeText={(v) =>
            setSettings((prev) => ({ ...prev, alertVelocityDecreasePercent: Number(v) }))
          }
          value={
            settings.alertVelocityDecreasePercent
              ? String(settings.alertVelocityDecreasePercent)
              : ''
          }
          keyboardType="numeric"
        />
      </View>
      <View style={styles.setting}>
        <Text style={styles.text}>Minimum ROM to record rep in mm:</Text>
        <TextInput
          style={styles.input}
          onChangeText={(v) => setSettings((prev) => ({ ...prev, minRomForValidRep: Number(v) }))}
          value={settings.minRomForValidRep ? String(settings.minRomForValidRep) : ''}
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}

const makeStyles = ({ vmin }: MakeStyles) => {
  return StyleSheet.create({
    setting: { marginBottom: 10 * vmin },
    input: {
      height: 12 * vmin,
      margin: 1 * vmin,
      borderWidth: 0.5 * vmin,
      borderColor: 'white',
      paddingHorizontal: 4 * vmin,
      borderRadius: 5 * vmin,
      width: 50 * vmin,
      color: 'white',
      fontSize: 6 * vmin,
    },
    text: { color: 'white' },
  });
};
