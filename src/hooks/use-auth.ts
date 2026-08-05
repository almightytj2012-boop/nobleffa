import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  email_verified: boolean;
  mc_username: string | null;
};

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me");
  const json = await res.json();
  return json.user ?? null;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 60_000,
  });

  const login = useMutation({
    mutationFn: async (input: { identifier: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Login failed");
      return json.user as AuthUser;
    },
    onSuccess: (user) => queryClient.setQueryData(["auth", "me"], user),
  });

  const register = useMutation({
    mutationFn: async (input: {
      username: string;
      email: string;
      password: string;
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Registration failed");
      return json.user as AuthUser;
    },
    onSuccess: (user) => queryClient.setQueryData(["auth", "me"], user),
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => queryClient.setQueryData(["auth", "me"], null),
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    login,
    register,
    logout,
  };
}
