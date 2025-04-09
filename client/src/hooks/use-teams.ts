import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { teamsCollection, FirebaseTeam, eventsCollection } from "@/lib/firebase";
import { calculatePercentage } from "@/lib/utils";

export function useTeams() {
  // Fetch all teams
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      // Get teams
      const teamsSnapshot = await teamsCollection.get();
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseTeam[];

      // Get total points for each team from events
      const eventsSnapshot = await eventsCollection.get();
      const events = eventsSnapshot.docs.map(doc => doc.data());

      // Calculate team points
      const teamPoints: Record<string, number> = {};
      events.forEach(event => {
        const teamId = event.teamId;
        if (!teamPoints[teamId]) {
          teamPoints[teamId] = 0;
        }
        teamPoints[teamId] += Number(event.points) || 0;
      });

      // Add points to team objects
      return teamsData.map(team => ({
        ...team,
        points: teamPoints[team.id] || 0
      }));
    }
  });

  // Sorted teams by points (descending)
  const sortedTeams = useMemo(() => {
    if (!teams) return [];
    return [...teams].sort((a, b) => b.points - a.points);
  }, [teams]);

  // Get team progress percentages (against the highest team or a target)
  const teamProgressPercentages = useMemo(() => {
    if (!sortedTeams || sortedTeams.length === 0) return {};
    
    // Either use highest team points as max or set a fixed target (e.g. 400)
    const targetPoints = 400; // Can be changed to any target value
    
    const result: Record<string, number> = {};
    sortedTeams.forEach(team => {
      result[team.id] = calculatePercentage(team.points, targetPoints);
    });
    
    return result;
  }, [sortedTeams]);

  // Get a specific team by ID
  const getTeamById = (id: string) => {
    if (!teams) return null;
    return teams.find(team => team.id === id) || null;
  };

  // Get team position in ranking
  const getTeamPosition = (id: string) => {
    if (!sortedTeams) return 0;
    const index = sortedTeams.findIndex(team => team.id === id);
    return index === -1 ? 0 : index + 1;
  };

  return {
    teams,
    sortedTeams,
    isLoading,
    error,
    teamProgressPercentages,
    getTeamById,
    getTeamPosition
  };
}
