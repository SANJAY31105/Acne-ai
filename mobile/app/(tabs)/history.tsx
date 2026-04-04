import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useEffect, useState, useCallback } from 'react';
import { getHistory, clearHistory, ScanRecord } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === 'Mild' ? Colors.mild
    : severity === 'Moderate' ? Colors.moderate
    : severity === 'Severe' ? Colors.severe
    : Colors.inconclusive;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

function TrendIndicator({ history }: { history: ScanRecord[] }) {
  if (history.length < 2) return null;

  const severityScore = (s: string) => s === 'Mild' ? 1 : s === 'Moderate' ? 2 : s === 'Severe' ? 3 : 0;
  const recent = severityScore(history[0].severity);
  const prev = severityScore(history[1].severity);

  if (recent < prev) {
    return (
      <View style={[styles.trendBadge, { backgroundColor: Colors.emerald + '20' }]}>
        <Ionicons name="trending-down" size={18} color={Colors.emerald} />
        <Text style={[styles.trendText, { color: Colors.emerald }]}>Improving</Text>
      </View>
    );
  } else if (recent > prev) {
    return (
      <View style={[styles.trendBadge, { backgroundColor: Colors.red + '20' }]}>
        <Ionicons name="trending-up" size={18} color={Colors.red} />
        <Text style={[styles.trendText, { color: Colors.red }]}>Worsening</Text>
      </View>
    );
  }
  return (
    <View style={[styles.trendBadge, { backgroundColor: Colors.amber + '20' }]}>
      <Ionicons name="remove" size={18} color={Colors.amber} />
      <Text style={[styles.trendText, { color: Colors.amber }]}>Stable</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const h = await getHistory();
        setHistory(h);
      })();
    }, [])
  );

  const handleClear = () => {
    Alert.alert('Clear History', 'Are you sure you want to delete all scan history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scan History</Text>
          <Text style={styles.subtitle}>{history.length} scans recorded</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="trash-outline" size={22} color={Colors.red} />
          </TouchableOpacity>
        )}
      </View>

      {/* Trend Indicator */}
      {history.length >= 2 && (
        <View style={styles.trendContainer}>
          <TrendIndicator history={history} />
        </View>
      )}

      {/* Scan List */}
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyDesc}>Your scan history will appear here after your first analysis</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const date = new Date(item.date);
            return (
              <View style={styles.scanCard}>
                <SeverityDot severity={item.severity} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.scanSeverity}>{item.severity}</Text>
                  <Text style={styles.scanMeta}>
                    {date.toLocaleDateString()} · {item.skinType} · {item.confidence.toFixed(0)}%
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  trendContainer: {
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  trendBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    alignSelf: 'flex-start',
  },
  trendText: { fontSize: 14, fontWeight: '700' },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xl,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptyDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  scanCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  scanSeverity: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scanMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
});
