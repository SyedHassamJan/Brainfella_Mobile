import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ExercisesList } from '@/components/care/ExercisesList';
import { SessionsList } from '@/components/care/SessionsList';
import { TherapistsList } from '@/components/care/TherapistsList';
import { SegmentedControl } from '@/components/ui/controls';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { TourTarget } from '@/tour/TourTarget';

type Segment = 'sessions' | 'therapists' | 'exercises';
const isSegment = (v: unknown): v is Segment => v === 'sessions' || v === 'therapists' || v === 'exercises';

export default function CareScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [segment, setSegment] = useState<Segment>(isSegment(tab) ? tab : 'sessions');

  // Other screens can deep-link here with ?tab=exercises etc.
  useEffect(() => {
    if (isSegment(tab)) setSegment(tab);
  }, [tab]);

  return (
    <Screen tabBarSpace>
      <PageHeader title="Care" subtitle="Support from people and practices that help." />
      <TourTarget id="care.segments">
        <SegmentedControl<Segment>
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'sessions', label: 'Sessions' },
            { value: 'therapists', label: 'Therapists' },
            { value: 'exercises', label: 'Exercises' },
          ]}
        />
      </TourTarget>
      <TourTarget id="care.content">
        {segment === 'sessions' ? <SessionsList onFindTherapist={() => setSegment('therapists')} /> : null}
        {segment === 'therapists' ? <TherapistsList /> : null}
        {segment === 'exercises' ? <ExercisesList /> : null}
      </TourTarget>
    </Screen>
  );
}
