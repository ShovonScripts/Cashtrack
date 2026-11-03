import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type SectionProps = {
  title: string;
  /** Optional one-line explanation under the title. */
  subtitle?: string;
  /** Optional control on the right, such as a "See all" link. */
  action?: ReactNode;
  children: ReactNode;
};

/** A titled group of content. The title is announced as a heading. */
export function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <ThemedText type="defaultBold" accessibilityRole="header">
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerCopy: { flex: 1, gap: 1 },
});
