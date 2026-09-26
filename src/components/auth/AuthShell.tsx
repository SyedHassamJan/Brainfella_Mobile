import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/theme/ThemeProvider';

/**
 * Shared frame for sign-in / sign-up: the brand name in soft serif, a quiet
 * line of welcome, and two faint color washes in the corners for depth
 * (very low opacity: atmosphere, not decoration).
 */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View className="flex-1 bg-canvas">
      <View pointerEvents="none" style={{ position: 'absolute', top: -90, right: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: colors.primarySoft, opacity: 0.9 }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 210, left: -110, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.lavenderSoft, opacity: 0.7 }} />
      <Screen>
        <View className="gap-8 pt-6">
          <Reveal index={0}>
            <View className="gap-3">
              <Text variant="label" className="text-primary-strong">
                BRAINHEALTH
              </Text>
              <Text variant="display">{title}</Text>
              <Text variant="body" className="text-ink-soft">
                {subtitle}
              </Text>
            </View>
          </Reveal>
          <Reveal index={1}>{children}</Reveal>
        </View>
      </Screen>
    </View>
  );
}
