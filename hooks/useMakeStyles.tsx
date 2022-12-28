import React from 'react';
import { ImageStyle, TextStyle, useWindowDimensions, ViewStyle } from 'react-native';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const useMakeStyles = <T extends NamedStyles<T> | NamedStyles<any>>(
  makeStyles: (vmin: number) => T
) => {
  const { height, width } = useWindowDimensions();

  const styles = React.useMemo(
    () => makeStyles(Math.min(height, width) / 100),
    [height, width, makeStyles]
  );
  return styles;
};
