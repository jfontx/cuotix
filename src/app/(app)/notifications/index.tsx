import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppList, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { formatDueDate } from '@/lib/payments';
import { routeForNotification } from '@/lib/push';
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type AppNotification,
} from '@/store/notificationsApi';
import { useAppTheme } from '@/theme';
import { spacing } from '@/theme/spacing';


function NotificationCard({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const { colors } = useAppTheme();
  const when = formatDueDate(item.sentAt);
  return (
    <AppCard
      variant={item.read ? 'outlined' : 'filled'}
      onPress={onPress}
      accessibilityLabel={`${item.read ? '' : 'No leída. '}${item.title}. ${item.body}. ${when}.`}
      accessibilityHint="Marca como leída y abre el detalle">
      <View style={styles.info}>
        <AppText style={item.read ? undefined : styles.unread}>{item.title}</AppText>
        <AppText variant="bodySmall">{item.body}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {when}
        </AppText>
      </View>
    </AppCard>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, isFetching, error, refetch } = useListNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const open = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    const route = routeForNotification(n);
    if (route) router.push(route);
  };

  return (
    <AppScreen loading={isLoading} error={error ? getErrorMessage(error) : undefined} onRetry={refetch}>
      <AppList
        data={data?.data ?? []}
        keyExtractor={(n) => n.id}
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={({ item }) => <NotificationCard item={item} onPress={() => open(item)} />}
        ListHeaderComponent={
          <>
            {data && data.unread > 0 ? (
              <AppButton title={`Marcar todas como leídas (${data.unread})`} variant="outline" loading={markingAll} onPress={() => markAll()} />
            ) : null}
          </>
        }
        empty={{
          title: 'No tienes notificaciones',
          message: 'Aquí verás recordatorios de pago y novedades de tus grupos.',
          icon: 'info',
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({ info: { gap: spacing.xs }, unread: { fontWeight: '700' } });
