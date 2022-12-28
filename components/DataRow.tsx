import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMakeStyles } from '../hooks/useMakeStyles';

export default function DataRow({ data, header }: { data: string[]; header?: boolean }) {
  const styles = useMakeStyles(makeStyles);

  return (
    <View style={header ? styles.headerRow : styles.row}>
      {data.map((d) => (
        <View style={styles.cell}>
          <Text style={header ? styles.headerText : styles.text}>{d}</Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (vmin: number) => {
  return StyleSheet.create({
    row: {
      flex: 1,
      flexDirection: 'row',
      minHeight: 8 * vmin,
      maxHeight: 8 * vmin,
      borderBottomColor: 'white',
      borderBottomWidth: 0.5 * vmin,
    },
    headerRow: {
      flex: 1,
      flexDirection: 'row',
      minHeight: 6 * vmin,
      maxHeight: 6 * vmin,
      borderBottomColor: 'white',
      borderBottomWidth: 0.5 * vmin,
    },
    cell: {
      flex: 1,
      width: 25 * vmin,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'black',
    },
    text: {
      color: 'white',
      fontSize: 4 * vmin,
    },
    headerText: { color: '#eeeeee', fontSize: 2 * vmin },
  });
};
