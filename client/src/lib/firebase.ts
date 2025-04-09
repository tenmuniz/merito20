import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Initialize Firebase with the configuration provided
const firebaseConfig = {
  apiKey: "AIzaSyAEAaKTimREDnZdMZaEqeIErW1Vg8n_GGw",
  authDomain: "sistema-meritocracia-20cipm.firebaseapp.com",
  projectId: "sistema-meritocracia-20cipm",
  storageBucket: "sistema-meritocracia-20cipm.firebasestorage.app",
  messagingSenderId: "1096372826283",
  appId: "1:1096372826283:web:31f4fbdbf554bbd67c87ee"
};

// Inicializar o Firebase
let app;
try {
  app = firebase.initializeApp(firebaseConfig);
} catch (error) {
  // Se um app já estiver inicializado, use-o
  app = firebase.app();
}

export const db = app.firestore();

// Coleções
export const teamsCollection = db.collection('teams');
export const eventsCollection = db.collection('events');
export const usersCollection = db.collection('users');

// Enums para uso em toda aplicação
export enum EventType {
  ARREST = "Prisão em Flagrante",
  WEAPON_SEIZURE = "Apreensão de Arma",
  DRUG_SEIZURE = "Apreensão de Drogas",
  VEHICLE_RECOVERY = "Recuperação de Veículo",
  OPERATION = "Operação",
  PATROL = "Patrulhamento",
  OTHER = "Outros"
}

export enum TeamName {
  ALFA = "Alfa",
  BRAVO = "Bravo",
  CHARLIE = "Charlie"
}

// Type definitions
export interface FirebaseTeam {
  id: string;
  name: string;
  colorCode: string;
  points: number;
}

export interface FirebaseEvent {
  id: string;
  teamId: string;
  teamName: string;
  type: string;
  description: string;
  points: number;
  officersInvolved: string;
  createdBy: string;
  createdAt: firebase.firestore.Timestamp;
}

export interface FirebaseUser {
  id: string;
  username: string;
  fullName: string;
  isAdmin: boolean;
  password?: string; // Added for authentication purposes
}

// Utility functions
export const getServerTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
export const timestampToDate = (timestamp: firebase.firestore.Timestamp) => timestamp.toDate();

export default firebase;
