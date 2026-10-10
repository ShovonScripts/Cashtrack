import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useGoals } from '@/context/goal-context';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';
import type { GoalFrequency, PotType, AllocationType } from '@/types/goal';

const FREQUENCIES: { label: string; value: GoalFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Half-Yearly', value: 'half-yearly' },
  { label: 'Yearly', value: 'yearly' },
];

const POT_TYPES: {
  label: string;
  value: PotType;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tagline: string;
  detail: string;
}[] = [
  {
    label: 'General',
    value: 'piggy_bank',
    icon: 'piggy-bank',
    tagline: 'Everyday cash buffer & flexible goals',
    detail: 'Ideal for short-term purchases, gadgets, or general cash reserves. Flexible contributions anytime.',
  },
  {
    label: 'Junior',
    value: 'children',
    icon: 'baby-face-outline',
    tagline: 'Kids, education & family futures',
    detail: 'Long-term piggy bank dedicated to your children’s schooling, extracurriculars, or future milestone gifts.',
  },
  {
    label: 'Emergency',
    value: 'emergency',
    icon: 'shield-check-outline',
    tagline: 'Safety net for unexpected life events',
    detail: 'Experts recommend saving 3 to 6 months of living expenses here.',
  },
  {
    label: 'Milestone',
    value: 'dream',
    icon: 'star-shooting-outline',
    tagline: 'Vacations, vehicles & big purchases',
    detail: 'Tailored for specific high-value targets with a hard deadline date.',
  },
];

const ALLOCATION_RULES: {
  type: AllocationType;
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { type: 'percentage', label: 'Auto-Save %', subtitle: 'Save % of earnings automatically', icon: 'lightning-bolt' },
  { type: 'flexible', label: 'Flexible Stash', subtitle: 'Stash cash anytime with zero rules', icon: 'piggy-bank-outline' },
  { type: 'manual', label: 'Manual Only', subtitle: 'Contribute manually on your own terms', icon: 'hand-coin-outline' },
];

