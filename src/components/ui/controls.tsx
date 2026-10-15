import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { softShadow } from '@/theme/tokens';

import { Text } from './Text';

/** A quiet pill; selected state uses the soft primary tint. */
export function Chip({
  label,
  selected,
  onPress,
  tint,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional accent (hex) for a dot, e.g. an emotion color. */
  tint?: string;
  icon?: ReactNode;
}) {
  const body = (
    <View
      className={cn(
        'flex-row items-center gap-2 rounded-full border px-4 py-2.5',
        selected ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
      )}>
      {tint ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tint }} /> : null}
      {icon}
      <Text variant="small" className={selected ? 'text-primary-strong' : 'text-ink-soft'}>
        {label}
      </Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}>
      {body}
    </Pressable>
  );
}

/** Read-only label pill (status, category, emotion). */
export function Badge({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'lavender' | 'peach' | 'sage' | 'rose' | 'neutral' }) {
  const bg = { primary: 'bg-primary-soft', lavender: 'bg-lavender-soft', peach: 'bg-peach-soft', sage: 'bg-sage-soft', rose: 'bg-rose-soft', neutral: 'bg-sunken' }[tone];
  const fg = { primary: 'text-primary-strong', lavender: 'text-ink-soft', peach: 'text-support-ink', sage: 'text-ink-soft', rose: 'text-ink-soft', neutral: 'text-ink-soft' }[tone];
  return (
    <View className={cn('self-start rounded-full px-3 py-1', bg)}>
      <Text variant="label" className={fg}>
        {label}
      </Text>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row rounded-full bg-sunken p-1.5" accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            className="flex-1">
            <View className={cn('items-center rounded-full py-2.5', active && 'bg-surface')} style={active ? softShadow : undefined}>
              <Text variant="small" className={cn(active ? 'text-ink' : 'text-ink-soft')} style={{ fontWeight: active ? '600' : '400' }}>
                {o.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A round photo when `uri` is given, otherwise soft initials. */
export function Avatar({ name, size = 48, uri }: { name: string; size?: number; uri?: string | null }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={`Photo of ${name}`}
        contentFit="cover"
        transition={250}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  return (
    <View className="items-center justify-center bg-lavender-soft" style={{ width: size, height: size, borderRadius: size / 2 }}>
      <Text variant="bodyStrong" className="text-ink-soft" style={{ fontSize: size * 0.36 }}>
        {initials || '·'}
      </Text>
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="heading">{children}</Text>
      {action}
    </View>
  );
}

/** Soft rounded checkbox with its label; the whole row is tappable. */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      className="flex-row items-start gap-3">
      <View
        className={cn('mt-0.5 h-6 w-6 items-center justify-center rounded-lg border', checked ? 'border-primary bg-primary' : 'border-line bg-surface')}>
        {checked ? <Text variant="small" className="text-primary-ink" style={{ lineHeight: 18 }}>✓</Text> : null}
      </View>
      <Text variant="small" className="flex-1">
        {label}
      </Text>
    </Pressable>
  );
}

export function Divider() {
  return <View className="h-px bg-line" />;
}
