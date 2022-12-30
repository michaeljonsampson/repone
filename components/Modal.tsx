import React from 'react';
import {
  Modal as ReactNativeModal,
  Pressable,
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { MakeStyles, useMakeStyles } from '../hooks/useMakeStyles';

export default function Modal({
  children,
  open,
  onClose,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  const styles = useMakeStyles(makeStyles);

  return (
    <ReactNativeModal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={() => {
        onClose();
      }}
    >
      <ScrollView>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.closeButtonWrapper}>
              <Pressable style={styles.closeButton} onPress={() => onClose()}>
                <Text style={styles.closeButtonText}>X</Text>
              </Pressable>
            </View>
            {children}
          </View>
        </View>
      </ScrollView>
    </ReactNativeModal>
  );
}

const makeStyles = ({ vmin, vh, vw }: MakeStyles) => {
  return StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },
    modalView: {
      height: 92 * vh,
      width: 92 * vw,
      margin: 20,
      backgroundColor: 'black',
      borderColor: 'white',
      borderWidth: 0.5 * vmin,
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    closeButtonWrapper: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    closeButton: {
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 10,
      backgroundColor: '#222222',
      borderWidth: 0.5 * vmin,
      borderColor: 'white',
      borderRadius: 7 * vmin,
      width: 7 * vmin,
      height: 7 * vmin,
    },
    closeButtonText: {
      fontSize: 4 * vmin,
      fontWeight: 'bold',
      color: 'white',
    },
  });
};
