import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useCallback } from 'react';
import { getSkinType, getHistory, clearHistory, ScanRecord } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [skinType, setSkinType] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const st = await getSkinType();
        if (st !== 'Normal') setSkinType(st);
        else setSkinType(null);
        const history = await getHistory();
        const clean = history.filter(h => h.severity && h.confidence != null);
        if (clean.length > 0) {
          setLastScan(clean[0]);
        } else if (history.length > 0 && clean.length === 0) {
          await clearHistory();
        }
      })();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <LinearGradient
          colors={[Colors.indigo + '30', Colors.cyan + '15', 'transparent']}
          style={styles.gradient}
        />
        <Text style={styles.badge}>AI SKINCARE</Text>
        <Text style={styles.title}>ACNE AI</Text>
        <Text style={styles.subtitle}>
          Professional-grade acne analysis powered by deep learning.
          Get instant severity grading & personalized routines.
        </Text>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaPrimary]}
          onPress={() => router.push('/(tabs)/analyze')}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-circle" size={24} color="#fff" />
          <Text style={styles.ctaText}>Scan Your Skin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaSecondary]}
          onPress={() => router.push('/(tabs)/quiz')}
          activeOpacity={0.8}
        >
          <Ionicons name="clipboard" size={24} color={Colors.indigo} />
          <Text style={[styles.ctaText, { color: Colors.indigo }]}>Take Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Skin Type Card */}
      {skinType && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOUR SKIN TYPE</Text>
          <Text style={styles.cardValue}>{skinType}</Text>
        </View>
      )}

      {/* Last Scan Card */}
      {lastScan && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LAST SCAN</Text>
          <View style={styles.scanRow}>
            <View style={[styles.severityDot, {
              backgroundColor: lastScan.severity === 'Mild' ? Colors.mild
                : lastScan.severity === 'Moderate' ? Colors.moderate
                : lastScan.severity === 'Severe' ? Colors.severe
                : Colors.inconclusive
            }]} />
            <Text style={styles.cardValue}>{lastScan.severity}</Text>
            <Text style={styles.cardConfidence}>{(lastScan.confidence ?? 0).toFixed(0)}%</Text>
          </View>
          <Text style={styles.cardDate}>{new Date(lastScan.date).toLocaleDateString()}</Text>
        </View>
      )}

      {/* Feature Cards */}
      <Text style={styles.sectionTitle}>How It Works</Text>
      {[
        { icon: 'camera', title: 'Capture', desc: 'Take a photo or upload from gallery' },
        { icon: 'analytics', title: 'AI Analysis', desc: 'EfficientNetV2-S grades severity in seconds' },
        { icon: 'medkit', title: 'Get Routines', desc: 'Personalized AM/PM skincare plans' },
        { icon: 'trending-up', title: 'Track Progress', desc: 'Monitor your skin over time' },
      ].map((f, i) => (
        <View key={i} style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Ionicons name={f.icon as any} size={22} color={Colors.indigo} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  hero: {
    paddingTop: 70,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  badge: {
    color: Colors.indigo,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  ctaPrimary: {
    backgroundColor: Colors.indigo,
  },
  ctaSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.indigo,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardConfidence: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  cardDate: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.indigo + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
