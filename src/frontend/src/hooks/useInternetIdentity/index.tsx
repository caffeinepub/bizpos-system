import type { Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface InternetIdentityContextType {
  login: () => Promise<void>;
  clear: () => Promise<void>;
  identity: Identity | null;
  isLoggingIn: boolean;
}

const InternetIdentityContext = createContext<
  InternetIdentityContextType | undefined
>(undefined);

export function InternetIdentityProvider({
  children,
}: { children: ReactNode }) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      const isAuthenticated = await client.isAuthenticated();
      if (isAuthenticated) {
        setIdentity(client.getIdentity());
      }
    });
  }, []);

  const login = async () => {
    if (!authClient) return;

    setIsLoggingIn(true);
    try {
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider:
            process.env.DFX_NETWORK === "ic"
              ? "https://identity.ic0.app"
              : `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`,
          onSuccess: () => {
            setIdentity(authClient.getIdentity());
            resolve();
          },
          onError: reject,
        });
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const clear = async () => {
    if (!authClient) return;
    await authClient.logout();
    setIdentity(null);
  };

  return (
    <InternetIdentityContext.Provider
      value={{ login, clear, identity, isLoggingIn }}
    >
      {children}
    </InternetIdentityContext.Provider>
  );
}

export function useInternetIdentity() {
  const context = useContext(InternetIdentityContext);
  if (!context) {
    throw new Error(
      "useInternetIdentity must be used within InternetIdentityProvider",
    );
  }
  return context;
}
