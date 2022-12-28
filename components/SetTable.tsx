import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMakeStyles } from '../hooks/useMakeStyles';
import { Rep } from '../types';
import DataRow from './DataRow';

export default function SetTable({ reps }: { reps: Rep[] }) {
  const styles = useMakeStyles(makeStyles);

  return (
    <ScrollView style={styles.table}>
      <DataRow header data={['Rep', 'Velocity (mm/s)', 'ROM (mm)', 'Duration (ms)']} />
      {reps.map((rep, index) => (
        <DataRow
          data={[
            String(reps.length - index),
            String(rep.averageVelocity),
            String(rep.rom),
            String(rep.duration),
          ]}
        />
      ))}
    </ScrollView>
  );
}

const makeStyles = (vmin: number) => {
  return StyleSheet.create({
    table: {
      flex: 1,
      flexDirection: 'column',
      width: 100 * vmin,
    },
  });
};
