import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useState, useRef } from 'react';
import { saveSkinProfile } from '@/utils/storage';

const getQuestions = (gender: string | null) => {
  const base = [
    {
      id: 'oiliness',
      question: 'How does your skin feel by midday?',
      icon: 'water',
      options: [
        { label: 'Very oily & shiny', value: 'oily' },
        { label: 'Tight, flaky, or rough', value: 'dry' },
        { label: 'Oily T-zone, dry cheeks', value: 'combination' },
        { label: 'Comfortable, no issues', value: 'normal' },
      ],
    },
    {
      id: 'sensitivity',
      question: 'How does your skin react to new products?',
      icon: 'shield-checkmark',
      options: [
        { label: 'Burns, stings, or turns red easily', value: 'sensitive' },
        { label: 'Occasionally irritated', value: 'moderate' },
        { label: 'Rarely reacts to anything', value: 'resilient' },
      ],
    },
    {
      id: 'pores',
      question: 'How would you describe your pores?',
      icon: 'sunny',
      options: [
        { label: 'Large and visible', value: 'large' },
        { label: 'Small and barely visible', value: 'small' },
        { label: 'Mixed — large on nose, small elsewhere', value: 'mixed' },
      ],
    },
    {
      id: 'breakouts',
      question: 'How often do you get breakouts?',
      icon: 'flash',
      options: [
        { label: 'Constantly — every week', value: 'frequent' },
        { label: 'Sometimes — around stress', value: 'occasional' },
        { label: 'Rarely — once every few months', value: 'rare' },
      ],
    },
    {
      id: 'hydration',
      question: 'How does your skin feel after washing?',
      icon: 'sparkles',
      options: [
        { label: 'Quickly becomes oily again', value: 'oily' },
        { label: 'Feels tight and dry', value: 'dry' },
        { label: 'Feels fresh and balanced', value: 'normal' },
      ],
    },
  ];

  // Gender-specific question
  if (gender === 'male') {
    base.push({
      id: 'shaving',
      question: 'Does shaving irritate your skin?',
      icon: 'man',
      options: [
        { label: 'Yes — razor bumps, redness', value: 'sensitive' },
        { label: 'Mild irritation sometimes', value: 'moderate' },
        { label: 'No issues at all', value: 'resilient' },
      ],
    });
  } else if (gender === 'female') {
    base.push({
      id: 'hormonal',
      question: 'Do you get breakouts around your cycle?',
      icon: 'woman',
      options: [
        { label: 'Yes, every month', value: 'yes' },
        { label: 'No, not related', value: 'no' },
      ],
    });
  }

  return base;
};

function determineSkinType(answers: Record<string, string>): string {
  const vals = Object.values(answers);
  if (vals.includes('sensitive') || answers.sensitivity === 'sensitive') return 'Sensitive';
  const oilyCount = vals.filter((v) => v === 'oily' || v === 'large' || v === 'frequent').length;
  const dryCount = vals.filter((v) => v === 'dry' || v === 'small' || v === 'rare').length;
  if (answers.oiliness === 'combination') return 'Combination';
  if (oilyCount >= 3) return 'Oily';
  if (dryCount >= 3) return 'Dry';
  return 'Normal';
}

export default function QuizScreen() {
  const router = useRouter();
  const [gender, setGender] = useState<string | null>(null);
  const [step, setStep] = useState(-1); // -1 = gender selection
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const questions = getQuestions(gender);

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(callback, 150);
  };

  const selectGender = (g: string) => {
    setGender(g);
    animateTransition(() => setStep(0));
  };

  const selectAnswer = async (value: string) => {
    const q = questions[step];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      animateTransition(() => setStep(step + 1));
    } else {
      // Quiz done — determine skin type
      const skinType = determineSkinType(newAnswers);
      await saveSkinProfile(skinType, gender || 'other');
      router.push('/(tabs)/analyze');
    }
  };

  // Gender selection screen
  if (step === -1) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.stepLabel}>STEP 1</Text>
          <Text style={styles.questionText}>What's your gender?</Text>
          <Text style={styles.questionSub}>This helps us customize your quiz</Text>
        </View>
        <View style={styles.optionsContainer}>
          {[
            { label: 'Male', value: 'male', icon: 'man' },
            { label: 'Female', value: 'female', icon: 'woman' },
            { label: 'Prefer not to say', value: 'other', icon: 'people' },
          ].map((g) => (
            <TouchableOpacity
              key={g.value}
              style={styles.optionCard}
              onPress={() => selectGender(g.value)}
              activeOpacity={0.7}
            >
              <Ionicons name={g.icon as any} size={24} color={Colors.indigo} />
              <Text style={styles.optionLabel}>{g.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.stepLabel}>
          QUESTION {step + 1} OF {questions.length}
        </Text>
        <Ionicons name={current.icon as any} size={36} color={Colors.indigo} style={{ marginBottom: 12 }} />
        <Text style={styles.questionText}>{current.question}</Text>
      </Animated.View>

      <Animated.View style={[styles.optionsContainer, { opacity: fadeAnim }]}>
        {current.options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionCard,
              answers[current.id] === opt.value && styles.optionSelected,
            ]}
            onPress={() => selectAnswer(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionLabel}>{opt.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.indigo,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.indigo,
    letterSpacing: 2,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  questionSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  optionsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.indigo + '15',
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
