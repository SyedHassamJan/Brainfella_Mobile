import { MessageCircle } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { useRecordContact } from '@/hooks/care';
import { openWhatsapp } from '@/lib/whatsapp';
import { useAppTheme } from '@/theme/ThemeProvider';

/**
 * "Chat on WhatsApp" with the therapist; renders nothing if they have no number.
 * The tap is also recorded so the therapist knows who reached out (name only:
 * it does not share any records). Recording never delays opening the chat.
 */
export function WhatsappButton({
  number,
  name,
  profileId,
  compact,
}: {
  number?: string | null;
  name: string;
  profileId: string;
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  const record = useRecordContact();
  if (!number) return null;
  return (
    <Button
      title="Chat on WhatsApp"
      variant="soft"
      compact={compact}
      accessibilityHint={`Opens a WhatsApp chat with ${name}`}
      icon={<MessageCircle size={17} color={colors.primary} strokeWidth={1.8} />}
      onPress={() => {
        record.mutate(profileId);
        openWhatsapp(number, name);
      }}
    />
  );
}
