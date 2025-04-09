import { useState } from "react";
import { Helmet } from "react-helmet";
import { useTeams } from "@/hooks/use-teams";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, subMonths, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { FirebaseEvent } from "@/lib/firebase";
import { getChartColor } from "@/lib/utils";

export default function Analytics() {
  const { teams, sortedTeams, isLoading: teamsLoading } = useTeams();
  const { events, isLoading: eventsLoading } = useEvents();
  const [timeRange, setTimeRange] = useState("month");
  
  // Generate date-based metrics
  const getFilteredEvents = () => {
    if (!events) return [];
    
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subDays(now, 30);
        break;
      case "quarter":
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 30);
    }
    
    return events.filter(event => {
      const eventDate = event.createdAt?.toDate() || new Date();
      return eventDate >= startDate && eventDate <= now;
    });
  };
  
  const filteredEvents = getFilteredEvents();
  
  // Data for team performance chart
  const getTeamPerformanceData = () => {
    if (!filteredEvents.length || !teams) return [];
    
    // For simplicity, we'll aggregate by week even in month/quarter views
    const teamDataByDate: Record<string, Record<string, number>> = {};
    
    filteredEvents.forEach(event => {
      const date = event.createdAt?.toDate() || new Date();
      const formattedDate = format(date, "dd/MM");
      const teamId = event.teamId;
      
      if (!teamDataByDate[formattedDate]) {
        teamDataByDate[formattedDate] = {};
        teams.forEach(team => {
          teamDataByDate[formattedDate][team.id] = 0;
        });
      }
      
      teamDataByDate[formattedDate][teamId] += event.points;
    });
    
    // Convert to array format for chart
    return Object.entries(teamDataByDate)
      .sort(([dateA], [dateB]) => {
        const [dayA, monthA] = dateA.split('/').map(Number);
        const [dayB, monthB] = dateB.split('/').map(Number);
        return (monthA - monthB) || (dayA - dayB);
      })
      .map(([date, teamPoints]) => {
        const result: Record<string, any> = { date };
        teams.forEach(team => {
          result[team.name] = teamPoints[team.id] || 0;
        });
        return result;
      });
  };
  
  // Data for event types chart
  const getEventTypesData = () => {
    if (!filteredEvents.length) return [];
    
    const eventTypeCount: Record<string, number> = {};
    
    filteredEvents.forEach(event => {
      if (!eventTypeCount[event.type]) {
        eventTypeCount[event.type] = 0;
      }
      eventTypeCount[event.type]++;
    });
    
    return Object.entries(eventTypeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };
  
  // Data for team points distribution chart
  const getTeamPointsDistribution = () => {
    if (!filteredEvents.length || !teams) return [];
    
    const teamPoints: Record<string, number> = {};
    
    teams.forEach(team => {
      teamPoints[team.id] = 0;
    });
    
    filteredEvents.forEach(event => {
      teamPoints[event.teamId] += event.points;
    });
    
    return teams.map(team => ({
      name: team.name,
      value: teamPoints[team.id] || 0
    }));
  };
  
  // Daily events average
  const getEventsAveragePerDay = () => {
    if (!filteredEvents.length) return 0;
    
    const daysCount = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    return +(filteredEvents.length / daysCount).toFixed(1);
  };
  
  // Total points in period
  const getTotalPointsInPeriod = () => {
    if (!filteredEvents.length) return 0;
    
    return filteredEvents.reduce((total, event) => total + event.points, 0);
  };
  
  // Points per day
  const getAveragePointsPerDay = () => {
    if (!filteredEvents.length) return 0;
    
    const totalPoints = getTotalPointsInPeriod();
    const daysCount = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    return +(totalPoints / daysCount).toFixed(1);
  };
  
  const teamPerformanceData = getTeamPerformanceData();
  const eventTypesData = getEventTypesData();
  const teamPointsDistribution = getTeamPointsDistribution();
  
  return (
    <>
      <Helmet>
        <title>Análise de Desempenho | Sistema de Meritocracia - 20ª CIPM</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Análise de Desempenho</h1>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold">{filteredEvents.length}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Média Diária</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold">{getEventsAveragePerDay()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pontos por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold">{getAveragePointsPerDay()}</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="performance">
          <TabsList className="mb-4">
            <TabsTrigger value="performance">Desempenho por Equipe</TabsTrigger>
            <TabsTrigger value="types">Tipos de Eventos</TabsTrigger>
            <TabsTrigger value="distribution">Distribuição de Pontos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Pontos por Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !teamPerformanceData.length ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={teamPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {teams?.map((team, index) => (
                        <Line 
                          key={team.id}
                          type="monotone" 
                          dataKey={team.name} 
                          stroke={getChartColor(index)}
                          activeDot={{ r: 8 }} 
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="types">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo de Evento</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !eventTypesData.length ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={eventTypesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Quantidade" fill="#3b82f6">
                        {eventTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="distribution">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Pontos por Equipe</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {isLoading || !teamPointsDistribution.length ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={teamPointsDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {teamPointsDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} pontos`, 'Total']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
