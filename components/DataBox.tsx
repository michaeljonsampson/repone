import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMakeStyles } from '../hooks/useMakeStyles';

export default function DataBox({
  children,
  onClick,
  middle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  middle?: boolean;
}) {
  const styles = useMakeStyles(makeStyles);

  const viewStyle = middle ? { ...styles.box, ...styles.middle } : styles.box;

  if (onClick) {
    return (
      <Pressable style={{ ...viewStyle, ...styles.button }} onPress={onClick}>
        {/* <Text style={styles.buttonText}>{label}</Text> */}
        {children}
      </Pressable>
    );
  }

  return (
    <View style={viewStyle}>
      {/* <Text style={styles.label}>{label}</Text>
      {value !== undefined && <Text style={styles.value}>{value}</Text>} */}
      {children}
    </View>
  );
}

const makeStyles = (vmin: number) => {
  return StyleSheet.create({
    box: {
      flex: 1,
      maxWidth: 30 * vmin,
      minHeight: 22 * vmin,
      maxHeight: 22 * vmin,
      backgroundColor: 'black',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 5 * vmin,
      borderWidth: 0.5 * vmin,
      borderColor: 'white',
      padding: 2 * vmin,
    },
    middle: { marginHorizontal: 2 * vmin },
    button: { backgroundColor: '#222222' },
    buttonText: { color: 'white', fontSize: 6 * vmin },
  });
};
