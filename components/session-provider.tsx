"use client";

import { SessionProvider as NextAuthSessionProvider, signOut } from "next-auth/react";
import { ReactNode, useEffect } from "react";

// Global fetch interceptor to handle 401 responses
function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    // If we get a 401 on an API request, sign out and redirect to login
    if (response.status === 401) {
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);

      // Only handle our API routes, not external requests
      if (url.includes("/api/") && !url.includes("/api/auth/")) {
        console.log("Unauthorized API response, signing out...");
        signOut({ callbackUrl: "/login" });
      }
    }

    return response;
  };
}

function FetchInterceptor({ children }: { children: ReactNode }) {
  useEffect(() => {
    setupFetchInterceptor();
  }, []);

  return <>{children}</>;
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <FetchInterceptor>{children}</FetchInterceptor>
    </NextAuthSessionProvider>
  );
}
