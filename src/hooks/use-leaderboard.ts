import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard } from "@/lib/noble-data";

export function useLeaderboard() {
  const query = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 60_000, // stays fresh alongside the 5-min server sync
  });

  return {
    players: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
