import { Text as RNText, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';
import { fonts } from '@/theme/tokens';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'small' | 'label';

/**
 * Typography. Soft serif (Fraunces) for greetings and titles, rounded sans
 * (Nunito) for everything else. Generous line-height: text should breathe.
 * Each variant carries its own color class because text color is not
 * inherited from a parent View in React Native.
 */
const variants: Record<TextVariant, { className: string; fontFamily: string }> = {
  display: { className: 'text-[34px] leading-[42px] text-ink', fontFamily: fonts.heading },
  title: { className: 'text-[26px] leading-[34px] text-ink', fontFamily: fonts.heading },
  heading: { className: 'text-[19px] leading-[26px] text-ink', fontFamily: fonts.bodySemibold },
  body: { className: 'text-[16px] leading-[25px] text-ink', fontFamily: fonts.body },
  bodyStrong: { className: 'text-[16px] leading-[25px] text-ink', fontFamily: fonts.bodySemibold },
  small: { className: 'text-[14px] leading-[21px] text-ink-soft', fontFamily: fonts.body },
  label: { className: 'text-[13px] leading-[18px] tracking-wide text-ink-soft', fontFamily: fonts.bodySemibold },
};

interface Props extends TextProps {
  variant?: TextVariant;
  className?: string;
}

export function Text({ variant = 'body', className, style, ...rest }: Props) {
  const v = variants[variant];
  return <RNText className={cn(v.className, className)} style={[{ fontFamily: v.fontFamily }, style]} {...rest} />;
}
