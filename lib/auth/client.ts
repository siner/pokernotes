'use client';

import { createAuthClient } from 'better-auth/react';

// No baseURL: Better Auth uses the current origin in the browser.
// For server-side calls, NEXT_PUBLIC_APP_URL is used at build time.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession, sendVerificationEmail } = authClient;
