import { useEffect, useState } from "react";
import { FirebaseTeam } from "@/lib/firebase";
import { getTeamColorClass, formatPoints, getRankingText } from "@/lib/utils";
import { useEvents } from "@/hooks/use-events";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  team: FirebaseTeam;
  position: number;
  progress: number;
}

export function TeamCard({ team, position, progress }: TeamCardProps) {
  const { events } = useEvents();
  const [animate, setAnimate] = useState(false);
  const teamColor = getTeamColorClass(team.name);
  
  // Get latest event for this team
  const latestEvent = events?.find(event => event.teamId === team.id);
  
  // Animation effect when clicked
  const triggerAnimation = () => {
    setAnimate(true);
    setTimeout(() => setAnimate(false), 700);
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
      onClick={triggerAnimation}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg">Time {team.name}</h3>
        <span 
          className={cn(
            teamColor.text, 
            "text-2xl font-bold",
            animate ? "score-change" : ""
          )}
        >
          {formatPoints(team.points)}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div 
          className={cn(
            "h-full rounded-full animate-progress",
            teamColor.progressBg
          )}
          style={{ "--progress-width": `${progress}%` } as React.CSSProperties}
        ></div>
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>{getRankingText(position)}</span>
        <span>{progress}% da meta</span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Último evento:</span>
          {latestEvent ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              +{latestEvent.points} pts - {formatRelativeDate(latestEvent.createdAt?.toDate() || new Date())}
            </span>
          ) : (
            <span className="text-gray-400">Nenhum evento</span>
          )}
        </div>
      </div>
    </div>
  );
}
