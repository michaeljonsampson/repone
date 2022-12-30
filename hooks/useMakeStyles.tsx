import React from 'react';
import { ImageStyle, TextStyle, useWindowDimensions, ViewStyle } from 'react-native';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export type MakeStyles = { vmin: number; vh: number; vw: number };

export const useMakeStyles = <T extends NamedStyles<T> | NamedStyles<any>>(
  makeStyles: ({ vmin, vh, vw }: MakeStyles) => T
) => {
  const { height, width } = useWindowDimensions();

  const styles = React.useMemo(
    () => makeStyles({ vmin: Math.min(height, width) / 100, vh: height / 100, vw: width / 100 }),
    [height, width, makeStyles]
  );
  return styles;
};
