import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usersCollection, FirebaseUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  isAdmin: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check for saved user in local storage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as FirebaseUser;
        setCurrentUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // In a real application, you'd want to hash the password
      // and check it server-side, but for this demo we'll query directly
      const snapshot = await usersCollection.where('username', '==', username).get();
      
      if (snapshot.empty) {
        toast({
          title: "Erro no login",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return false;
      }
      
      const userData = snapshot.docs[0].data();
      
      // In a real app, we would never store passwords in plain text
      // This is just for demonstration purposes
      if (password === userData.password) {
        const user: FirebaseUser = {
          id: snapshot.docs[0].id,
          username: userData.username,
          fullName: userData.fullName,
          isAdmin: userData.isAdmin || false,
          password: userData.password
        };
        
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo, ${user.fullName}!`,
          variant: "default"
        });
        
        return true;
      } else {
        toast({
          title: "Erro no login",
          description: "Senha incorreta",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema",
      variant: "default"
    });
  };

  const isAdmin = !!currentUser?.isAdmin;

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};