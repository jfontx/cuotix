// Reanimated no se puede cargar en el entorno de Jest; se mockea el componente que lo usa.
jest.mock('@/components/animated-icon', () => ({
  AnimatedIcon: () => null,
  AnimatedSplashOverlay: () => null,
}));
