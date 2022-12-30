import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { MakeStyles, useMakeStyles } from '../hooks/useMakeStyles';

export default function Log({ log }: { log: string[] }) {
  const styles = useMakeStyles(makeStyles);

  return (
    <View>
      <ScrollView>
        {log.map((line) => {
          return (
            <View key={line}>
              <Text style={styles.text}>{line}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = ({ vmin, vh, vw }: MakeStyles) => {
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
