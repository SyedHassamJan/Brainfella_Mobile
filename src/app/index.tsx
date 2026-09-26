import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/auth';

/** Entry point: signed-out people go to sign-in; everyone signed in is a patient and goes Home. */
export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? '/home' : '/sign-in'} />;
}
