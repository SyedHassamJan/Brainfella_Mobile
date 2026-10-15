import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/**
 * Shared frame for sign-in / sign-up: the brand name in soft serif, a quiet
 * line of welcome, over the calm ripple backdrop (atmosphere, not decoration).
 */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Screen ambient="water">
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
  );
}
