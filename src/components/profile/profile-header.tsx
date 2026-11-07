import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Badge, Button, Icon, ListRow, ProgressMeter, Sheet, StatStrip } from '@/components/ui';
import { COVER_PRESETS, DEFAULT_COVER_KEY, DEFAULT_COVER_URI, getCoverSource } from '@/constants/cover-presets';
import { BadgeSize, MinTouchTarget, OnPhotoColors, PressFeedback, Radius, Spacing } from '@/constants/theme';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { useGoals } from '@/context/goal-context';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';

import type { ProfileDraft } from './use-profile-draft';

const AVATAR = BadgeSize.lg + Spacing.five; // 80 dp

/** Banner, photo, name and a few counts at the top of Profile & Settings. */
export function ProfileHeader({ draft }: { draft: ProfileDraft }) {
  const theme = useTheme();
  const { expenses } = useExpenses();
  const { customCategories } = usePreferences();
  const { goals } = useGoals();
  const [coverOpen, setCoverOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const percent = Math.round(draft.completion * 100);
  const name = draft.name.trim();

  return (
    <Card padded={false}>
      <Pressable
        onPress={() => {
          triggerHaptic();
          setCoverOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Change banner"
        style={({ pressed }) => [styles.cover, pressed && PressFeedback]}>
        <Image source={getCoverSource(draft.coverPhotoUri)} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.coverTag}>
          <Icon name="image-edit-outline" size="sm" color={OnPhotoColors.text} />
          <ThemedText type="caption" style={styles.onPhoto}>
            Banner
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.body}>
        <Pressable
          onPress={() => {
            triggerHaptic();
            setPhotoOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={draft.profilePhotoUri ? 'Change or remove profile photo' : 'Add a profile photo'}
          style={({ pressed }) => [styles.avatar, { borderColor: theme.card, backgroundColor: theme.accentFill }, pressed && PressFeedback]}>
          {draft.profilePhotoUri ? (
            <Image source={{ uri: draft.profilePhotoUri }} style={styles.avatarImage} />
          ) : name ? (
            <ThemedText type="title" style={{ color: theme.onBrand }}>
              {name.charAt(0).toUpperCase()}
            </ThemedText>
          ) : (
            <Icon name="account-outline" size="xl" color={theme.onBrand} />
          )}
          <View style={[styles.cameraBadge, { backgroundColor: theme.accentFill, borderColor: theme.card }]}>
            <Icon name="camera-outline" size="sm" color={theme.onBrand} />
          </View>
        </Pressable>

        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <ThemedText type="subtitle" numberOfLines={1} style={styles.flexShrink}>
              {name || 'Your profile'}
            </ThemedText>
            <Badge label="Private" tone="accent" icon="shield-check-outline" />
          </View>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {draft.bio.trim() || 'Add a name, photo and a money goal below.'}
          </ThemedText>
        </View>

        {percent < 100 ? (
          <ProgressMeter fill={draft.completion} color={theme.accent} label="Profile" valueText={`${percent} percent complete`}>
            <ThemedText type="caption" themeColor="textSecondary">
              Profile {percent}% complete
            </ThemedText>
          </ProgressMeter>
        ) : null}

        <StatStrip
          items={[
            { label: 'Transactions', value: String(expenses.length) },
            { label: 'Savings pots', value: String(goals.length) },
            { label: 'My categories', value: String(customCategories.length) },
          ]}
        />
      </View>

      <Sheet visible={photoOpen} onClose={() => setPhotoOpen(false)} title="Profile photo">
        <Button
          label={draft.profilePhotoUri ? 'Choose a new photo' : 'Choose a photo'}
          onPress={() => {
            setPhotoOpen(false);
            // Let the sheet close before the system picker opens.
            setTimeout(() => void draft.pickPhoto('avatar'), 300);
          }}
        />
        {draft.profilePhotoUri ? (
          <Button
            label="Remove photo"
            variant="danger"
            onPress={() => {
              triggerHaptic();
              draft.removeProfilePhoto();
              setPhotoOpen(false);
            }}
          />
        ) : null}
        <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
          Changes are kept when you tap Save.
        </ThemedText>
      </Sheet>

      <CoverSheet
        visible={coverOpen}
        current={draft.coverPhotoUri}
        onClose={() => setCoverOpen(false)}
        onChoose={(uri) => {
          triggerHaptic();
          draft.chooseCover(uri);
          setCoverOpen(false);
        }}
        onUpload={() => {
          setCoverOpen(false);
          setTimeout(() => void draft.pickPhoto('cover'), 300);
        }}
      />
    </Card>
  );
}

type CoverSheetProps = {
  visible: boolean;
  current: string | undefined;
  onClose: () => void;
  onChoose: (uri: string) => void;
  onUpload: () => void;
};

function CoverSheet({ visible, current, onClose, onChoose, onUpload }: CoverSheetProps) {
  const theme = useTheme();
  const active = !current || current === DEFAULT_COVER_KEY ? DEFAULT_COVER_URI : current;

  return (
    <Sheet visible={visible} onClose={onClose} title="Banner">
      <ListRow title="Upload my own photo" subtitle="From your photo library" icon="image-plus" color={theme.accent} onPress={onUpload} />
      <View accessibilityRole="radiogroup" accessibilityLabel="Banner presets" style={styles.presets}>
        {COVER_PRESETS.map((preset) => {
          const selected = active === preset.uri;
          return (
            <Pressable
              key={preset.id}
              onPress={() => onChoose(preset.uri)}
              accessibilityRole="radio"
              accessibilityLabel={`${preset.name}. ${preset.description}`}
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.preset,
                { borderColor: selected ? theme.accent : theme.cardBorder, borderWidth: selected ? 2 : StyleSheet.hairlineWidth },
                pressed && PressFeedback,
              ]}>
              <Image source={getCoverSource(preset.uri)} style={styles.presetImage} />
              <View style={styles.presetCopy}>
                <ThemedText type="smallBold" numberOfLines={1} style={styles.flexShrink}>
                  {preset.name}
                </ThemedText>
                {selected ? <Icon name="check" size="sm" color={theme.accent} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  cover: { height: 140, backgroundColor: OnPhotoColors.fallback },
  coverTag: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: MinTouchTarget - Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: OnPhotoColors.shade,
  },
  onPhoto: { color: OnPhotoColors.text },
  body: { padding: Spacing.three, paddingTop: 0, gap: Spacing.three },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    marginTop: -AVATAR / 2,
    borderRadius: Radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: Radius.pill },
  cameraBadge: {
    position: 'absolute',
    right: -Spacing.half,
    bottom: -Spacing.half,
    width: BadgeSize.sm - Spacing.one,
    height: BadgeSize.sm - Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { gap: Spacing.one },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flexShrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  preset: { flexBasis: '47%', flexGrow: 1, borderRadius: Radius.medium, overflow: 'hidden' },
  presetImage: { width: '100%', height: 72 },
  presetCopy: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, padding: Spacing.two },
});
