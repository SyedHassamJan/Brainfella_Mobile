import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { CameraOff, Circle, CircleCheck } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { RiskDisclaimer } from '@/components/screening/RiskDisclaimer';
import { StepProgress } from '@/components/screening/StepProgress';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/controls';
import { IconBubble, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAnalyzeFace } from '@/hooks/screening';
import { getErrorMessage } from '@/lib/errors';
import { useAppTheme } from '@/theme/ThemeProvider';

const STEPS = ['Capturing', 'Sending', 'Analyzing', 'Done'];

export default function CameraScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const analyze = useAnalyzeFace();
  // 0 Capturing, 1 Sending, 2 Analyzing, 3 Done. -1 = not started yet.
  const [step, setStep] = useState(-1);
  const [failedStep, setFailedStep] = useState<{ index: number; message: string } | undefined>();
  const busy = step >= 0 && step < 3;

  const capture = async () => {
    if (busy) return;
    setFailedStep(undefined);
    setStep(0);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.6 });
      if (!photo?.base64) {
        setFailedStep({ index: 0, message: 'The photo could not be captured. Please try again.' });
        return;
      }
      setStep(1); // Sending
      setStep(2); // Analyzing (the same request covers sending + analysis server-side)
      analyze.mutate(photo.base64, {
        onSuccess: () => setStep(3),
        onError: (e) => setFailedStep({ index: 2, message: getErrorMessage(e) }),
      });
    } catch {
      setFailedStep({ index: 0, message: 'The camera had a problem taking that photo. Please try again.' });
    }
  };

  const reset = () => {
    analyze.reset();
    setStep(-1);
    setFailedStep(undefined);
  };

  const result = analyze.data;

  if (result) {
    return (
      <Screen>
        <PageHeader back title="Camera check-in" />
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
            <Card className="gap-3">
              <View className="flex-row flex-wrap gap-2">
                <Badge label={`Expression: ${result.emotion}`} tone="lavender" />
                <Badge label={result.eyeContact ? 'Eye contact detected' : 'Eye contact not detected'} tone="primary" />
              </View>
              <Text variant="small">This is recorded as a signal, not scored on its own — it contributes a small part of your fused risk indicator.</Text>
            </Card>
          </Reveal>
          <Reveal index={2}>
            <Text variant="small" className="text-center">
              Analysis saved. Your photo was not stored, only the result.
            </Text>
          </Reveal>
          <Reveal index={3}>
            <Text variant="small" className="text-center text-primary-strong">
              Saved. This counts toward your next risk indicator for 24 hours.
            </Text>
          </Reveal>
          <Reveal index={4}>
            <View className="gap-3">
              <Button title="Get my risk indicator" onPress={() => router.replace('/screening/results')} />
              <Button title="Take another photo" variant="ghost" onPress={reset} />
            </View>
          </Reveal>
        </View>
      </Screen>
    );
  }

  if (!permission) {
    return (
      <Screen>
        <PageHeader back title="Camera check-in" />
        <LoadingState />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <PageHeader back title="Camera check-in" subtitle="One photo, analyzed once and never saved." />
        <Card className="items-center gap-4 py-8">
          <IconBubble icon={CameraOff} tone="peach" size={56} />
          <Text variant="body" className="text-center">
            BrainHealth needs camera access for a facial-expression check-in.
          </Text>
          {permission.canAskAgain ? (
            <Button title="Allow camera access" variant="soft" onPress={() => requestPermission()} />
          ) : (
            <Button title="Open settings" variant="soft" onPress={() => Linking.openSettings()} />
          )}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View className="gap-5 pb-6">
        <PageHeader back title="Camera check-in" subtitle="Face the camera in good light, then tap to capture." />
        <RiskDisclaimer />
        <View className="overflow-hidden rounded-[26px]" style={{ aspectRatio: 3 / 4 }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
        </View>
        {step >= 0 ? (
          <Card className="gap-4">
            <StepProgress steps={STEPS} current={step} failedAt={failedStep?.index} />
            {step === 1 || step === 2 ? <LoadingState label={step === 1 ? 'Sending your photo…' : 'Looking closely… this can take a little while.'} /> : null}
          </Card>
        ) : (
          <View className="items-center">
            <Pressable accessibilityRole="button" accessibilityLabel="Capture photo" onPress={capture}>
              <View className="h-20 w-20 items-center justify-center rounded-full border-4" style={{ borderColor: colors.primary }}>
                <Circle size={54} color={colors.primary} fill={colors.primary} />
              </View>
            </Pressable>
          </View>
        )}
        {failedStep ? (
          <View className="gap-3">
            <Text variant="small" className="text-center text-support-ink">
              {STEPS[failedStep.index]} failed: {failedStep.message}
            </Text>
            <Button title="Try again" variant="ghost" compact onPress={reset} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
