import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { getCategorySymbolName } from '@/constants/categories';

export function CategoryIcon({
  category,
  customIcons,
  color,
  size = 18,
  containerSize = 32,
}: {
  category: string;
  customIcons?: Record<string, string>;
  color: string;
  size?: number;
  containerSize?: number;
}) {
  const name = getCategorySymbolName(category, customIcons);
  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: Math.round(containerSize / 3),
          backgroundColor: `${color}22`,
        },
      ]}>
      <MaterialCommunityIcons name={name as any} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
