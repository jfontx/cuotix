import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppAvatar, AppButton, AppCard, AppDivider, AppEmptyState, AppRating, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { useGetUserRatingsQuery, type RatingEntry } from '@/store/ratingsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';

const formatAverage = (n: number) => n.toFixed(1).replace('.', ',');

function RatingItem({ rating }: { rating: RatingEntry }) {
  const { colors } = useAppTheme();
  const label = [
    `${rating.from.name} dio ${rating.score} de 5 estrellas en ${rating.group.title}`,
    rating.comment,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <AppCard variant="outlined" accessibilityLabel={label}>
      <AppRating value={rating.score} readonly size={20} />
      {rating.comment ? <AppText>{rating.comment}</AppText> : null}
      <AppText variant="bodySmall" color={colors.textSecondary}>
        {rating.from.name} · {rating.group.title}
      </AppText>
    </AppCard>
  );
}

/** Perfil público de un usuario con su reputación. `groupId` (opcional) habilita calificar y reportar en ese grupo. */
export default function UserProfileScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data, isLoading, error, refetch } = useGetUserRatingsQuery(id);

  const name = data?.user.name ?? '';
  const params = { toId: id, groupId: groupId ?? '', name };

  return (
    <AppScreen scrollable loading={isLoading} error={error ? getErrorMessage(error) : undefined} onRetry={refetch}>
      {data ? (
        <>
          <View style={styles.header}>
            <AppAvatar name={name} size={64} />
            <AppText variant="h1">{name}</AppText>
          </View>

          <AppCard
            variant="filled"
            accessibilityLabel={
              data.average === null
                ? `${name} aún no tiene calificaciones`
                : `Calificación promedio ${formatAverage(data.average)} de 5, con ${data.count} ${data.count === 1 ? 'calificación' : 'calificaciones'}`
            }>
            {data.average === null ? (
              <AppText>Aún no tiene calificaciones</AppText>
            ) : (
              <>
                <AppText variant="h2">{formatAverage(data.average)} de 5</AppText>
                <AppRating value={data.average} readonly />
                <AppText color={colors.textSecondary}>
                  {data.count} {data.count === 1 ? 'calificación' : 'calificaciones'}
                </AppText>
              </>
            )}
          </AppCard>

          {groupId ? (
            <View style={styles.actions}>
              <AppButton
                title="Calificar"
                accessibilityHint={`Abre la pantalla para calificar a ${name}`}
                onPress={() => router.push({ pathname: '/ratings/create', params })}
              />
              <AppButton
                title="Reportar usuario"
                variant="ghost"
                accessibilityHint={`Abre la pantalla para reportar a ${name}`}
                onPress={() => router.push({ pathname: '/reports/create', params: { reportedId: id, groupId, name } })}
              />
            </View>
          ) : null}

          <AppDivider />
          <AppText variant="h3">Calificaciones recibidas</AppText>
          {data.data.length === 0 ? (
            <AppEmptyState title="Sin calificaciones" message="Cuando otros usuarios lo califiquen, las verás aquí." icon="info" />
          ) : (
            data.data.map((r) => <RatingItem key={r.id} rating={r} />)
          )}
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm },
  actions: { gap: spacing.sm },
});
