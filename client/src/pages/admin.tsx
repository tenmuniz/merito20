import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { useTeams } from "@/hooks/use-teams";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { EventsTable } from "@/components/events/events-table";
import { useToast } from "@/hooks/use-toast";
import { usersCollection, teamsCollection, eventsCollection, FirebaseTeam } from "@/lib/firebase";
import { AddEventModal } from "@/components/events/add-event-modal";

export default function Admin() {
  const { isAdmin, currentUser } = useAuth();
  const { events, isLoading: eventsLoading } = useEvents();
  const { teams, isLoading: teamsLoading } = useTeams();
  const { toast } = useToast();
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  
  const [newTeam, setNewTeam] = useState({
    name: "",
    colorCode: "#3b82f6" // Default blue color
  });
  
  const [newPointsRule, setNewPointsRule] = useState({
    eventType: "",
    points: 0,
    description: ""
  });

  const handleAddTeam = async () => {
    try {
      if (!newTeam.name.trim()) {
        toast({
          title: "Nome da equipe é obrigatório",
          variant: "destructive"
        });
        return;
      }
      
      // Check if team already exists
      const teamSnapshot = await teamsCollection.where('name', '==', newTeam.name).get();
      if (!teamSnapshot.empty) {
        toast({
          title: "Equipe já existe",
          description: "Uma equipe com este nome já existe no sistema",
          variant: "destructive"
        });
        return;
      }
      
      // Add new team
      await teamsCollection.add({
        name: newTeam.name,
        colorCode: newTeam.colorCode,
        points: 0
      });
      
      toast({
        title: "Equipe adicionada",
        description: `A equipe ${newTeam.name} foi adicionada com sucesso`,
        variant: "default"
      });
      
      // Reset form
      setNewTeam({
        name: "",
        colorCode: "#3b82f6"
      });
    } catch (error) {
      console.error("Error adding team:", error);
      toast({
        title: "Erro ao adicionar equipe",
        description: "Ocorreu um erro ao adicionar a equipe",
        variant: "destructive"
      });
    }
  };
  
  const handleAddPointsRule = async () => {
    try {
      if (!newPointsRule.eventType.trim() || newPointsRule.points <= 0) {
        toast({
          title: "Dados inválidos",
          description: "Tipo de evento e pontos são obrigatórios",
          variant: "destructive"
        });
        return;
      }
      
      // In a real app, we would store this in a separate collection
      // For now, we'll just show a success message
      toast({
        title: "Regra adicionada",
        description: `Regra para ${newPointsRule.eventType} (${newPointsRule.points} pts) adicionada`,
        variant: "default"
      });
      
      // Reset form
      setNewPointsRule({
        eventType: "",
        points: 0,
        description: ""
      });
    } catch (error) {
      console.error("Error adding points rule:", error);
      toast({
        title: "Erro ao adicionar regra",
        description: "Ocorreu um erro ao adicionar a regra de pontuação",
        variant: "destructive"
      });
    }
  };
  
  // If user is not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Acesso Restrito</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Você não tem permissão para acessar a área administrativa.
              Apenas usuários com privilégios de administrador podem acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Administração | Sistema de Meritocracia - 20ª CIPM</title>
      </Helmet>
      
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <Button onClick={() => setShowAddEventModal(true)}>Adicionar Evento</Button>
        </div>
        
        <Tabs defaultValue="events">
          <TabsList className="mb-4">
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="teams">Equipes</TabsTrigger>
            <TabsTrigger value="rules">Regras de Pontuação</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Eventos</CardTitle>
                <CardDescription>Visualize, edite ou exclua eventos registrados no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <EventsTable 
                  events={events || []} 
                  isLoading={eventsLoading} 
                  isAdmin={true} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teams">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {teamsLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="h-20 animate-pulse bg-gray-200 rounded-md"></div>
                  </CardContent>
                </Card>
              ) : (
                teams?.map(team => (
                  <Card key={team.id}>
                    <CardHeader>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>Pontuação atual: {team.points} pts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="h-4 w-full rounded-full mb-2" 
                        style={{ backgroundColor: team.colorCode }}
                      ></div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Nova Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Nome da Equipe</Label>
                      <Input 
                        id="teamName" 
                        value={newTeam.name}
                        onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ex: Delta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamColor">Cor da Equipe</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="teamColor" 
                          type="color"
                          value={newTeam.colorCode}
                          onChange={(e) => setNewTeam(prev => ({ ...prev, colorCode: e.target.value }))}
                          className="w-16 p-1 h-10"
                        />
                        <Input 
                          value={newTeam.colorCode}
                          onChange={(e) => setNewTeam(prev => ({ ...prev, colorCode: e.target.value }))}
                          placeholder="#RRGGBB"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAddTeam}>Adicionar Equipe</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Pontuação</CardTitle>
                <CardDescription>Defina os pontos para cada tipo de evento.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Evento</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pontos</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-4 px-4">Prisão em Flagrante</td>
                          <td className="py-4 px-4">15</td>
                          <td className="py-4 px-4">Prisão de indivíduo em flagrante delito</td>
                          <td className="py-4 px-4">
                            <Button variant="outline" size="sm">Editar</Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4">Apreensão de Arma</td>
                          <td className="py-4 px-4">10</td>
                          <td className="py-4 px-4">Apreensão de arma de fogo</td>
                          <td className="py-4 px-4">
                            <Button variant="outline" size="sm">Editar</Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4">Recuperação de Veículo</td>
                          <td className="py-4 px-4">8</td>
                          <td className="py-4 px-4">Recuperação de veículo com queixa de roubo/furto</td>
                          <td className="py-4 px-4">
                            <Button variant="outline" size="sm">Editar</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4">Adicionar Nova Regra</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="eventType">Tipo de Evento</Label>
                        <Input 
                          id="eventType" 
                          value={newPointsRule.eventType}
                          onChange={(e) => setNewPointsRule(prev => ({ ...prev, eventType: e.target.value }))}
                          placeholder="ex: Apreensão de Drogas"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="points">Pontos</Label>
                        <Input 
                          id="points" 
                          type="number"
                          min={0}
                          value={newPointsRule.points.toString()}
                          onChange={(e) => setNewPointsRule(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                          placeholder="10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input 
                          id="description"
                          value={newPointsRule.description}
                          onChange={(e) => setNewPointsRule(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Breve descrição do evento"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleAddPointsRule}>Adicionar Regra</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>Adicione ou edite usuários administrativos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-4 px-4">{currentUser?.fullName}</td>
                          <td className="py-4 px-4">{currentUser?.username}</td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Administrador</span>
                          </td>
                          <td className="py-4 px-4">
                            <Button variant="outline" size="sm">Editar</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4">Adicionar Novo Usuário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input id="fullName" placeholder="ex: João Silva" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Nome de Usuário</Label>
                        <Input id="username" placeholder="ex: joao.silva" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" placeholder="Senha segura" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <Input id="confirmPassword" type="password" placeholder="Confirme a senha" />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button>Adicionar Usuário</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Event Modal */}
      <AddEventModal open={showAddEventModal} onOpenChange={setShowAddEventModal} />
    </>
  );
}
