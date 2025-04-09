import { FirebaseTeam } from "@/lib/firebase";
import { getChartColor } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-events";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

interface PerformanceChartProps {
  teams: FirebaseTeam[];
  isLoading: boolean;
}

export function PerformanceChart({ teams, isLoading }: PerformanceChartProps) {
  const { events } = useEvents();
  
  const chartData = useMemo(() => {
    if (!teams || !events) return [];
    
    // Get last 6 months
    const today = new Date();
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(today, 5 - i);
      return {
        date,
        label: format(date, "MMM", { locale: ptBR }),
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
    });
    
    // Initialize data with month labels
    const data = months.map(month => ({
      month: month.label,
      ...teams.reduce((acc, team) => {
        acc[team.name] = 0;
        return acc;
      }, {} as Record<string, number>)
    }));
    
    // Calculate points for each team in each month
    events.forEach(event => {
      if (!event.createdAt) return;
      
      const eventDate = event.createdAt.toDate();
      const monthIndex = months.findIndex(month => 
        eventDate >= month.start && eventDate <= month.end
      );
      
      if (monthIndex !== -1) {
        const team = teams.find(t => t.id === event.teamId);
        if (team) {
          data[monthIndex][team.name] += event.points;
        }
      }
    });
    
    // Calculate cumulative totals
    const cumulativeData = data.map((monthData, index) => {
      if (index === 0) return monthData;
      
      const result = { ...monthData };
      teams.forEach(team => {
        result[team.name] += data[index - 1][team.name];
      });
      
      return result;
    });
    
    return cumulativeData;
  }, [teams, events]);
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        {teams.map((team, index) => (
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
  );
}
