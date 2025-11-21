export default function Layout({ children }: { children: React.ReactNode }) {
  // El layout móvil global ya maneja el header y navbar
  // Este layout solo agrupa las rutas del dashboard
  return <>{children}</>;
}