const PERCENT_PRESETS = ['5', '10', '15', '20'];

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { goals, updateGoal } = useGoals();

  const goal = goals.find((g) => g.id === id);

  const [title, setTitle] = useState(goal?.title ?? '');
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : '');
  const [potType, setPotType] = useState<PotType>(goal?.potType ?? 'piggy_bank');
  const [allocationType, setAllocationType] = useState<AllocationType>(goal?.allocationType ?? 'percentage');
  const [allocationPercent, setAllocationPercent] = useState(goal?.allocationPercent ? String(goal.allocationPercent) : '10');
  const [frequency, setFrequency] = useState<GoalFrequency>(goal?.frequency ?? 'monthly');
  const [deadlineDate, setDeadlineDate] = useState(() => {
    if (goal?.deadlineDate) return new Date(goal.deadlineDate);
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  if (!goal) {
    return (
      <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', padding: Spacing.four }]}>
        <ThemedText type="subtitle">Goal not found</ThemedText>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.three }}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>← Back to Pots</ThemedText>
        </Pressable>
      </View>
    );
  }

  const handleSelectPot = (pt: typeof POT_TYPES[number]) => {
    triggerHaptic();
    setPotType(pt.value);
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    triggerHaptic();
    const trimmedTitle = title.trim();
    const parsedTarget = Number(targetAmount);

    if (!trimmedTitle) {
      setMessage('Please enter a goal or pot title.');
      return;
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setMessage('Please enter a valid target amount greater than zero.');
      return;
    }

    let parsedPercent: number | null = null;
    if (allocationType === 'percentage') {
      parsedPercent = Number(allocationPercent);
      if (!Number.isFinite(parsedPercent) || parsedPercent <= 0 || parsedPercent > 100) {
        setMessage('Please enter a valid percentage between 1 and 100.');
        return;
      }
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      await updateGoal({
        ...goal,
        title: trimmedTitle,
        targetAmount: parsedTarget,
        deadlineDate: allocationType !== 'flexible' ? deadlineDate.toISOString() : null,
        frequency,
        potType,
        allocationType,
        allocationPercent: allocationType === 'percentage' ? parsedPercent : null,
        icon: potType === 'children' ? 'teddy-bear' : potType === 'emergency' ? 'shield-check' : potType === 'dream' ? 'star-shooting' : 'piggy-bank',
      });

      router.back();
    } catch {
      setMessage('Could not update goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Edit Savings Pot</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Update your savings pot details, targets, or rules.
          </ThemedText>
        </View>

        <Card style={styles.formCard}>
          {/* Category Selector Bar */}
          <View style={styles.field}>
            <ThemedText type="smallBold">Select Savings Category</ThemedText>
            <View style={styles.iconBar}>
              {POT_TYPES.map((pt) => {
                const selected = potType === pt.value;
                return (
                  <Pressable
                    key={pt.value}
                    onPress={() => handleSelectPot(pt)}
                    accessibilityRole="button"
                    style={[
                      styles.iconButton,
                      {
                        borderColor: selected ? theme.accent : theme.border,
                        backgroundColor: selected ? theme.accent : theme.cardMuted,
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name={pt.icon}
                      size={24}
                      color={selected ? '#FFFFFF' : theme.textSecondary}
                    />
                    <ThemedText type="caption" numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: selected ? '#FFFFFF' : theme.textSecondary }}>
                      {pt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.field}>
            <ThemedText type="smallBold">Pot Title</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Summer Vacation, Emergency Fund"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* Target Amount */}
          <View style={styles.field}>
            <ThemedText type="smallBold">Target Amount</ThemedText>
            <TextInput
              value={targetAmount}
              onChangeText={(val) => setTargetAmount(val.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* Allocation Rule */}
          <View style={styles.field}>
            <ThemedText type="smallBold">Savings Allocation Rule</ThemedText>
            <View style={styles.rulesList}>
              {ALLOCATION_RULES.map((rule) => {
                const selected = allocationType === rule.type;
                return (
                  <Pressable
                    key={rule.type}
                    onPress={() => {
                      triggerHaptic();
                      setAllocationType(rule.type);
                    }}
                    style={[
                      styles.ruleCard,
                      {
                        borderColor: selected ? theme.accent : theme.border,
                        backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name={rule.icon}
                      size={20}
                      color={selected ? theme.accent : theme.textSecondary}
                    />
                    <View style={styles.ruleCopy}>
                      <ThemedText type="smallBold" style={{ color: selected ? theme.accent : theme.text }}>
                        {rule.label}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {rule.subtitle}
                      </ThemedText>
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={20}
                      color={selected ? theme.accent : theme.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Percentage Input if Auto-Save */}
          {allocationType === 'percentage' && (
            <View style={styles.field}>
              <ThemedText type="smallBold">Auto-Save Percentage (%)</ThemedText>
              <View style={styles.percentChipsRow}>
                {PERCENT_PRESETS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setAllocationPercent(p)}
                    style={[
                      styles.percentChip,
                      {
                        backgroundColor: allocationPercent === p ? theme.accent : theme.cardMuted,
                        borderColor: allocationPercent === p ? theme.accent : theme.border,
                      },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: allocationPercent === p ? '#FFFFFF' : theme.text }}>
                      {p}%
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={allocationPercent}
                onChangeText={(val) => setAllocationPercent(val.replace(/[^0-9.]/g, ''))}
                placeholder="10"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
              />
            </View>
          )}

          {/* Frequency */}
          <View style={styles.field}>
            <ThemedText type="smallBold">Pacing Frequency</ThemedText>
            <View style={styles.frequencyGrid}>
              {FREQUENCIES.map((freq) => {
                const selected = frequency === freq.value;
                return (
                  <Pressable
                    key={freq.value}
                    onPress={() => {
                      triggerHaptic();
                      setFrequency(freq.value);
                    }}
                    style={[
                      styles.freqButton,
                      {
                        borderColor: selected ? theme.accent : theme.border,
                        backgroundColor: selected ? theme.accent : theme.cardMuted,
                      },
                    ]}>
                    <ThemedText type="caption" style={{ fontWeight: '700', color: selected ? '#FFFFFF' : theme.textSecondary }}>
                      {freq.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Deadline Picker if not flexible */}
          {allocationType !== 'flexible' && (
            <View style={styles.field}>
              <ThemedText type="smallBold">Target Deadline Date</ThemedText>
              <DatePicker value={deadlineDate} onChange={setDeadlineDate} />
            </View>
          )}

          {message ? <ThemedText type="caption" themeColor="danger">{message}</ThemedText> : null}

          <Pressable
            onPress={handleSave}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>Save changes</ThemedText>
          </Pressable>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: 2 },
  title: { fontSize: 22, lineHeight: 28 },
  formCard: { gap: Spacing.three },
  field: { gap: Spacing.one },
  iconBar: { flexDirection: 'row', gap: Spacing.two },
  iconButton: { flex: 1, height: 64, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 4 },
  input: { height: 48, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 16 },
  rulesList: { gap: Spacing.two },
  ruleCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth },
  ruleCopy: { flex: 1, gap: 2 },
  percentChipsRow: { flexDirection: 'row', gap: Spacing.two },
  percentChip: { flex: 1, height: 38, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  freqButton: { width: '31%', height: 40, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { height: 50, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
  pressed: { opacity: 0.78 },
});
