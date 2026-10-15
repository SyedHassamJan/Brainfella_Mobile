import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Compass, HeartHandshake, LogOut, Phone, UserPen, Users } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Alert, Linking, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar, Divider } from '@/components/ui/controls';
import { IconBubble } from '@/components/ui/feedback';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth, useSignOut } from '@/hooks/auth';
import { useUnreadCount } from '@/hooks/notifications';
import { useProfile } from '@/hooks/profile';
import { HELPLINE } from '@/lib/config';
import { useAppTheme } from '@/theme/ThemeProvider';
import { useTour } from '@/tour/TourProvider';
import { TourTarget } from '@/tour/TourTarget';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function Row({ icon, label, detail, onPress, tone = 'primary' }: { icon: IconType; label: string; detail?: string; onPress: () => void; tone?: 'primary' | 'lavender' | 'peach' }) {
  const { colors } = useAppTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={label} className="flex-row items-center gap-4 py-4">
      <IconBubble icon={icon} tone={tone} />
      <View className="flex-1 gap-0.5">
        <Text variant="bodyStrong">{label}</Text>
        {detail ? <Text variant="small">{detail}</Text> : null}
      </View>
      <ChevronRight size={20} color={colors.inkFaint} strokeWidth={1.6} />
    </Card>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const tour = useTour();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const profile = useProfile();
  const unread = useUnreadCount();
  const signOut = useSignOut();

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Sign out', onPress: () => signOut.mutate() },
    ]);

  const guardian = profile.data?.guardianLink;

  return (
    <Screen tabBarSpace>
      <Reveal index={0}>
        <View className="items-center gap-3 pt-2">
          <Avatar name={user?.name ?? ''} size={84} />
          <View className="items-center gap-1">
            <Text variant="title">{user?.name}</Text>
            {profile.data?.email ? <Text variant="small">{profile.data.email}</Text> : null}
          </View>
        </View>
      </Reveal>

      <Reveal index={1}>
        <TourTarget id="profile.settings">
        <View className="gap-3">
          <Row icon={UserPen} label="Your details" detail="Name, phone and a little about you" onPress={() => router.push('/profile-edit')} />
          <Row icon={Users} tone="lavender" label="Guardian" detail={guardian ? `Weekly summary goes to ${guardian.guardianName || guardian.guardianEmail}` : 'Someone you trust who can receive a weekly summary'} onPress={() => router.push('/guardian')} />
          <Row icon={Bell} tone="peach" label="Notifications" detail={unread > 0 ? `${unread} new` : 'You are all caught up'} onPress={() => router.push('/notifications')} />
        </View>
        </TourTarget>
      </Reveal>

      <Reveal index={2}>
        <TourTarget id="profile.help">
        <Card tone="support" className="gap-3">
          <View className="flex-row items-center gap-3">
            <IconBubble icon={HeartHandshake} tone="peach" />
            <Text variant="heading" className="flex-1 text-support-ink">Need someone to talk to?</Text>
          </View>
          <Text variant="small" className="text-support-ink">
            The {HELPLINE.name} helpline is there to listen.
          </Text>
          <Button
            title={`Call ${HELPLINE.number}`}
            variant="support"
            icon={<Phone size={17} color={colors.supportInk} strokeWidth={1.8} />}
            onPress={() => Linking.openURL(`tel:${HELPLINE.number.replace(/\D/g, '')}`)}
          />
        </Card>
        </TourTarget>
      </Reveal>

      <Reveal index={3}>
        <View className="gap-4">
          <Row icon={Compass} tone="lavender" label="Replay the guided tour" detail="A short walk through the app" onPress={tour.restart} />
          <Divider />
          <Button title="Sign out" variant="ghost" loading={signOut.isPending} onPress={confirmSignOut} icon={<LogOut size={18} color={colors.inkSoft} strokeWidth={1.7} />} />
          <Text variant="small" className="text-center">
            BrainHealth {Constants.expoConfig?.version ?? ''}
          </Text>
        </View>
      </Reveal>
    </Screen>
  );
}
