import { useState } from "react";
import { FirebaseEvent } from "@/lib/firebase";
import { getTeamColorClass, formatDate } from "@/lib/utils";
import { EventDetailModal } from "./event-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { eventsCollection } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface EventsTableProps {
  events: FirebaseEvent[];
  isLoading: boolean;
  limit?: number;
  isAdmin?: boolean;
}

export function EventsTable({ events, isLoading, limit, isAdmin = false }: EventsTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<FirebaseEvent | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  
  const displayEvents = limit ? events.slice(0, limit) : events;
  
  const handleEventClick = (event: FirebaseEvent) => {
    setSelectedEvent(event);
  };
  
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await eventsCollection.doc(selectedEvent.id).delete();
      
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso",
        variant: "default"
      });
      
      // Close dialogs
      setShowDeleteDialog(false);
      setSelectedEvent(null);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Erro ao excluir evento",
        description: "Ocorreu um erro ao excluir o evento",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  if (displayEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum evento encontrado.
      </div>
    );
  }
  
  return (
    <>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pontos</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              {isAdmin && (
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayEvents.map(event => {
              const teamColor = getTeamColorClass(event.teamName);
              
              return (
                <tr 
                  key={event.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-8 w-1 ${teamColor.bg} rounded-full mr-3`}></div>
                      <span className="font-medium">{event.teamName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{event.type}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      +{event.points} pts
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-sm">
                    {formatDate(event.createdAt?.toDate() || new Date())}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowDeleteDialog(true);
                        }}
                      >
                        Excluir
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Event Detail Modal */}
      <EventDetailModal 
        event={selectedEvent} 
        open={!!selectedEvent} 
        onOpenChange={(open) => !open && setSelectedEvent(null)} 
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
