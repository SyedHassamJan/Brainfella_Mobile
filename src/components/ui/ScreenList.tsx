import type { ReactElement, ReactNode } from 'react';
import { FlatList, RefreshControl, View, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/ThemeProvider';

interface Props<T> {
  data: T[] | undefined;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  header?: ReactElement;
  empty?: ReactNode;
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  tabBarSpace?: boolean;
}

/** A calm list screen: safe-area padding, roomy spacing, pull-to-refresh, infinite scroll. */
export function ScreenList<T>({ data, renderItem, keyExtractor, header, empty, footer, refreshing, onRefresh, onEndReached, tabBarSpace }: Props<T>) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  return (
    <FlatList
      className="flex-1 bg-canvas"
      data={data ?? []}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={empty ? <View>{empty}</View> : null}
      ListFooterComponent={footer ? <View>{footer}</View> : null}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 24,
        paddingBottom: (tabBarSpace ? 104 : insets.bottom) + 24,
        gap: 0,
      }}
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}
    />
  );
}
