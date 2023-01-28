import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MakeStyles, useMakeStyles } from '../hooks/useMakeStyles';

export default function Settings({
  minRomForValidRep,
  setMinRomForValidRep,
  alertVelocityThreshold,
  setAlertVelocityThreshold,
}: {
  minRomForValidRep: number | null;
  setMinRomForValidRep: (minRomForValidRep: number | null) => void;
  alertVelocityThreshold: number | null;
  setAlertVelocityThreshold: (alertVelocityThreshold: number | null) => void;
}) {
  const styles = useMakeStyles(makeStyles);

  return (
    <View>
      <View style={styles.setting}>
        <Text style={styles.text}>Alert Velocity Threshold in mm: </Text>
        <TextInput
          style={styles.input}
          onChangeText={(v) => setAlertVelocityThreshold(Number(v))}
          value={alertVelocityThreshold ? String(alertVelocityThreshold) : ''}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.setting}>
        <Text style={styles.text}>Minimum ROM to record rep in mm:</Text>
        <TextInput
          style={styles.input}
          onChangeText={(v) => setMinRomForValidRep(Number(v))}
          value={minRomForValidRep ? String(minRomForValidRep) : ''}
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
