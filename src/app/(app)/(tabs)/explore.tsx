import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GroupCard } from '@/components/group-card';
import { AppButton, AppChip, AppInput, AppList, AppScreen } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-error';
import { useListGroupsQuery, useListServicesQuery } from '@/store/groupsApi';
import { spacing } from '@/theme/spacing';

const PAGE_SIZE = 20;
const MAX_LIMIT = 100;

export default function ExploreScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [serviceId, setServiceId] = useState<string>();
  const [pages, setPages] = useState(1);

  // Se espera a que el usuario deje de escribir antes de consultar
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(text.trim());
      setPages(1);
    }, 400);
    return () => clearTimeout(t);
  }, [text]);

  const selectService = (id?: string) => {
    setServiceId(id);
    setPages(1);
  };

  const { data: services } = useListServicesQuery();
  const limit = Math.min(pages * PAGE_SIZE, MAX_LIMIT);
  const { data, isLoading, isFetching, error, refetch } = useListGroupsQuery({
    excludeMine: true,
    serviceId,
    search: search || undefined,
    limit,
  });
  const hasMore = !!data && data.pagination.total > data.data.length && limit < MAX_LIMIT;

  return (
    <AppScreen title="Explorar" loading={isLoading && !data} error={error && !data ? getErrorMessage(error) : undefined} onRetry={refetch}>
      <AppInput
        label="Buscar grupos"
        value={text}
        onChangeText={setText}
        placeholder="Nombre o descripción"
        returnKeyType="search"
        autoCapitalize="none"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityRole="toolbar">
        <AppChip label="Todos" width={CHIP_WIDTH} selected={!serviceId} onPress={() => selectService(undefined)} />
        {services?.data.map((s) => (
          <AppChip
            key={s.id}
            label={s.name}
            width={CHIP_WIDTH}
            selected={serviceId === s.id}
            onPress={() => selectService(serviceId === s.id ? undefined : s.id)}
            accessibilityHint="Filtra los grupos por este servicio"
          />
        ))}
      </ScrollView>
      <AppList
        data={data?.data ?? []}
        keyExtractor={(g) => g.id}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        renderItem={({ item }) => <GroupCard group={item} onPress={() => router.push(`/groups/${item.id}`)} />}
        empty={{
          title: 'No encontramos grupos',
          message: 'Prueba con otra búsqueda o quita los filtros.',
          icon: 'info',
        }}
        ListFooterComponent={
          hasMore ? (
            <View>
              <AppButton title="Ver más grupos" variant="outline" loading={isFetching} onPress={() => setPages((p) => p + 1)} />
            </View>
          ) : undefined
        }
      />
    </AppScreen>
  );
}

/** Todos los filtros miden lo mismo, sin importar la longitud del nombre del servicio */
const CHIP_WIDTH = 140;

const styles = StyleSheet.create({ chips: { gap: spacing.sm, paddingVertical: spacing.xs } });
