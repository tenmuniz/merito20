import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEvents } from "@/hooks/use-events";
import { useTeams } from "@/hooks/use-teams";
import { useAuth } from "@/hooks/use-auth";
import { EventType } from "@shared/schema";

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEventModal({ open, onOpenChange }: AddEventModalProps) {
  const { teams } = useTeams();
  const { eventTypes, addEvent } = useEvents();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    teamId: "",
    teamName: "",
    type: "",
    points: 10,
    description: "",
    officersInvolved: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If teamId changes, update teamName
    if (field === 'teamId') {
      const team = teams?.find(t => t.id === value);
      if (team) {
        setFormData(prev => ({ ...prev, teamId: value, teamName: team.name }));
      }
    }
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!formData.teamId || !formData.type || !formData.description || !formData.officersInvolved) {
        // Would normally show validation errors here
        return;
      }
      
      await addEvent.mutateAsync({
        ...formData,
        createdBy: currentUser?.fullName || "Usuário Anônimo"
      });
      
      // Reset form and close modal
      setFormData({
        teamId: "",
        teamName: "",
        type: "",
        points: 10,
        description: "",
        officersInvolved: ""
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Novo Evento</DialogTitle>
        </DialogHeader>
        
        <div className="mt-2 space-y-4">
          <div>
            <Label htmlFor="team">Time</Label>
            <Select 
              value={formData.teamId} 
              onValueChange={(value) => handleChange('teamId', value)}
            >
              <SelectTrigger id="team">
                <SelectValue placeholder="Selecione um time" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="eventType">Tipo de Evento</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleChange('type', value)}
            >
              <SelectTrigger id="eventType">
                <SelectValue placeholder="Selecione o tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="points">Pontos</Label>
            <Input 
              id="points" 
              type="number" 
              min={1} 
              value={formData.points}
              onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description" 
              rows={4} 
              placeholder="Descreva o evento detalhadamente..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="officers">Policiais Envolvidos</Label>
            <Input 
              id="officers" 
              placeholder="Nomes dos policiais..."
              value={formData.officersInvolved}
              onChange={(e) => handleChange('officersInvolved', e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || addEvent.isPending}>
            {isSubmitting || addEvent.isPending ? "Registrando..." : "Registrar Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
