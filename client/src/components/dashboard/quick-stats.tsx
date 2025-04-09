import { FirebaseTeam } from "@/lib/firebase";
import { useEvents } from "@/hooks/use-events";
import { CalendarCheck, Target, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { subMonths } from "date-fns";

interface QuickStatsProps {
  teams: FirebaseTeam[];
  isLoading: boolean;
}

export function QuickStats({ teams, isLoading }: QuickStatsProps) {
  const { events } = useEvents();
  
  const stats = useMemo(() => {
    if (!events) return { total: 0, goalPercentage: 0, averageDaily: 0 };
    
    // Total events
    const totalEvents = events.length;
    
    // Goal percentage (team with most points vs target)
    const highestPoints = teams?.[0]?.points || 0;
    const targetPoints = 400; // could be configurable
    const goalPercentage = Math.round((highestPoints / targetPoints) * 100);
    
    // Daily average over current month
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    const recentEvents = events.filter(event => 
      event.createdAt?.toDate() >= oneMonthAgo
    );
    
    // Approximate number of days in a month
    const daysInMonth = 30;
    const averageDaily = +(recentEvents.length / daysInMonth).toFixed(1);
    
    // Compare with previous month
    const twoMonthsAgo = subMonths(oneMonthAgo, 1);
    const previousMonthEvents = events.filter(event => 
      event.createdAt?.toDate() >= twoMonthsAgo &&
      event.createdAt?.toDate() < oneMonthAgo
    );
    
    const previousMonthAverage = previousMonthEvents.length / daysInMonth;
    const averageChange = Math.round(((averageDaily - previousMonthAverage) / previousMonthAverage) * 100);
    
    // Goal percentage change
    // This would normally be calculated against previous period data
    const goalChange = 5; // for demo purposes
    
    // Total events change
    const totalChange = Math.round(((recentEvents.length - previousMonthEvents.length) / previousMonthEvents.length) * 100);
    
    return {
      total: totalEvents,
      totalChange,
      goalPercentage,
      goalChange,
      averageDaily,
      averageChange
    };
  }, [events, teams]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-gray-500 text-sm font-medium">Total de Eventos</h3>
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-20 mb-2" />
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">{stats.total}</span>
            <span className="text-green-600 text-sm font-medium">
              +{stats.totalChange}% <TrendingUp className="h-3 w-3 inline" />
            </span>
          </div>
        )}
        <p className="text-gray-500 text-xs mt-2">Comparado ao mês anterior</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-gray-500 text-sm font-medium">Objetivo Atingido</h3>
          <div className="p-2 bg-green-100 rounded-lg">
            <Target className="h-5 w-5 text-green-600" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-20 mb-2" />
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">{stats.goalPercentage}%</span>
            <span className="text-green-600 text-sm font-medium">
              +{stats.goalChange}% <TrendingUp className="h-3 w-3 inline" />
            </span>
          </div>
        )}
        <p className="text-gray-500 text-xs mt-2">Comparado ao mês anterior</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-gray-500 text-sm font-medium">Média Diária</h3>
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-20 mb-2" />
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">{stats.averageDaily}</span>
            <span className="text-green-600 text-sm font-medium">
              +{stats.averageChange}% <TrendingUp className="h-3 w-3 inline" />
            </span>
          </div>
        )}
        <p className="text-gray-500 text-xs mt-2">Eventos por dia</p>
      </div>
    </div>
  );
}
