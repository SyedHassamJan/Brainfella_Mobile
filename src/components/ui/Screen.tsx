import type { ReactNode } from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/ui/AmbientBackground';
import type { AmbientScene } from '@/constants/ambient';
import { useAppTheme } from '@/theme/ThemeProvider';

interface Props {
  children: ReactNode;
  /** Scrollable content (default). Use false for screens that manage their own list. */
  scroll?: boolean;
  /** Extra space at the bottom so content clears the floating tab bar. */
  tabBarSpace?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Pinned below the content (composers, primary actions). */
  footer?: ReactNode;
  /** A calm moving backdrop behind the content. Use on rest spaces only (Home, welcome), not on forms or results. */
  ambient?: AmbientScene;
}

const TAB_BAR_SPACE = 104;

/** Calm canvas with safe-area handling, generous padding and optional pull-to-refresh. */
export function Screen({ children, scroll = true, tabBarSpace, padded = true, refreshing, onRefresh, footer, ambient }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const pad = padded ? 24 : 0;

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: pad,
        paddingBottom: (tabBarSpace ? TAB_BAR_SPACE : 0) + (footer ? 16 : insets.bottom + 24),
        gap: 20,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, paddingTop: insets.top + 16, paddingHorizontal: pad }}>{children}</View>
  );

  // Android is edge-to-edge on this SDK, so the window does not resize for the keyboard: pad on both platforms.
  const body = (
    <KeyboardAvoidingView className={ambient ? 'flex-1' : 'flex-1 bg-canvas'} behavior="padding">
      {content}
      {footer ? <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );

  return ambient ? <AmbientBackground scene={ambient}>{body}</AmbientBackground> : body;
}
