import { Characteristic } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

const serviceUuid = 'A5183278-CA65-45B7-B6C3-A68552F2026D';
const characteristicUuid = 'A5183278-CA65-45B7-B6C3-A68552F20273';

const getRepDataFromChar = ({
  char,
  setLog,
}: {
  char: Characteristic;
  setLog: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  if (!char.value) {
    return null;
  }

  const buffer = Buffer.from(char.value, 'base64');
  const data = new Uint16Array(buffer.buffer);
  setLog((prev) => [...prev, JSON.stringify(data)]);
  const rep = {
    deviceRepId: data[0],
    repNumber: data[1],
    averageVelocity: data[2],
    rom: data[3],
    peakVelocity: data[4],
    peakHeight: data[5],
    duration: data[6],
    other1: data[7],
    other2: data[8],
    other3: data[9],
    recordedAt: Date.now(),
  };

  console.log(rep);

  return rep;
};

export default { getRepDataFromChar, serviceUuid, characteristicUuid };
