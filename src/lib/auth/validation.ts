import { z } from "zod";

const password = z
  .string()
  .min(10, "Use al menos 10 caracteres.")
  .max(128, "La contraseña es demasiado larga.")
  .regex(/[a-z]/, "Incluya una letra minúscula.")
  .regex(/[A-Z]/, "Incluya una letra mayúscula.")
  .regex(/[0-9]/, "Incluya un número.");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingrese un correo válido."),
  password: z.string().min(1, "Ingrese su contraseña.").max(128),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Ingrese su nombre.").max(80),
    email: z.string().trim().toLowerCase().email("Ingrese un correo válido."),
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const recoverySchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingrese un correo válido."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32),
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

