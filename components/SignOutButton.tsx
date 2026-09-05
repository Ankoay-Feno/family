"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "./I18nProvider";

export default function SignOutButton() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-link"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      {t.nav.signOut}
    </button>
  );
}
