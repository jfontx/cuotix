import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton, AppInput, AppRating, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { haptics } from '@/lib/haptics';
import { useCreateRatingMutation } from '@/store/ratingsApi';
import { useAppTheme } from '@/theme';

export default function RateUserScreen() {
  const { toId, groupId, name } = useLocalSearchParams<{ toId: string; groupId: string; name?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [createRating, { isLoading }] = useCreateRatingMutation();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [scoreError, setScoreError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitError(null);
    if (score < 1) {
      setScoreError('Elige de 1 a 5 estrellas');
      return;
    }
    setScoreError(undefined);
    const text = comment.trim();
    const result = await createRating({ groupId, toId, score, comment: text || undefined });
    if (result.error) setSubmitError(getErrorMessage(result.error));
    else {
      haptics.success();
      router.back();
    }
  };

  return (
    <AppScreen scrollable>
      <AppText variant="h2">{name ? `Califica a ${name}` : 'Califica a este usuario'}</AppText>
      <AppText color={colors.textSecondary}>
        Tu calificación ayuda a otros a saber si es confiable. Solo puedes calificar una vez por grupo.
      </AppText>

      <AppRating value={score} onChange={(n) => { setScore(n); setScoreError(undefined); }} size={36} />
      {scoreError ? (
        <AppText color={colors.error} accessibilityRole="alert">
          {scoreError}
        </AppText>
      ) : null}

      <AppInput
        label="Comentario (opcional)"
        value={comment}
        onChangeText={setComment}
        maxLength={300}
        multiline
      />

      {submitError ? (
        <AppText color={colors.error} accessibilityRole="alert">
          {submitError}
        </AppText>
      ) : null}
      <AppButton title="Enviar calificación" loading={isLoading} onPress={onSubmit} />
      <AppButton title="Cancelar" variant="outline" onPress={() => router.back()} />
    </AppScreen>
  );
}
