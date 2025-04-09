import React, { useState, useEffect } from 'react';

interface Team {
  id: number;
  name: string;
  colorCode: string;
  points: number;
}

function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) {
          throw new Error('Falha ao carregar as equipes');
        }
        const data = await response.json();
        setTeams(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro:', err);
        setError('Não foi possível carregar os dados das equipes');
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-blue-800 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Sistema de Meritocracia - 20ª CIPM</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4 flex-1">
        <h2 className="text-xl font-semibold mb-4">Pontuação das Equipes</h2>
        
        {loading ? (
          <p className="text-center py-8">Carregando dados...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
            <p className="mt-2">Utilizando dados padrão.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
                <h3 className="text-lg font-bold">Alfa</h3>
                <p className="text-2xl font-bold mt-2">0 pontos</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
                <h3 className="text-lg font-bold">Bravo</h3>
                <p className="text-2xl font-bold mt-2">0 pontos</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-red-500">
                <h3 className="text-lg font-bold">Charlie</h3>
                <p className="text-2xl font-bold mt-2">0 pontos</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div 
                key={team.id} 
                className="bg-white p-6 rounded-lg shadow-md"
                style={{ borderTop: `4px solid ${team.colorCode}` }}
              >
                <h3 className="text-lg font-bold">{team.name}</h3>
                <p className="text-2xl font-bold mt-2">{team.points} pontos</p>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2025 - 20ª CIPM - Sistema de Meritocracia</p>
      </footer>
    </div>
  );
}

export default App;
