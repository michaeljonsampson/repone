import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MakeStyles, useMakeStyles } from '../hooks/useMakeStyles';
import { Rep } from '../types';
import DataBox from './DataBox';
import { meanBy } from 'lodash';

export default function LastRep({
  reps,
  onClickNewSet,
  lastRepRecordedAt,
}: {
  reps: Rep[];
  onClickNewSet: () => void;
  lastRepRecordedAt: number | null | undefined;
}) {
  const styles = useMakeStyles(makeStyles);
  const [timer, setTimer] = React.useState('');

  const lastRep = React.useMemo(() => {
    return reps.length ? reps[0] : null;
  }, [reps]);

  const avgSetVelocity = React.useMemo(() => {
    if (!reps.length) {
      return '';
    }
    return Math.round(meanBy(reps, 'averageVelocity'));
  }, [reps]);

  React.useEffect(() => {
    const updateClock = () => {
      if (lastRepRecordedAt) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastRepRecordedAt;
        const elapsedSeconds = Math.round(elapsedTime / 1000);
        const formattedMinutes = Math.floor(elapsedSeconds / 60);
        const formattedSeconds = elapsedSeconds % 60;
        const formattedTimer = `${Math.min(formattedMinutes, 99)}:${
          formattedSeconds < 10 ? `0${formattedSeconds}` : formattedSeconds
        }`;
        setTimer(formattedTimer);
      }
    };

    let interval: NodeJS.Timer;
    if (lastRepRecordedAt) {
      updateClock();
      interval = setInterval(() => updateClock(), 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [lastRepRecordedAt]);

  return (
    <View style={styles.dataWrapper}>
      <View style={styles.row}>
        <DataBox>
          <Text style={styles.label}>Reps</Text>
          <Text style={styles.value}>{reps?.length}</Text>
        </DataBox>
        <DataBox middle>
          <Text style={styles.label}>Last Rep Velocity</Text>
          <Text style={styles.value}>{lastRep?.averageVelocity}</Text>
        </DataBox>
        <DataBox>
          <Text style={styles.label}>Avg Set Velocity</Text>
          <Text style={styles.value}>{avgSetVelocity}</Text>
        </DataBox>
      </View>
      <View style={styles.row}>
        <DataBox>
          <Text style={styles.label}>ROM</Text>
          <Text style={styles.value}>{lastRep?.rom}</Text>
        </DataBox>
        <DataBox middle>
          <Text style={styles.label}>Since Last Rep</Text>
          <Text style={styles.value}>{timer}</Text>
        </DataBox>
        <DataBox onClick={onClickNewSet}>
          <Text style={styles.button}>New Set</Text>
        </DataBox>
      </View>
    </View>
  );
}

const makeStyles = ({ vmin }: MakeStyles) => {
  return StyleSheet.create({
    row: {
      marginBottom: 2 * vmin,
      flexDirection: 'row',
    },
    dataWrapper: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomColor: 'white',
      borderBottomWidth: 0.5 * vmin,
      width: 100 * vmin,
      minHeight: 50 * vmin,
      maxHeight: 50 * vmin,
    },
    value: {
      fontSize: 8 * vmin,
      fontWeight: 'bold',
      color: 'white',
    },
    label: {
      fontSize: 2 * vmin,
      fontWeight: 'bold',
      color: 'white',
    },
    button: { fontSize: 6 * vmin, fontWeight: 'bold', color: 'white' },
  });
};
