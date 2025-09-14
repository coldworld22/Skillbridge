import useAdminGuard from "./useAdminGuard";

/**
 * Higher-order component that renders the wrapped component only
 * if the current user is an admin or superadmin. Unauthorized users
 * are redirected inside the `useAdminGuard` hook.
 */
export default function withAdminGuard(Component) {
  return function AdminProtected(props) {
    const ok = useAdminGuard();
    if (!ok) return null;
    return <Component {...props} />;
  };
}

