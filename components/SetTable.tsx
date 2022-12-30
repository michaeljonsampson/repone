import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MakeStyles, useMakeStyles } from '../hooks/useMakeStyles';
import { Rep } from '../types';
import DataRow from './DataRow';

export default function SetTable({ reps }: { reps: Rep[] }) {
  const styles = useMakeStyles(makeStyles);

  return (
    <ScrollView style={styles.table}>
      <DataRow header data={['Rep', 'Velocity (mm/s)', 'ROM (mm)', 'Duration (ms)']} />
      {reps.map((rep, index) => (
        <DataRow
          key={rep.recordedAt}
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

const makeStyles = ({ vmin }: MakeStyles) => {
  return StyleSheet.create({
    table: {
      flex: 1,
      flexDirection: 'column',
      width: 100 * vmin,
    },
  });
};
