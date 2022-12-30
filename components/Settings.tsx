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
      height: 40,
      margin: 12,
      borderWidth: 0.5 * vmin,
      borderColor: 'white',
      padding: 10,
      borderRadius: 5 * vmin,
      width: 50 * vmin,
      color: 'white',
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
