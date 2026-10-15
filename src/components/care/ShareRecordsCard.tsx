import { ShieldCheck } from 'lucide-react-native';
import { Switch, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconBubble } from '@/components/ui/feedback';
import { Text } from '@/components/ui/Text';
import { useMyConnections, useSetSharing } from '@/hooks/care';
import { getErrorMessage } from '@/lib/errors';
import { useAppTheme } from '@/theme/ThemeProvider';

/**
 * The patient's own choice to let this therapist read their journal, check-ins
 * and screening results. Off by default, explained plainly, and reversible at
 * any time. A WhatsApp message alone never shares anything.
 */
export function ShareRecordsCard({ profileId, name }: { profileId: string; name: string }) {
  const { colors } = useAppTheme();
  const connections = useMyConnections();
  const setSharing = useSetSharing(profileId);
  const current = connections.data?.find((c) => c.therapistProfileId === profileId);
  // Show the requested state while saving, so the switch does not jump back.
  const sharing = setSharing.isPending ? !!setSharing.variables : !!current?.sharedAt;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <IconBubble icon={ShieldCheck} tone="lavender" size={40} />
        <Text variant="heading" className="flex-1">
          Share my records
        </Text>
        <Switch
          value={sharing}
          disabled={connections.isLoading || setSharing.isPending}
          onValueChange={(v) => setSharing.mutate(v)}
          trackColor={{ false: colors.line, true: colors.primary }}
          accessibilityLabel={`Share my records with ${name}`}
        />
      </View>
      <Text variant="small">
        {sharing
          ? `${name} can read your journal, check-ins and screening results to support you. You can turn this off at any time.`
          : `Off. ${name} cannot see your journal, check-ins or screening results. Messaging on WhatsApp does not share them either.`}
      </Text>
      {setSharing.isError ? (
        <Text variant="small" className="text-support-ink">
          {getErrorMessage(setSharing.error)}
        </Text>
      ) : null}
    </Card>
  );
}
