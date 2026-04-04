import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useState, useRef, useEffect } from 'react';
import { analyzeSkin } from '@/services/api';
import { getSkinType, saveToHistory } from '@/utils/storage';

const scanMessages = [
  'Detecting skin regions...',
  'Mapping acne zones...',
  'Classifying severity...',
  'Analyzing inflammation...',
  'Building your routine...',
];

export default function AnalyzeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!analyzing) return;
    const timer = setInterval(() => setMsgIdx((i) => (i + 1) % scanMessages.length), 2000);
    return () => clearInterval(timer);
  }, [analyzing]);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo) {
      setImageUri(photo.uri);
      setCameraOpen(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const analyze = async () => {
    if (!imageUri) return;
    setAnalyzing(true);
    setMsgIdx(0);

    try {
      const skinType = await getSkinType();
      const report = await analyzeSkin(imageUri, skinType);

      if (report.status === 'error') {
        Alert.alert('Detection Failed', report.message || 'No face detected. Please try again.');
        setAnalyzing(false);
        return;
      }

      // Save to history
      const sev = report.primary_diagnosis?.severity || report.severity || 'Unknown';
      const conf = report.primary_diagnosis?.confidence || report.confidence || 0;
      await saveToHistory({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        severity: sev,
        confidence: conf,
        skinType: skinType,
      });

      // Navigate to results
      router.push({
        pathname: '/results',
        params: { data: JSON.stringify(report), imageUri },
      });
    } catch (err: any) {
      Alert.alert('Error', 'Could not connect to the server. Make sure the Flask backend is running and your phone is on the same WiFi.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Camera permission gate
  if (cameraOpen) {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <View style={styles.center}>
            <Ionicons name="camera" size={48} color={Colors.textMuted} />
            <Text style={styles.permText}>Camera access is needed to scan your skin</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
              <Text style={styles.primaryBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraFrame} />
            <Text style={styles.cameraHint}>Position your face in the frame</Text>
          </View>
        </CameraView>
        <View style={styles.cameraControls}>
          <TouchableOpacity onPress={() => setCameraOpen(false)}>
            <Ionicons name="close-circle" size={40} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
      </View>
    );
  }

  // Main screen
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analyze Your Skin</Text>
        <Text style={styles.subtitle}>Take a photo or upload to get your AI analysis</Text>
      </View>

      {/* Image Preview */}
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <TouchableOpacity style={styles.clearBtn} onPress={() => setImageUri(null)}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      {/* Capture Buttons */}
      {!analyzing && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.captureBtn} onPress={() => setCameraOpen(true)} activeOpacity={0.7}>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.captureBtnText}>Open Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.7}>
            <Ionicons name="cloud-upload" size={22} color={Colors.indigo} />
            <Text style={[styles.captureBtnText, { color: Colors.indigo }]}>Upload Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Analyze Button */}
      {imageUri && !analyzing && (
        <TouchableOpacity style={styles.analyzeBtn} onPress={analyze} activeOpacity={0.8}>
          <Ionicons name="sparkles" size={22} color="#fff" />
          <Text style={styles.analyzeBtnText}>Analyze Skin</Text>
        </TouchableOpacity>
      )}

      {/* Loading */}
      {analyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.indigo} />
          <Text style={styles.loadingText}>{scanMessages[msgIdx]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: Spacing.lg },
  header: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 6 },
  permText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
  primaryBtn: { backgroundColor: Colors.indigo, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  previewContainer: { marginHorizontal: Spacing.lg, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 320, borderRadius: 20 },
  clearBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },

  placeholder: {
    marginHorizontal: Spacing.lg, height: 240,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  placeholderText: { fontSize: 15, color: Colors.textMuted },

  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  captureBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card, paddingVertical: 16, borderRadius: 14, gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 14, gap: 8,
    borderWidth: 1.5, borderColor: Colors.indigo,
  },
  captureBtnText: { fontWeight: '700', fontSize: 14, color: '#fff' },

  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.indigo, marginHorizontal: Spacing.lg,
    paddingVertical: 18, borderRadius: 16, gap: 10, marginTop: Spacing.lg,
  },
  analyzeBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  loadingContainer: { alignItems: 'center', marginTop: Spacing.xl, gap: 16 },
  loadingText: { fontSize: 15, fontWeight: '600', color: Colors.indigo },

  // Camera
  cameraOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraFrame: {
    width: 260, height: 320, borderRadius: 30,
    borderWidth: 3, borderColor: Colors.indigo + '80',
  },
  cameraHint: { color: '#fff', marginTop: 16, fontSize: 15, fontWeight: '600' },
  cameraControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 24, paddingBottom: 40, backgroundColor: '#000',
  },
  shutterBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff',
  },
});
