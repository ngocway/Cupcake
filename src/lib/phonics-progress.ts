import prisma from '@/lib/prisma';

export interface PhonicsCompletedStationRecord {
  completedAt: string;
  score?: number | null;
}

export interface PhonicsProgressData {
  completedStations: Record<string, PhonicsCompletedStationRecord>;
}

export function getPhonicsProgressSettingKey(userId: string): string {
  return `phonics_45_progress:${userId}`;
}

export async function getUserPhonicsProgress(userId: string): Promise<PhonicsProgressData> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: getPhonicsProgressSettingKey(userId) },
    });
    if (setting && setting.value && typeof setting.value === 'object') {
      const val = setting.value as any;
      const completedStations =
        val.completedStations && typeof val.completedStations === 'object'
          ? val.completedStations
          : {};
      return { completedStations };
    }
  } catch (err) {
    console.error('Failed to read phonics_45_progress:', err);
  }
  return { completedStations: {} };
}
