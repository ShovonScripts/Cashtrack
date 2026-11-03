import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** A softly pulsing placeholder block. It holds still when Reduce Motion is on. */
export function Skeleton({ width = '100%', height = 14, radius = Radius.small, style }: SkeletonProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      opacity.set(0.7);
      return;
    }
    opacity.set(
      withRepeat(withSequence(withTiming(0.45, { duration: 750 }), withTiming(1, { duration: 750 })), -1, false)
    );
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.backgroundElement }, animatedStyle, style]}
    />
  );
}

type SkeletonListProps = {
  rows?: number;
  /** Spoken while loading, for screen readers. */
  label?: string;
};

/** Placeholder for a list of icon + two-line + amount rows, such as transactions or pots. */
export function SkeletonList({ rows = 4, label = 'Loading' }: SkeletonListProps) {
  return (
    <Card padded={false} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityLiveRegion="polite">
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.row}>
          <Skeleton width={40} height={40} radius={Radius.pill} />
          <View style={styles.copy}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="35%" height={10} />
          </View>
          <Skeleton width={56} height={14} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 76,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  copy: { flex: 1, gap: Spacing.two },
});
