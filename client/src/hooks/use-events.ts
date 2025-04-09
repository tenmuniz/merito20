import { useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { eventsCollection, FirebaseEvent, getServerTimestamp } from "@/lib/firebase";
import { EventType } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useEvents() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Fetch all events
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const snapshot = await eventsCollection.orderBy("createdAt", "desc").get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseEvent[];
    }
  });

  // Add a new event
  const addEvent = useMutation({
    mutationFn: async (eventData: Omit<FirebaseEvent, 'id' | 'createdAt'>) => {
      if (!currentUser) {
        throw new Error("Você precisa estar logado para registrar eventos");
      }
      
      const newEvent = {
        ...eventData,
        createdAt: getServerTimestamp()
      };
      
      const docRef = await eventsCollection.add(newEvent);
      return { id: docRef.id, ...newEvent };
    },
    onSuccess: () => {
      toast({
        title: "Evento registrado",
        description: "O evento foi registrado com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar evento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get events for a specific team
  const getTeamEvents = useCallback((teamId: string) => {
    if (!events) return [];
    return events.filter(event => event.teamId === teamId);
  }, [events]);

  // Get recent events (last 5)
  const recentEvents = useMemo(() => {
    if (!events) return [];
    return events.slice(0, 5);
  }, [events]);

  // Event types for form select
  const eventTypes = useMemo(() => {
    return Object.values(EventType);
  }, []);

  return {
    events,
    recentEvents,
    isLoading,
    error,
    addEvent,
    getTeamEvents,
    eventTypes
  };
}
