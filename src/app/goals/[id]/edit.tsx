import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useGoals, type GoalWithProgress } from '@/context/goal-context';
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
  const { goals, isLoading } = useGoals();
  const goal = goals.find((g) => g.id === id);

  if (!goal && isLoading) {
    return (
      <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.two }]}>
        <ActivityIndicator color={theme.accent} size="large" />
        <ThemedText type="small" themeColor="textSecondary">Loading pot…</ThemedText>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', padding: Spacing.four }]}>
        <ThemedText type="subtitle">Goal not found</ThemedText>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to Pots"
          style={{ marginTop: Spacing.three }}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>← Back to Pots</ThemedText>
        </Pressable>
      </View>
    );
  }

  return <EditGoalForm key={goal.id} goal={goal} />;
}

function EditGoalForm({ goal }: { goal: GoalWithProgress }) {
  const theme = useTheme();
  const { goals, updateGoal } = useGoals();

  const [title, setTitle] = useState(goal.title);
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount > 0 ? String(goal.targetAmount) : '');
  const [potType, setPotType] = useState<PotType>(goal.potType ?? 'piggy_bank');
  const [allocationType, setAllocationType] = useState<AllocationType>(goal.allocationType ?? 'percentage');
  const [allocationPercent, setAllocationPercent] = useState(goal.allocationPercent ? String(goal.allocationPercent) : '10');
  const [frequency, setFrequency] = useState<GoalFrequency>(goal.frequency ?? 'monthly');
  const [deadlineDate, setDeadlineDate] = useState(() => {
    if (goal.deadlineDate) return new Date(goal.deadlineDate);
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const committedPercent = goals.reduce(
    (sum, g) =>
      sum +
      (g.id !== goal.id && !g.isCompleted && g.allocationType === 'percentage'
        ? g.allocationPercent ?? 0
        : 0),
    0
  );
  const currentPercent = allocationType === 'percentage' ? Number(allocationPercent) || 0 : 0;
  const totalAutoSavePercent = Math.round((committedPercent + currentPercent) * 100) / 100;
  const exceedsAutoSaveLimit = allocationType === 'percentage' && totalAutoSavePercent > 100;

  const handleSelectPot = (pt: typeof POT_TYPES[number]) => {
    triggerHaptic();
    setPotType(pt.value);
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    triggerHaptic();
    const trimmedTitle = title.trim();
    const trimmedTarget = targetAmount.trim();
    const parsedTarget = trimmedTarget ? Number(trimmedTarget) : 0;

    if (!trimmedTitle) {
      setMessage('Please enter a goal or pot title.');
      return;
    }
    if (trimmedTarget && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
      setMessage('Please enter a valid target amount greater than zero, or leave it blank.');
      return;
    }

    let parsedPercent: number | null = null;
    if (allocationType === 'percentage') {
      parsedPercent = Number(allocationPercent);
      if (!Number.isFinite(parsedPercent) || parsedPercent <= 0 || parsedPercent > 100) {
        setMessage('Please enter a valid percentage between 1 and 100.');
        return;
      }
      if (committedPercent + parsedPercent > 100) {
        setMessage(
          `Auto-Save would total ${Math.round((committedPercent + parsedPercent) * 100) / 100}% of every income. Reduce this pot or another pot to stay within 100%.`
        );
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
        // Clearing the target reopens the pot as an open-ended stash.
        status: parsedTarget <= 0 || parsedTarget > goal.contributedAmount ? 'active' : goal.status,
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
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
                    accessibilityState={{ selected }}
                    accessibilityLabel={pt.label}
                    style={[
                      styles.iconButton,
                      {
                        borderColor: selected ? theme.accentFill : theme.border,
                        backgroundColor: selected ? theme.accentFill : theme.cardMuted,
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
              accessibilityLabel="Pot title"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* Target Amount */}
          <View style={styles.field}>
            <ThemedText type="smallBold">
              Target Amount <ThemedText type="caption" themeColor="textSecondary">(optional)</ThemedText>
            </ThemedText>
            <TextInput
              value={targetAmount}
              onChangeText={(val) => setTargetAmount(val.replace(/[^0-9.]/g, ''))}
              placeholder="Leave blank for no fixed target"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              accessibilityLabel="Target amount, optional"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
            <ThemedText type="caption" themeColor="textSecondary">
              Leave blank to keep this pot open-ended without a goal amount.
            </ThemedText>
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
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: allocationPercent === p }}
                    style={[
                      styles.percentChip,
                      {
                        backgroundColor: allocationPercent === p ? theme.accentFill : theme.cardMuted,
                        borderColor: allocationPercent === p ? theme.accentFill : theme.border,
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
                accessibilityLabel="Auto-save percentage"
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
              />
              <ThemedText type="caption" themeColor={exceedsAutoSaveLimit ? 'danger' : 'textSecondary'}>
                {committedPercent > 0
                  ? `Other pots auto-save ${committedPercent}% · total with this pot: ${totalAutoSavePercent}% of every income.`
                  : `Total auto-save will be ${totalAutoSavePercent}% of every income.`}
              </ThemedText>
            </View>
          )}

          {/* Frequency */}
          {allocationType !== 'flexible' && (
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
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.freqButton,
                      {
                        borderColor: selected ? theme.accentFill : theme.border,
                        backgroundColor: selected ? theme.accentFill : theme.cardMuted,
                      },
                    ]}>
                    <ThemedText type="caption" style={{ fontWeight: '700', color: selected ? theme.onBrand : theme.textSecondary }}>
                      {freq.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          )}

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
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting }}
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: theme.accentFill }, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>Save changes</ThemedText>
          </Pressable>
        </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  percentChip: { flex: 1, height: 44, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  freqButton: { width: '31%', height: 44, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { height: 50, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
  pressed: { opacity: 0.78 },
});
