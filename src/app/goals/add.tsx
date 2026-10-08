import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

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
  suggestedPercent: string;
}[] = [
  {
    label: 'General',
    value: 'piggy_bank',
    icon: 'piggy-bank',
    tagline: 'Everyday cash buffer & flexible goals',
    detail: 'Ideal for short-term purchases, gadgets, or general cash reserves. Flexible contributions anytime.',
    suggestedPercent: '10',
  },
  {
    label: 'Junior',
    value: 'children',
    icon: 'baby-face-outline',
    tagline: 'Kids, education & family futures',
    detail: 'Long-term piggy bank dedicated to your children’s schooling, extracurriculars, or future milestone gifts.',
    suggestedPercent: '5',
  },
  {
    label: 'Emergency',
    value: 'emergency',
    icon: 'shield-check-outline',
    tagline: 'Safety net for unexpected life events',
    detail: 'Experts recommend saving 3 to 6 months of living expenses here. Highly recommended with Auto-Save %.',
    suggestedPercent: '15',
  },
  {
    label: 'Milestone',
    value: 'dream',
    icon: 'star-shooting-outline',
    tagline: 'Vacations, vehicles & big purchases',
    detail: 'Tailored for specific high-value targets with a hard deadline date. Watch your progress grow rapidly.',
    suggestedPercent: '10',
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

export default function AddGoalScreen() {
  const theme = useTheme();
  const { addGoal } = useGoals();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [potType, setPotType] = useState<PotType>('piggy_bank');
  const [allocationType, setAllocationType] = useState<AllocationType>('percentage');
  const [allocationPercent, setAllocationPercent] = useState('10');
  const [frequency, setFrequency] = useState<GoalFrequency>('monthly');
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const selectedPotMeta = POT_TYPES.find((p) => p.value === potType) ?? POT_TYPES[0];

  const handleSelectPot = (pt: typeof POT_TYPES[number]) => {
    triggerHaptic();
    setPotType(pt.value);
    if (!title.trim() || title === 'General' || title === 'Junior' || title === 'Emergency' || title === 'Milestone') {
      setTitle(pt.label + ' Savings');
    }
    setAllocationPercent(pt.suggestedPercent);
  };

  const handleCreate = async () => {
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
      const startDate = new Date().toISOString();

      await addGoal({
        title: trimmedTitle,
        targetAmount: parsedTarget,
        startDate,
        deadlineDate: allocationType !== 'flexible' ? deadlineDate.toISOString() : null,
        frequency,
        potType,
        allocationType,
        allocationPercent: allocationType === 'percentage' ? parsedPercent : null,
        icon: potType === 'children' ? 'teddy-bear' : potType === 'emergency' ? 'shield-check' : potType === 'dream' ? 'star-shooting' : 'piggy-bank',
      });

      router.back();
    } catch {
      setMessage('Could not create goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Create Savings Pot</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Choose a category and set up your automated or flexible savings stash.
          </ThemedText>
        </View>

        <Card style={styles.formCard}>
          {/* Top Category Selector Bar */}
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
                    accessibilityLabel={pt.label}
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

          {/* Dynamic Details Box for Selected Category */}
          <Animated.View
            key={potType}
            layout={Layout.springify().damping(18)}
            entering={FadeInDown.duration(200)}
            style={[styles.detailBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
            <ThemedText type="smallBold" themeColor="accent">{selectedPotMeta.label} Savings</ThemedText>
            <ThemedText type="caption" style={{ lineHeight: 18 }}>
              {selectedPotMeta.detail}
            </ThemedText>
          </Animated.View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Pot Title</ThemedText>
            <TextInput
              value={title}
              onChangeText={(val) => { setTitle(val); setMessage(''); }}
              placeholder="e.g. Kids College Fund, Emergency Buffer"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              accessibilityLabel="Pot title"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Target Amount</ThemedText>
            <TextInput
              value={targetAmount}
              onChangeText={(val) => { setTargetAmount(val.replace(/[^0-9.]/g, '')); setMessage(''); }}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              accessibilityLabel="Target amount"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* Savings Allocation Rule Cards (No Tick / Checkmark) */}
          <View style={styles.field}>
            <ThemedText type="smallBold">Savings Allocation Rule</ThemedText>
            <View style={styles.allocationColumn}>
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
                      styles.allocationCard,
                      {
                        borderColor: selected ? theme.accent : theme.border,
                        backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                      },
                    ]}>
                    <View style={[styles.ruleIconBadge, { backgroundColor: selected ? theme.accent : theme.backgroundElement }]}>
                      <MaterialCommunityIcons
                        name={rule.icon}
                        size={20}
                        color={selected ? '#FFFFFF' : theme.textSecondary}
                      />
                    </View>
                    <View style={styles.ruleTextGroup}>
                      <ThemedText type="smallBold" themeColor={selected ? 'accent' : 'text'}>
                        {rule.label}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary" style={{ lineHeight: 16 }}>
                        {rule.subtitle}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {allocationType === 'percentage' && (
            <Animated.View layout={Layout.springify().damping(18)} style={styles.field}>
              <ThemedText type="smallBold">Earnings Auto-Save Percentage (%)</ThemedText>
              <TextInput
                value={allocationPercent}
                onChangeText={(val) => { setAllocationPercent(val.replace(/[^0-9.]/g, '')); setMessage(''); }}
                placeholder="10"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                accessibilityLabel="Allocation percentage"
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
              />
              <View style={styles.presetRow}>
                {PERCENT_PRESETS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => {
                      triggerHaptic();
                      setAllocationPercent(p);
                    }}
                    style={[styles.presetChip, { borderColor: allocationPercent === p ? theme.accent : theme.border, backgroundColor: allocationPercent === p ? theme.accentMuted : theme.cardMuted }]}>
                    <ThemedText type="smallBold" themeColor={allocationPercent === p ? 'accent' : 'text'}>{p}%</ThemedText>
                  </Pressable>
                ))}
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                Whenever you record earnings, {allocationPercent || '0'}% is automatically saved into this pot.
              </ThemedText>
            </Animated.View>
          )}

          {allocationType === 'flexible' && (
            <Animated.View layout={Layout.springify().damping(18)} style={styles.field}>
              <ThemedText type="caption" themeColor="textSecondary" style={{ fontStyle: 'italic', lineHeight: 18 }}>
                ✨ Flexible Stash mode: No monthly rules, no strict deadlines, and no percentage pressure. Deposit money anytime you want and separate your cash peacefully.
              </ThemedText>
            </Animated.View>
          )}

          {allocationType !== 'flexible' && (
            <View style={styles.field}>
              <ThemedText type="smallBold">Target Deadline Date</ThemedText>
              <DatePicker value={deadlineDate} onChange={setDeadlineDate} />
            </View>
          )}

          <View style={styles.field}>
            <ThemedText type="smallBold">Contribution Frequency</ThemedText>
            <View style={styles.freqGrid}>
              {FREQUENCIES.map((f) => {
                const selected = frequency === f.value;
                return (
                  <Pressable
                    key={f.value}
                    onPress={() => {
                      triggerHaptic();
                      setFrequency(f.value);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.freqChip,
                      {
                        borderColor: selected ? theme.accent : theme.border,
                        backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                      },
                    ]}>
                    <ThemedText type="smallBold" numberOfLines={1} themeColor={selected ? 'accent' : 'textSecondary'}>{f.label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {message ? <ThemedText type="caption" themeColor="danger">{message}</ThemedText> : null}

          <Pressable
            onPress={handleCreate}
            disabled={isSubmitting}
            accessibilityRole="button"
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>Create Savings Pot</ThemedText>
          </Pressable>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  formCard: { gap: Spacing.three },
  field: { gap: Spacing.one },
  input: { minHeight: 48, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 16 },
  iconBar: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  iconButton: { flex: 1, height: 64, borderRadius: Radius.large, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 2 },
  detailBox: { padding: Spacing.three, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
  allocationColumn: { gap: Spacing.two },
  allocationCard: { minHeight: 76, borderRadius: Radius.large, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', padding: Spacing.three, gap: Spacing.three },
  ruleIconBadge: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  ruleTextGroup: { flex: 1, gap: 2 },
  presetRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  presetChip: { flex: 1, height: 40, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  freqChip: { width: '31%', minHeight: 44, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.two },
  submitBtn: { minHeight: 48, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.one },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
