import { Helmet } from "react-helmet";
import { useTeams } from "@/hooks/use-teams";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getTeamColorClass } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function Teams() {
  const { teams, sortedTeams, isLoading: teamsLoading } = useTeams();
  const { events, getTeamEvents, isLoading: eventsLoading } = useEvents();
  
  const isLoading = teamsLoading || eventsLoading;

  // Generate recent team activity
  const getTeamActivity = (teamId: string) => {
    const teamEvents = getTeamEvents(teamId);
    return teamEvents.slice(0, 5); // Get latest 5 events
  };

  // Generate event types distribution for a team
  const getTeamEventTypesData = (teamId: string) => {
    const teamEvents = getTeamEvents(teamId);
    const eventTypeCounts: Record<string, number> = {};
    
    teamEvents.forEach(event => {
      if (!eventTypeCounts[event.type]) {
        eventTypeCounts[event.type] = 0;
      }
      eventTypeCounts[event.type]++;
    });
    
    return Object.entries(eventTypeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Generate monthly points for a team
  const getTeamMonthlyPoints = (teamId: string) => {
    const teamEvents = getTeamEvents(teamId);
    const monthlyPoints: Record<string, number> = {};
    
    // Initialize with past 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = formatDate(month).substring(3, 10); // Get MM/YYYY format
      monthlyPoints[monthKey] = 0;
    }
    
    teamEvents.forEach(event => {
      const date = event.createdAt?.toDate() || new Date();
      const monthKey = formatDate(date).substring(3, 10); // Get MM/YYYY format
      
      if (monthlyPoints[monthKey] !== undefined) {
        monthlyPoints[monthKey] += event.points;
      }
    });
    
    return Object.entries(monthlyPoints)
      .map(([month, points]) => ({ month, points }));
  };

  return (
    <>
      <Helmet>
        <title>Equipes | Sistema de Meritocracia - 20ª CIPM</title>
      </Helmet>
      
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Equipes</h1>
        
        <Tabs defaultValue={sortedTeams?.[0]?.id || "loading"}>
          <TabsList className="mb-4">
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              sortedTeams.map(team => (
                <TabsTrigger key={team.id} value={team.id}>{team.name}</TabsTrigger>
              ))
            )}
          </TabsList>
          
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-[600px] w-full" />
              </CardContent>
            </Card>
          ) : (
            sortedTeams.map(team => {
              const teamColor = getTeamColorClass(team.name);
              const teamActivity = getTeamActivity(team.id);
              const teamEventTypes = getTeamEventTypesData(team.id);
              const teamMonthlyPoints = getTeamMonthlyPoints(team.id);
              
              return (
                <TabsContent key={team.id} value={team.id}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardHeader className={`${teamColor.light} rounded-t-lg`}>
                        <CardTitle className={`${teamColor.text} text-center text-xl`}>Time {team.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-medium">Total de Pontos</span>
                          <span className={`${teamColor.text} text-2xl font-bold`}>{team.points}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${teamColor.progressBg} rounded-full`} style={{ width: '75%' }}></div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Total de Eventos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{getTeamEvents(team.id).length}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Média de Pontos por Evento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {getTeamEvents(team.id).length ? 
                            (team.points / getTeamEvents(team.id).length).toFixed(1) : 
                            0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Monthly Points Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Evolução Mensal de Pontos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={teamMonthlyPoints}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="points" 
                              stroke={teamColor.text.replace('text-', 'rgb(').replace('-600', ')').replace('blue', '59, 130, 246').replace('green', '16, 185, 129').replace('red', '239, 68, 68')}
                              name="Pontos" 
                              activeDot={{ r: 8 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    {/* Event Types Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Tipos de Eventos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={teamEventTypes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar 
                              dataKey="value" 
                              fill={teamColor.text.replace('text-', 'rgb(').replace('-600', ')').replace('blue', '59, 130, 246').replace('green', '16, 185, 129').replace('red', '239, 68, 68')}
                              name="Quantidade" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Team Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {teamActivity.length > 0 ? (
                        <div className="space-y-4">
                          {teamActivity.map(event => (
                            <div key={event.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">{event.type}</span>
                                <span className="text-sm text-green-600">+{event.points} pts</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1 line-clamp-2">{event.description}</p>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{event.officersInvolved}</span>
                                <span>{formatDate(event.createdAt?.toDate() || new Date())}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">Nenhum evento registrado para esta equipe.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })
          )}
        </Tabs>
      </div>
    </>
  );
}
