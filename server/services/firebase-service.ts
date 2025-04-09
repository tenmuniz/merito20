import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { FirebaseTeam, FirebaseEvent, FirebaseUser } from '@/lib/firebase';

export class FirebaseService {
  private static instance: FirebaseService;
  private db: firebase.firestore.Firestore;
  
  private constructor() {
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || ""
    };
    
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      this.db = firebase.firestore();
    } catch (error) {
      console.error("Firebase initialization error:", error);
      throw error;
    }
  }
  
  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }
  
  // Teams methods
  async getTeams(): Promise<FirebaseTeam[]> {
    try {
      const snapshot = await this.db.collection('teams').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseTeam[];
    } catch (error) {
      console.error("Error getting teams:", error);
      throw error;
    }
  }
  
  async getTeamById(id: string): Promise<FirebaseTeam | null> {
    try {
      const doc = await this.db.collection('teams').doc(id).get();
      if (!doc.exists) return null;
      
      return {
        id: doc.id,
        ...doc.data()
      } as FirebaseTeam;
    } catch (error) {
      console.error("Error getting team:", error);
      throw error;
    }
  }
  
  async createTeam(teamData: Omit<FirebaseTeam, 'id'>): Promise<FirebaseTeam> {
    try {
      const docRef = await this.db.collection('teams').add(teamData);
      const newTeam = await docRef.get();
      
      return {
        id: docRef.id,
        ...newTeam.data()
      } as FirebaseTeam;
    } catch (error) {
      console.error("Error creating team:", error);
      throw error;
    }
  }
  
  // Events methods
  async getEvents(): Promise<FirebaseEvent[]> {
    try {
      const snapshot = await this.db.collection('events')
        .orderBy('createdAt', 'desc')
        .get();
        
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseEvent[];
    } catch (error) {
      console.error("Error getting events:", error);
      throw error;
    }
  }
  
  async getEventById(id: string): Promise<FirebaseEvent | null> {
    try {
      const doc = await this.db.collection('events').doc(id).get();
      if (!doc.exists) return null;
      
      return {
        id: doc.id,
        ...doc.data()
      } as FirebaseEvent;
    } catch (error) {
      console.error("Error getting event:", error);
      throw error;
    }
  }
  
  async createEvent(eventData: Omit<FirebaseEvent, 'id' | 'createdAt'>): Promise<FirebaseEvent> {
    try {
      const newEvent = {
        ...eventData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('events').add(newEvent);
      const createdEvent = await docRef.get();
      
      // Update team points
      await this.updateTeamPoints(eventData.teamId, eventData.points);
      
      return {
        id: docRef.id,
        ...createdEvent.data()
      } as FirebaseEvent;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }
  
  async deleteEvent(id: string): Promise<void> {
    try {
      // Get event to subtract points
      const eventDoc = await this.db.collection('events').doc(id).get();
      if (!eventDoc.exists) {
        throw new Error("Event not found");
      }
      
      const event = eventDoc.data() as FirebaseEvent;
      
      // Delete event
      await this.db.collection('events').doc(id).delete();
      
      // Update team points (subtract)
      await this.updateTeamPoints(event.teamId, -event.points);
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }
  
  private async updateTeamPoints(teamId: string, pointsToAdd: number): Promise<void> {
    try {
      const teamRef = this.db.collection('teams').doc(teamId);
      
      await this.db.runTransaction(async (transaction) => {
        const teamDoc = await transaction.get(teamRef);
        
        if (!teamDoc.exists) {
          throw new Error("Team not found");
        }
        
        const teamData = teamDoc.data() as FirebaseTeam;
        const currentPoints = teamData.points || 0;
        const newPoints = Math.max(0, currentPoints + pointsToAdd);
        
        transaction.update(teamRef, { points: newPoints });
      });
    } catch (error) {
      console.error("Error updating team points:", error);
      throw error;
    }
  }
  
  // Users methods
  async authenticateUser(username: string, password: string): Promise<FirebaseUser | null> {
    try {
      const snapshot = await this.db.collection('users')
        .where('username', '==', username)
        .get();
      
      if (snapshot.empty) return null;
      
      const userData = snapshot.docs[0].data() as Omit<FirebaseUser, 'id'>;
      
      // In a real application, we would compare hashed passwords
      // This is just simplified for the demo
      if (password === userData.password) {
        return {
          id: snapshot.docs[0].id,
          ...userData
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error authenticating user:", error);
      throw error;
    }
  }
  
  // Analytics methods
  async getPerformanceData(timeRange: string = 'month'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      // Get events in the time range
      const snapshot = await this.db.collection('events')
        .where('createdAt', '>=', startDate)
        .orderBy('createdAt', 'asc')
        .get();
      
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseEvent[];
      
      // Get teams
      const teams = await this.getTeams();
      
      // Process data for charts
      // This is a simplified implementation - real implementation would have more robust data processing
      
      return {
        events,
        teams,
        timeRange
      };
    } catch (error) {
      console.error("Error getting performance data:", error);
      throw error;
    }
  }
}
