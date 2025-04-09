import { useState } from "react";
import { Helmet } from "react-helmet";
import { useEvents } from "@/hooks/use-events";
import { useTeams } from "@/hooks/use-teams";
import { EventsTable } from "@/components/events/events-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { FirebaseEvent } from "@/lib/firebase";

export default function Events() {
  const { events, isLoading } = useEvents();
  const { teams } = useTeams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  // Filter events based on search term and selected team
  const filteredEvents = events?.filter(event => {
    const matchesSearch = searchTerm === "" || 
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTeam = selectedTeam === "" || event.teamId === selectedTeam;
    
    return matchesSearch && matchesTeam;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <>
      <Helmet>
        <title>Histórico de Eventos | Sistema de Meritocracia - 20ª CIPM</title>
      </Helmet>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Histórico de Eventos</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar eventos..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <Select 
                value={selectedTeam} 
                onValueChange={(value) => {
                  setSelectedTeam(value);
                  setCurrentPage(1); // Reset to first page on filter
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os times" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os times</SelectItem>
                  {teams?.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </div>
          </div>
        </div>
        
        <EventsTable events={currentEvents} isLoading={isLoading} />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Mostrando {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, filteredEvents.length)} de {filteredEvents.length} resultados
            </span>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Display pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button 
                    key={pageNum}
                    variant={currentPage === pageNum ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => paginate(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <Button variant="outline" size="sm" disabled>...</Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => paginate(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
