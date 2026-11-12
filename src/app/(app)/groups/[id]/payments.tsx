import { useLocalSearchParams, useRouter } from 'expo-router';

import { PaymentCard } from '@/components/payment-card';
import { AppList, AppScreen } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { useGetGroupQuery } from '@/store/groupsApi';
import { useListGroupPaymentsQuery, useListMyPaymentsQuery } from '@/store/paymentsApi';

/** El administrador ve las cuotas de todos los miembros; un miembro, las suyas en este grupo. */
export default function GroupPaymentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const group = useGetGroupQuery(id);
  const isOwner = !!group.data?.group.isOwner;
  const groupReady = !!group.data;

  const all = useListGroupPaymentsQuery(id, { skip: !isOwner });
  const mine = useListMyPaymentsQuery(undefined, { skip: !groupReady || isOwner });
  const active = isOwner ? all : mine;

  const payments = (active.data?.data ?? []).filter((p) => isOwner || p.group.id === id);
  const error = group.error ?? active.error;

  return (
    <AppScreen
      loading={group.isLoading || active.isLoading}
      error={error ? getErrorMessage(error) : undefined}
      onRetry={() => {
        group.refetch();
        active.refetch();
      }}>
      <AppList
        data={payments}
        keyExtractor={(p) => p.id}
        refreshing={active.isFetching}
        onRefresh={active.refetch}
        renderItem={({ item }) => (
          <PaymentCard payment={item} showMember={isOwner} onPress={() => router.push(`/payments/${item.id}`)} />
        )}
        empty={{
          title: 'Aún no hay cuotas',
          message: isOwner
            ? 'Las cuotas aparecen cuando un miembro confirma su acceso.'
            : 'Tu primera cuota aparece cuando confirmas tu acceso al servicio.',
          icon: 'info',
        }}
      />
    </AppScreen>
  );
}
