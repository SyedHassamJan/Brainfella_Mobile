import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { useAppTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

import { Text } from './Text';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  /** Password field with a show/hide toggle. */
  secure?: boolean;
}

/**
 * Text input: a roomy rounded field with a quiet label above and a gentle,
 * warm (not red) message below when something needs attention.
 */
export function TextField({ label, error, hint, secure, multiline, ...rest }: Props) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View className="gap-2">
      {label ? <Text variant="label">{label}</Text> : null}
      <View
        className={cn(
          'flex-row items-center rounded-2xl border bg-surface px-4',
          multiline ? 'min-h-[132px] items-start py-3' : 'min-h-[56px]',
          focused ? 'border-primary' : error ? 'border-support-line' : 'border-line',
        )}>
        <TextInput
          {...rest}
          multiline={multiline}
          secureTextEntry={secure ? hidden : rest.secureTextEntry}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor={colors.inkFaint}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          accessibilityLabel={label}
          style={{
            flex: 1,
            color: colors.ink,
            fontFamily: fonts.body,
            fontSize: 16,
            paddingVertical: multiline ? 0 : 14,
          }}
        />
        {secure ? (
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((h) => !h)}>
            {hidden ? <Eye size={20} color={colors.inkFaint} strokeWidth={1.6} /> : <EyeOff size={20} color={colors.inkFaint} strokeWidth={1.6} />}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="small" className="text-support-ink">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small">{hint}</Text>
      ) : null}
    </View>
  );
}
