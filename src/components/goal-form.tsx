import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { AmountField, Button, Chip, FormField, Screen, SegmentedControl } from '@/components/ui';
import type { GlyphName } from '@/constants/icons';
import { IconSize, MinTouchTarget, PressFeedback, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/context/expense-context';
import { useGoals } from '@/context/goal-context';
import type { AllocationType, GoalFrequency } from '@/types/goal';
import {
  ALLOCATION_RULES,
  GOAL_FREQUENCIES,
  PERCENT_PRESETS,
  POT_TYPES,
  isDefaultPotTitle,
  potMeta,
  roundPercent,
  validateGoalForm,
  type GoalFormErrors,
  type PotChoice,
} from '@/utils/goal-form';
import { triggerHaptic } from '@/utils/motion';

export type GoalFormResult = {
  title: string;
  targetAmount: number;
  potType: PotChoice;
  icon: string;
  allocationType: AllocationType;
  allocationPercent: number | null;
  frequency: GoalFrequency;
  /** ISO date, or null for a flexible pot (it has no deadline). */
  deadlineDate: string | null;
};

export type GoalFormInitial = {
  title: string;
  targetAmount: string;
  potType: PotChoice;
  allocationType: AllocationType;
  allocationPercent: string;
  frequency: GoalFrequency;
  deadlineDate: Date;
};

type GoalFormProps = {
  initialValues?: GoalFormInitial;
  /** Leave this pot out of the "other pots already auto-save" total (editing). */
  excludeGoalId?: string;
  /** The deadline the pot already has (editing); keeping it is allowed even if it has passed. */
  savedDeadline?: Date | null;
  /** New pots fill in a name and a suggested percentage when the type changes. */
  suggestOnTypeChange?: boolean;
  submitLabel: string;
  /** Throw to keep the form open; the message under the button says it failed. */
  onSubmit: (result: GoalFormResult) => Promise<void>;
  onCancel: () => void;
};

function defaultDeadline(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date;
}

const EMPTY: GoalFormInitial = {
  title: '',
  targetAmount: '',
  potType: 'piggy_bank',
  allocationType: 'percentage',
  allocationPercent: '10',
  frequency: 'monthly',
  deadlineDate: defaultDeadline(),
};

/** The Create and Edit savings pot form. */
export function GoalForm({
  initialValues,
  excludeGoalId,
  savedDeadline,
  suggestOnTypeChange = false,
  submitLabel,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const theme = useTheme();
  const { goals } = useGoals();
  const { country } = usePreferences();
  const initial = initialValues ?? EMPTY;

  const [title, setTitle] = useState(initial.title);
  const [targetAmount, setTargetAmount] = useState(initial.targetAmount);
  const [potType, setPotType] = useState<PotChoice>(initial.potType);
  const [allocationType, setAllocationType] = useState<AllocationType>(initial.allocationType);
  const [allocationPercent, setAllocationPercent] = useState(initial.allocationPercent);
  const [frequency, setFrequency] = useState<GoalFrequency>(initial.frequency);
  const [deadlineDate, setDeadlineDate] = useState(initial.deadlineDate);
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const committedPercent = goals.reduce(
    (sum, g) =>
      sum + (g.id !== excludeGoalId && !g.isCompleted && g.allocationType === 'percentage' ? g.allocationPercent ?? 0 : 0),
    0,
  );
  const isAutoSave = allocationType === 'percentage';
  const isFlexible = allocationType === 'flexible';
  const totalPercent = roundPercent(committedPercent + (isAutoSave ? Number(allocationPercent) || 0 : 0));
  const rule = ALLOCATION_RULES.find((r) => r.value === allocationType) ?? ALLOCATION_RULES[0];

  const clearError = (field: keyof GoalFormErrors) => {
    setSubmitError('');
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
  };

  const selectPot = (value: PotChoice) => {
    triggerHaptic();
    setPotType(value);
    if (!suggestOnTypeChange) return;
    const meta = potMeta(value);
    if (isDefaultPotTitle(title)) setTitle(`${meta.label} Savings`);
    setAllocationPercent(meta.suggestedPercent);
    clearError('allocationPercent');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    triggerHaptic();
    const { errors: found, parsed } = validateGoalForm(
      { title, targetAmount, allocationType, allocationPercent },
      committedPercent,
      { deadline: isFlexible ? null : deadlineDate, savedDeadline },
    );
    setErrors(found);
    if (!parsed) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit({
        ...parsed,
        potType,
        icon: potMeta(potType).icon,
        allocationType,
        frequency,
        deadlineDate: isFlexible ? null : deadlineDate.toISOString(),
      });
    } catch {
      setSubmitError('Could not save the pot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <Screen topInset={false}>
        <View style={styles.field}>
          <ThemedText type="smallBold">Pot type</ThemedText>
          <View accessibilityRole="radiogroup" accessibilityLabel="Pot type" style={styles.potGrid}>
            {POT_TYPES.map((p) => {
              const selected = potType === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => selectPot(p.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={p.label}
                  accessibilityState={{ checked: selected }}
                  style={({ pressed }) => [
                    styles.potTile,
                    {
                      backgroundColor: selected ? theme.accentFill : theme.cardMuted,
                      borderColor: selected ? theme.accentFill : theme.border,
                    },
                    pressed && PressFeedback,
                  ]}>
                  <MaterialCommunityIcons
                    name={p.glyph as GlyphName}
                    size={IconSize.md}
                    color={selected ? theme.onBrand : theme.textSecondary}
                  />
                  <ThemedText
                    type="smallBold"
                    numberOfLines={1}
                    style={[styles.flex, { color: selected ? theme.onBrand : theme.text }]}>
                    {p.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            {potMeta(potType).detail}
          </ThemedText>
        </View>

        <FormField
          label="Pot name"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            clearError('title');
          }}
          placeholder="e.g. Kids college fund"
          autoCapitalize="words"
          maxLength={60}
          error={errors.title}
        />

        <AmountField
          label="Target amount"
          value={targetAmount}
          onChangeText={(value) => {
            setTargetAmount(value);
            clearError('targetAmount');
          }}
          symbol={country.symbol.trim()}
          helper="Optional. Leave blank for an open-ended pot."
          error={errors.targetAmount}
        />

        <View style={styles.field}>
          <ThemedText type="smallBold">How you save</ThemedText>
          <SegmentedControl
            label="How you save"
            value={allocationType}
            onChange={(value) => {
              triggerHaptic();
              setAllocationType(value);
              clearError('allocationPercent');
            }}
            options={ALLOCATION_RULES.map((r) => ({ value: r.value, label: r.label }))}
          />
          <ThemedText type="caption" themeColor="textSecondary">
            {rule.detail}
          </ThemedText>
        </View>

        {isAutoSave ? (
          <Card style={styles.group} variant="muted">
            <FormField
              label="Share of each income (%)"
              value={allocationPercent}
              onChangeText={(value) => {
                setAllocationPercent(value.replace(/[^0-9.]/g, ''));
                clearError('allocationPercent');
              }}
              placeholder="10"
              keyboardType="decimal-pad"
              maxLength={6}
              error={errors.allocationPercent}
              helper={
                committedPercent > 0
                  ? `Other pots already take ${roundPercent(committedPercent)}%. Total with this pot: ${totalPercent}%.`
                  : `Total auto-save: ${totalPercent}% of every income.`
              }
            />
            <View style={styles.chips} accessibilityLabel="Quick percentages">
              {PERCENT_PRESETS.map((p) => (
                <Chip
                  key={p}
                  label={`${p}%`}
                  selected={allocationPercent === p}
                  onPress={() => {
                    triggerHaptic();
                    setAllocationPercent(p);
                    clearError('allocationPercent');
                  }}
                />
              ))}
            </View>
          </Card>
        ) : null}

        {!isFlexible ? (
          <>
            <View style={styles.field}>
              <ThemedText type="smallBold">Deadline</ThemedText>
              <DatePicker
                value={deadlineDate}
                onChange={(date) => {
                  setDeadlineDate(date);
                  clearError('deadline');
                }}
                label="Deadline"
              />
              {errors.deadline ? (
                <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
                  {errors.deadline}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Saving pace</ThemedText>
              <View style={styles.chips}>
                {GOAL_FREQUENCIES.map((f) => (
                  <Chip
                    key={f.value}
                    label={f.label}
                    selected={frequency === f.value}
                    onPress={() => {
                      triggerHaptic();
                      setFrequency(f.value);
                    }}
                  />
                ))}
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                Used to work out how much to put in each period to reach the target by the deadline.
              </ThemedText>
            </View>
          </>
        ) : null}

        {submitError ? (
          <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
            {submitError}
          </ThemedText>
        ) : null}

        <Button label={submitLabel} onPress={handleSubmit} loading={isSubmitting} />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.one },
  group: { gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  potGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  // Two per row: half the width minus half the gap, so labels never truncate on narrow phones.
  potTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: MinTouchTarget + Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
