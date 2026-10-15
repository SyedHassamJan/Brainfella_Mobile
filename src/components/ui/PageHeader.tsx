import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { softShadow } from '@/theme/tokens';

import { Text } from './Text';

/**
 * Title area for a screen. `back` adds a soft round back button (stack screens);
 * tab screens use the plain serif title with an optional gentle subtitle.
 */
export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  return (
    <View className="gap-3">
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface border border-line"
          style={softShadow}>
          <ChevronLeft size={22} color={colors.inkSoft} strokeWidth={1.7} />
        </Pressable>
      ) : null}
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1.5">
          <Text variant="title">{title}</Text>
          {subtitle ? <Text variant="small">{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}
