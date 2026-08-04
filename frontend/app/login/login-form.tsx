"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { login, type LoginState } from "@/lib/actions/session";

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state.error} />
      <FormField label="Email" name="email" type="email" required />
      <FormField label="Password" name="password" type="password" required />
      <SubmitButton>Accedi</SubmitButton>
    </form>
  );
}
