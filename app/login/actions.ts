"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function googleSignInAction(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");
  await signIn("google", { redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/dashboard" });
}

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email hoặc mật khẩu không đúng" };
    }
    throw error;
  }
}
