// Config de autenticación simplificada: ya no se usa whitelist, 2FA ni flags.
// Archivo dejado por compatibilidad si otros imports existen; exporta helpers vacíos si alguien los llama.

export const isEmailAdmin = (_email?: string | null) => true; // ahora cualquier usuario autenticado es "admin" a efectos de UI

