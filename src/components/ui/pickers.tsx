import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, Star } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';

import { formatDateTime } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

/**
 * Date + time in one field. Android opens the native date dialog, then the time
 * dialog; iOS shows the compact inline picker.
 */
export function DateTimeField({ label, value, onChange, minimumDate }: { label: string; value: Date; onChange: (d: Date) => void; minimumDate?: Date }) {
  const { colors } = useAppTheme();

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      minimumDate,
      onChange: (e, date) => {
        if (e.type !== 'set' || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          onChange: (e2, time) => {
            if (e2.type !== 'set' || !time) return;
            const merged = new Date(date);
            merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(merged);
          },
        });
      },
    });
  };

  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      {Platform.OS === 'android' ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${formatDateTime(value.toISOString())}`} onPress={openAndroid}>
          <View className="min-h-[56px] flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4">
            <Calendar size={20} color={colors.primaryStrong} strokeWidth={1.7} />
            <Text variant="body">{formatDateTime(value.toISOString())}</Text>
          </View>
        </Pressable>
      ) : (
        <View className="items-start">
          <DateTimePicker value={value} mode="datetime" display="compact" minimumDate={minimumDate} onChange={(_e, d) => d && onChange(d)} />
        </View>
      )}
    </View>
  );
}

/** Five soft stars. Read-only when `onChange` is omitted. */
export function Stars({ value, onChange, size = 22 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View className="flex-row gap-1.5" accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= Math.round(value);
        const star = <Star size={size} color={on ? colors.peach : colors.line} fill={on ? colors.peach : 'transparent'} strokeWidth={1.6} />;
        return onChange ? (
          <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} hitSlop={6} onPress={() => onChange(n)}>
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}
