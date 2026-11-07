import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { FormField, Section, SegmentedControl } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { GenderOption } from '@/types/preferences';
import { triggerHaptic } from '@/utils/motion';

import type { ProfileDraft } from './use-profile-draft';

const GENDERS: { value: GenderOption; label: string }[] = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'other', label: 'Other' },
  { value: '', label: 'Not set' },
];

/** Name, money goal, age and gender. Saved together with the Save bar. */
export function IdentityTab({ draft }: { draft: ProfileDraft }) {
  return (
    <Section title="About you" subtitle="Only stored on this phone. Everything here is optional.">
      <Card style={styles.card}>
        <FormField
          label="Name"
          value={draft.name}
          onChangeText={draft.setName}
          placeholder="e.g. Alex"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          maxLength={50}
        />
        <FormField
          label="Money goal or short bio"
          value={draft.bio}
          onChangeText={draft.setBio}
          placeholder="e.g. Saving for a house and an emergency fund"
          multiline
          maxLength={150}
          helper={`${draft.bio.length} of 150`}
        />
        <FormField
          label="Age"
          value={draft.ageText}
          onChangeText={draft.setAgeText}
          placeholder="e.g. 28"
          keyboardType="number-pad"
          maxLength={3}
          error={draft.ageError}
        />
        <View style={styles.field}>
          <ThemedText type="smallBold">Gender</ThemedText>
          <SegmentedControl
            label="Gender"
            value={draft.gender}
            onChange={(value) => {
              triggerHaptic();
              draft.setGender(value);
            }}
            options={GENDERS}
          />
        </View>
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  field: { gap: Spacing.one },
});
