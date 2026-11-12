import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { GroupCard } from '@/components/group-card';
import { AppButton, AppList, AppScreen, AppText } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import type { AppDispatch } from '@/store';
import { spacing } from '@/theme/spacing';
import { logout } from '@/store/auth-actions';
import { selectCurrentUser } from '@/store/authSlice';
import { useListGroupsQuery } from '@/store/groupsApi';

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, isFetching, error, refetch } = useListGroupsQuery({ mine: true, limit: 100 });

  return (
    <AppScreen
      title={user ? `Hola, ${user.name}` : 'Mis grupos'}
      loading={isLoading}
      error={error ? getErrorMessage(error) : undefined}
      onRetry={refetch}>
      <AppText variant="h2">Mis grupos</AppText>
      <AppList
        data={data?.data ?? []}
        keyExtractor={(g) => g.id}
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={({ item }) => <GroupCard group={item} onPress={() => router.push(`/groups/${item.id}`)} />}
        empty={{
          title: 'Aún no estás en ningún grupo',
          message: 'Crea uno o explora los grupos disponibles para unirte.',
          icon: 'info',
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <AppButton title="Crear grupo" onPress={() => router.push('/groups/create')} />
            <AppButton title="Mis cuotas" variant="outline" onPress={() => router.push('/payments')} />
            <AppButton title="Cerrar sesión" variant="ghost" onPress={() => dispatch(logout())} />
          </View>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({ footer: { gap: spacing.sm, marginTop: spacing.sm } });
