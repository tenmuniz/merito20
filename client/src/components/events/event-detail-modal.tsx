import { FirebaseEvent } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate, getTeamColorClass } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface EventDetailModalProps {
  event: FirebaseEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailModal({ event, open, onOpenChange }: EventDetailModalProps) {
  const { isAdmin } = useAuth();
  
  if (!event) return null;
  
  const teamColor = getTeamColorClass(event.teamName);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Detalhes do Evento</span>
            <div className="flex items-center">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium mr-2">+{event.points} pts</span>
              <span className="text-sm text-gray-500">{formatDate(event.createdAt?.toDate() || new Date())}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-2 space-y-4">
          <div className="flex items-center">
            <div className={`h-8 w-1 ${teamColor.bg} rounded-full mr-3`}></div>
            <span className="font-medium text-lg">Time {event.teamName}</span>
          </div>
          
          <div>
            <h4 className="text-base font-medium text-gray-700 mb-1">{event.type}</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {event.description}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Policiais Envolvidos</h4>
            <p className="text-sm text-gray-600">
              {event.officersInvolved}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Registrado por</h4>
            <p className="text-sm text-gray-600">
              {event.createdBy}
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          {isAdmin && (
            <Button variant="outline" className="mr-auto">
              Editar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
