import React from 'react';
import { Rep, SettingsData } from '../types';
import { Audio } from 'expo-av';

export const useNegativeBeep = ({
  validReps,
  settings,
}: {
  validReps: Rep[];
  settings: SettingsData;
}) => {
  const beepPlayForRepId = React.useRef<number | null>();
  React.useEffect(() => {
    if (validReps.length) {
      const firstRep = validReps[validReps.length - 1];
      const lastRep = validReps[0];

      if (
        settings.alertVelocityThreshold &&
        lastRep.averageVelocity &&
        lastRep.averageVelocity < settings.alertVelocityThreshold &&
        beepPlayForRepId.current !== lastRep.deviceRepId
      ) {
        playBeep();
        beepPlayForRepId.current = lastRep.deviceRepId;
      }

      if (
        settings.alertVelocityDecreasePercent &&
        firstRep.averageVelocity &&
        lastRep.averageVelocity &&
        beepPlayForRepId.current !== lastRep.deviceRepId
      ) {
        const decreasePercent = (1 - lastRep.averageVelocity / firstRep.averageVelocity) * 100;
        if (decreasePercent > settings.alertVelocityDecreasePercent) {
          playBeep();
          beepPlayForRepId.current = lastRep.deviceRepId;
        }
      }
    }
  }, [settings.alertVelocityDecreasePercent, settings.alertVelocityThreshold, validReps]);
};

const playBeep = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sound } = await Audio.Sound.createAsync(require('../assets/beep.mp3'));
  await sound.playAsync();
};
