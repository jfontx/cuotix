import { useRouter } from 'expo-router';

import { PaymentCard } from '@/components/payment-card';
import { AppList, AppScreen } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { useListMyPaymentsQuery } from '@/store/paymentsApi';

export default function MyPaymentsScreen() {
  const router = useRouter();
  const { data, isLoading, isFetching, error, refetch } = useListMyPaymentsQuery();

  return (
    <AppScreen loading={isLoading} error={error ? getErrorMessage(error) : undefined} onRetry={refetch}>
      <AppList
        data={data?.data ?? []}
        keyExtractor={(p) => p.id}
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={({ item }) => <PaymentCard payment={item} onPress={() => router.push(`/payments/${item.id}`)} />}
        empty={{
          title: 'Aún no tienes cuotas',
          message: 'Cuando confirmes tu acceso a un grupo, tu primera cuota aparecerá aquí.',
          icon: 'info',
        }}
      />
    </AppScreen>
  );
}
