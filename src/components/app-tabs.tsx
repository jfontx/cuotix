import { NativeTabs } from 'expo-router/native-tabs';
import { useSelector } from 'react-redux';

import { useListNotificationsQuery } from '@/store/notificationsApi';
import { selectIsAuthenticated } from '@/store/authSlice';
import { useAppTheme } from '@/theme';

export default function AppTabs() {
  const { colors } = useAppTheme();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data } = useListNotificationsQuery(undefined, { skip: !isAuthenticated });
  const unread = data?.unread ?? 0;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.primarySubtle}
      tintColor={colors.primary}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explorar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notifications">
        <NativeTabs.Trigger.Label>Notificaciones</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bell', selected: 'bell.fill' }} md="notifications" />
        <NativeTabs.Trigger.Badge hidden={unread === 0}>{unread > 99 ? '99+' : String(unread)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
