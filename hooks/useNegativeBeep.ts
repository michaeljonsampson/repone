import React from 'react';
import { Rep } from '../types';
import { Audio } from 'expo-av';

export const useNegativeBeep = ({
  validReps,
  alertVelocityThreshold,
}: {
  validReps: Rep[];
  alertVelocityThreshold: number | null;
}) => {
  const beepPlayForRepId = React.useRef<number | null>();
  React.useEffect(() => {
    if (validReps.length && alertVelocityThreshold) {
      const lastRep = validReps[0];
      if (
        lastRep.averageVelocity &&
        lastRep.averageVelocity < alertVelocityThreshold &&
        beepPlayForRepId.current !== lastRep.deviceRepId
      ) {
        playBeep();
        beepPlayForRepId.current = lastRep.deviceRepId;
      }
    }
  }, [alertVelocityThreshold, validReps]);
};

const playBeep = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sound } = await Audio.Sound.createAsync(require('../assets/beep.mp3'));
  await sound.playAsync();
};
