import { FirebaseTeam } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

interface PodiumProps {
  teams: FirebaseTeam[];
  isLoading: boolean;
}

export function Podium({ teams, isLoading }: PodiumProps) {
  // Get the top 3 teams
  const topTeams = teams?.slice(0, 3) || [];
  
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-md p-6 mb-8 text-white">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-primary-500">Pódio Atual</h2>
        <div className="flex justify-center items-end h-64 mb-6">
          <Skeleton className="h-48 w-24 bg-white/20 mx-2" />
          <Skeleton className="h-56 w-28 bg-white/20 mx-2" />
          <Skeleton className="h-40 w-24 bg-white/20 mx-2" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-md p-6 mb-8 text-white">
      <h2 className="text-xl font-bold mb-6 pb-2 border-b border-primary-500">Pódio Atual</h2>
      <div className="flex justify-center items-end h-64 mb-6">
        {/* 2nd Place */}
        {topTeams.length >= 2 ? (
          <div className="flex flex-col items-center mx-2">
            <div className="bg-gray-200 text-gray-800 rounded-full h-16 w-16 flex items-center justify-center mb-3 text-xl font-bold shadow-md">2</div>
            <div className="w-24 h-48 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg relative shadow-lg flex flex-col items-center justify-end pb-4">
              <div className="absolute bottom-full mb-2">
                <div className="h-14 w-14 rounded-full border-2 border-white shadow-md bg-gray-300 flex items-center justify-center font-bold text-gray-800 text-lg">
                  {topTeams[1]?.name?.[0]}
                </div>
              </div>
              <span className="font-bold text-gray-800">{topTeams[1]?.name}</span>
              <span className="text-sm text-gray-700">{topTeams[1]?.points} pts</span>
            </div>
          </div>
        ) : (
          <div className="w-24 h-48 opacity-30 mx-2"></div>
        )}
        
        {/* 1st Place */}
        {topTeams.length >= 1 ? (
          <div className="flex flex-col items-center mx-2 z-10">
            <div className="bg-amber-300 text-amber-800 rounded-full h-16 w-16 flex items-center justify-center mb-3 text-xl font-bold shadow-md animate-pulse">1</div>
            <div className="w-28 h-56 bg-gradient-to-b from-amber-300 to-amber-500 rounded-t-lg relative shadow-lg flex flex-col items-center justify-end pb-4">
              <div className="absolute bottom-full mb-2">
                <div className="h-16 w-16 rounded-full border-2 border-white shadow-md bg-amber-300 flex items-center justify-center font-bold text-amber-800 text-2xl">
                  {topTeams[0]?.name?.[0]}
                </div>
              </div>
              <span className="font-bold text-amber-800">{topTeams[0]?.name}</span>
              <span className="text-sm text-amber-700">{topTeams[0]?.points} pts</span>
            </div>
          </div>
        ) : (
          <div className="w-28 h-56 opacity-30 mx-2"></div>
        )}
        
        {/* 3rd Place */}
        {topTeams.length >= 3 ? (
          <div className="flex flex-col items-center mx-2">
            <div className="bg-amber-800 text-amber-100 rounded-full h-16 w-16 flex items-center justify-center mb-3 text-xl font-bold shadow-md">3</div>
            <div className="w-24 h-40 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-lg relative shadow-lg flex flex-col items-center justify-end pb-4">
              <div className="absolute bottom-full mb-2">
                <div className="h-14 w-14 rounded-full border-2 border-white shadow-md bg-amber-700 flex items-center justify-center font-bold text-amber-100 text-lg">
                  {topTeams[2]?.name?.[0]}
                </div>
              </div>
              <span className="font-bold text-amber-100">{topTeams[2]?.name}</span>
              <span className="text-sm text-amber-200">{topTeams[2]?.points} pts</span>
            </div>
          </div>
        ) : (
          <div className="w-24 h-40 opacity-30 mx-2"></div>
        )}
      </div>
    </div>
  );
}
