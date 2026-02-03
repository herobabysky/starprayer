import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC5IcTJevFQuM38_YdSyZHTaDDDUhjsZEE",
  authDomain: "prayerstar-8d5c5.firebaseapp.com",
  databaseURL: "https://prayerstar-8d5c5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prayerstar-8d5c5",
  storageBucket: "prayerstar-8d5c5.firebasestorage.app",
  messagingSenderId: "279548781040",
  appId: "1:279548781040:web:7f32fcc9c68d3fec3bbd35",
  measurementId: "G-QD79FNTDZH"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, push, onValue };
