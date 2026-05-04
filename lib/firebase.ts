import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDRs09y8_Qn-Ks5a46McvTACd2vWBZpCvI",
  authDomain: "neu-gelisim.firebaseapp.com",
  projectId: "neu-gelisim",
  storageBucket: "neu-gelisim.firebasestorage.app",
  messagingSenderId: "697023265200",
  appId: "1:697023265200:web:31ce6a66b150a93e857e75",
  //measurementId: "G-JLZW5CPHJ2"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };