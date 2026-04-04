// AsyncStorage helpers — replaces localStorage from the web app
import AsyncStorage from '@react-native-async-storage/async-storage';

const SKIN_TYPE_KEY = 'acne_skin_type';
const GENDER_KEY = 'acne_gender';
const HISTORY_KEY = 'acne_scan_history';
const USER_KEY = 'acne_user';

// --- Skin Profile ---
export async function saveSkinProfile(skinType: string, gender: string) {
  await AsyncStorage.setItem(SKIN_TYPE_KEY, skinType);
  await AsyncStorage.setItem(GENDER_KEY, gender);
}

export async function getSkinType(): Promise<string> {
  return (await AsyncStorage.getItem(SKIN_TYPE_KEY)) || 'Normal';
}

export async function getGender(): Promise<string> {
  return (await AsyncStorage.getItem(GENDER_KEY)) || 'other';
}

// --- Scan History ---
export interface ScanRecord {
  id: string;
  date: string;
  severity: string;
  confidence: number;
  skinType: string;
  imageUri?: string;
}

export async function saveToHistory(record: ScanRecord) {
  const existing = await getHistory();
  existing.unshift(record); // newest first
  // Keep max 50 entries
  const trimmed = existing.slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export async function getHistory(): Promise<ScanRecord[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// --- User Auth (simple) ---
export async function saveUser(name: string) {
  await AsyncStorage.setItem(USER_KEY, name);
}

export async function getUser(): Promise<string | null> {
  return AsyncStorage.getItem(USER_KEY);
}
