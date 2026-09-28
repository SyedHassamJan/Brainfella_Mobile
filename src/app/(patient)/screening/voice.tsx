import { useRouter } from 'expo-router';
import { File } from 'expo-file-system';
import { CircleCheck, Mic, MicOff, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { RiskDisclaimer } from '@/components/screening/RiskDisclaimer';
import { StepProgress } from '@/components/screening/StepProgress';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBubble, LoadingState, SupportBanner } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAnalyzeVoice } from '@/hooks/screening';
import { getErrorMessage } from '@/lib/errors';
import { useAppTheme } from '@/theme/ThemeProvider';

const MAX_SECONDS = 60;
const STEPS = ['Recording', 'Sending', 'Transcribing', 'Done'];

export default function VoiceScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [starting, setStarting] = useState(false);
  // 0 Recording, 1 Sending, 2 Transcribing, 3 Done. -1 = not started yet.
  const [step, setStep] = useState(-1);
  const [failedStep, setFailedStep] = useState<{ index: number; message: string } | undefined>();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 200);
  const analyze = useAnalyzeVoice();
  const stopping = useRef(false);

  const checkPermission = async () => {
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      const res = await requestRecordingPermissionsAsync();
      setPermission(res.granted ? 'granted' : 'denied');
    } catch {
      // Can't tell granted from denied here, but "denied" shows the same recoverable path (open settings / try again).
      setPermission('denied');
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  const seconds = Math.floor(state.durationMillis / 1000);

  const startRecording = async () => {
    if (starting || state.isRecording) return;
    setFailedStep(undefined);
    setStarting(true);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStep(0);
    } catch {
      setFailedStep({ index: 0, message: "Recording couldn't start. Please try again." });
    } finally {
      setStarting(false);
    }
  };

  const stopAndAnalyze = async () => {
    if (stopping.current || !state.isRecording) return;
    stopping.current = true;
    setStep(1); // Sending
    try {
      await recorder.stop();
      if (!recorder.uri) {
        setFailedStep({ index: 1, message: "That recording didn't save properly. Please try again." });
        return;
      }
      const base64 = await new File(recorder.uri).base64();
      setStep(2); // Transcribing
      analyze.mutate(
        { audio: base64 },
        {
          onSuccess: () => setStep(3),
          onError: (e) => setFailedStep({ index: 2, message: getErrorMessage(e) }),
        },
      );
    } catch {
      setFailedStep({ index: 1, message: 'Something went wrong sending that recording. Please try again.' });
    } finally {
      stopping.current = false;
    }
  };

  useEffect(() => {
    if (state.isRecording && seconds >= MAX_SECONDS) stopAndAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, state.isRecording]);

  const reset = () => {
    analyze.reset();
    setStep(-1);
    setFailedStep(undefined);
  };

  const result = analyze.data;

  if (result) {
    return (
      <Screen>
        <PageHeader back title="Voice check-in" />
        <View className="gap-6 pt-2">
          <Reveal index={0}>
            <View className="items-center gap-3">
              <IconBubble icon={CircleCheck} tone="sage" size={64} />
              <Text variant="heading" className="text-center">
                Analyzed
              </Text>
            </View>
          </Reveal>
          <Reveal index={1}>
            <Card className="gap-2">
              <Text variant="label">HERE&apos;S WHAT I HEARD</Text>
              <Text variant="small">&ldquo;{result.transcript}&rdquo;</Text>
            </Card>
          </Reveal>
          {result.textAnalysis.crisisFlag ? (
            <Reveal index={2}>
              <SupportBanner message={result.textAnalysis.crisisSupport} />
            </Reveal>
          ) : null}
          <Reveal index={3}>
            <Text variant="small" className="text-center">
              Analysis saved. Your audio was not stored, only the result.
            </Text>
          </Reveal>
          <Reveal index={4}>
            <Text variant="small" className="text-center text-primary-strong">
              Saved. This counts toward your next risk indicator for 24 hours.
            </Text>
          </Reveal>
          <Reveal index={5}>
            <View className="gap-3">
              <Button title="Get my risk indicator" onPress={() => router.replace('/screening/results')} />
              <Button title="Record again" variant="ghost" onPress={reset} />
            </View>
          </Reveal>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader back title="Voice check-in" subtitle="A short recording, up to a minute. It's analyzed once and never saved." />
      <RiskDisclaimer />

      {permission === 'unknown' ? <LoadingState label="Checking microphone access…" /> : null}

      {permission === 'denied' ? (
        <Card className="items-center gap-4 py-8">
          <IconBubble icon={MicOff} tone="peach" size={56} />
          <Text variant="body" className="text-center">
            BrainHealth needs microphone access for a voice check-in. You can turn it on in your phone&apos;s settings.
          </Text>
          <Button title="Open settings" variant="soft" onPress={() => Linking.openSettings()} />
          <Button title="I've allowed it — check again" variant="ghost" compact onPress={checkPermission} />
        </Card>
      ) : null}

      {permission === 'granted' && step >= 1 ? (
        <Card className="gap-4">
          <StepProgress steps={STEPS} current={step} failedAt={failedStep?.index} />
          {step === 1 || step === 2 ? <LoadingState label={step === 1 ? 'Sending your recording…' : 'Transcribing… this can take up to a minute.'} /> : null}
        </Card>
      ) : null}

      {permission === 'granted' && starting ? <LoadingState label="Getting the microphone ready…" /> : null}

      {permission === 'granted' && !starting && step <= 0 ? (
        <View className="items-center gap-5 py-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={state.isRecording ? 'Stop recording' : 'Start recording'}
            onPress={() => (state.isRecording ? stopAndAnalyze() : startRecording())}>
            <View
              className="h-28 w-28 items-center justify-center rounded-full"
              style={{ backgroundColor: state.isRecording ? colors.roseSoft : colors.primarySoft }}>
              {state.isRecording ? <Square size={34} color={colors.rose} fill={colors.rose} /> : <Mic size={38} color={colors.primaryStrong} strokeWidth={1.7} />}
            </View>
          </Pressable>
          <Text variant="small">{state.isRecording ? `Recording… ${seconds}s / ${MAX_SECONDS}s` : 'Tap to start recording'}</Text>
          {state.isRecording ? <Button title="Stop recording" variant="soft" compact onPress={stopAndAnalyze} /> : null}
        </View>
      ) : null}

      {failedStep ? (
        <View className="gap-3">
          <Text variant="small" className="text-center text-support-ink">
            {STEPS[failedStep.index]} failed: {failedStep.message}
          </Text>
          <Button title="Try again" variant="ghost" compact onPress={reset} />
        </View>
      ) : null}
    </Screen>
  );
}
