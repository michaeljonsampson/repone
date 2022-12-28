export type Rep = {
  averageVelocity: number | null | undefined;
  deviceRepId: number | null | undefined;
  duration: number | null | undefined;
  peakHeight: number | null | undefined;
  peakVelocity: number | null | undefined;
  repNumber: number | null | undefined;
  rom: number | null | undefined;
  other1: number | null | undefined;
  other2: number | null | undefined;
  other3: number | null | undefined;
  recordedAt: number;
};

export type DeviceInfo = { name: string; id: string };
