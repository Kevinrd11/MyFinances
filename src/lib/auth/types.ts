export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "confirmPassword", string[]>>;
  developmentResetUrl?: string;
};

export const initialAuthState: AuthActionState = {
  status: "idle",
};

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  primaryCurrency: "CRC" | "USD";
};

