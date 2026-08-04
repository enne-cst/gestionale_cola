import { logout } from "@/lib/actions/session";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">
        Esci
      </Button>
    </form>
  );
}
