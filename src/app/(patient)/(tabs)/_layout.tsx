import { Tabs } from 'expo-router';
import { Activity, BookOpen, HeartHandshake, House, MessageCircle, User } from 'lucide-react-native';

import { useUnreadCount } from '@/hooks/notifications';
import { useAppTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

/**
 * A floating, softly rounded tab bar (a pill that hovers above the content)
 * with thin-stroke icons. Quiet on purpose: no heavy bar, no hard divider.
 */
export default function TabsLayout() {
  const { colors } = useAppTheme();
  const unread = useUnreadCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontFamily: fonts.bodySemibold, fontSize: 11, marginTop: -2 },
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 18,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 34,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
          shadowColor: '#2b4a45',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 24,
          elevation: 8,
        },
        // The selected tab rests in a soft pill, so where you are is clear at a glance.
        tabBarItemStyle: { borderRadius: 26, marginHorizontal: 3, marginVertical: 1 },
        tabBarActiveBackgroundColor: colors.primarySoft,
        sceneStyle: { backgroundColor: colors.canvas },
      }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <House size={22} color={color} strokeWidth={1.7} /> }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: 'Journal', tabBarIcon: ({ color }) => <BookOpen size={22} color={color} strokeWidth={1.7} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} strokeWidth={1.7} /> }}
      />
      <Tabs.Screen
        name="care"
        options={{ title: 'Care', tabBarIcon: ({ color }) => <HeartHandshake size={22} color={color} strokeWidth={1.7} /> }}
      />
      <Tabs.Screen
        name="screening"
        options={{ title: 'Screening', tabBarIcon: ({ color }) => <Activity size={22} color={color} strokeWidth={1.7} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={1.7} />,
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.peach, color: colors.supportInk, fontFamily: fonts.bodySemibold, fontSize: 10 },
        }}
      />
    </Tabs>
  );
}
