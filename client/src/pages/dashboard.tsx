import { Helmet } from "react-helmet";
import { useTeams } from "@/hooks/use-teams";
import { useEvents } from "@/hooks/use-events";
import { TeamCard } from "@/components/dashboard/team-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { Podium } from "@/components/dashboard/podium";
import { EventsTable } from "@/components/events/events-table";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { AddEventModal } from "@/components/events/add-event-modal";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { sortedTeams, isLoading: teamsLoading, teamProgressPercentages } = useTeams();
  const { recentEvents, isLoading: eventsLoading } = useEvents();
  const { isAdmin } = useAuth();
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  return (
    <>
      <Helmet>
        <title>Dashboard | Sistema de Meritocracia - 20ª CIPM</title>
      </Helmet>

      <div className="space-y-8">
        {/* Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <Skeleton className="h-8 w-28 mb-4" />
                <Skeleton className="h-6 w-16 mb-4" />
                <Skeleton className="h-3 w-full mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))
          ) : (
            sortedTeams.map((team, index) => (
              <TeamCard 
                key={team.id}
                team={team}
                position={index + 1}
                progress={teamProgressPercentages[team.id] || 0}
              />
            ))
          )}
        </div>

        {/* Podium Section */}
        <Podium teams={sortedTeams} isLoading={teamsLoading} />

        {/* Recent Events & Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Eventos Recentes</h2>
              <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Ver todos
              </Button>
            </div>
            <EventsTable events={recentEvents} isLoading={eventsLoading} limit={5} />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Desempenho Mensal</h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="text-xs">Semana</Button>
                <Button variant="secondary" size="sm" className="text-xs">Mês</Button>
                <Button variant="outline" size="sm" className="text-xs">Trimestre</Button>
              </div>
            </div>
            <div className="h-64">
              <PerformanceChart teams={sortedTeams} isLoading={teamsLoading} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats teams={sortedTeams} isLoading={teamsLoading || eventsLoading} />

        {/* Add Event Button (Admin Only) */}
        {isAdmin && (
          <div className="fixed bottom-6 right-6">
            <Button 
              onClick={() => setShowAddEventModal(true)} 
              className="rounded-full w-12 h-12 p-0"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AddEventModal open={showAddEventModal} onOpenChange={setShowAddEventModal} />
    </>
  );
}
