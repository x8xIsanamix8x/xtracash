const protectedRoutes = [
  "/home",
  "/movements",
  "/mobile-payment",
  "/profile",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
