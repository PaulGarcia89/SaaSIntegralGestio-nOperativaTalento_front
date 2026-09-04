type AllowedRoute = { href: string; label: string; group: string };

export function TaskNavigation({ routes, pathname, role, onSearch }: { routes: AllowedRoute[]; pathname: string; role: string; onSearch: () => void }) {
  void routes;
  void pathname;
  void role;
  void onSearch;
  return null;
}
