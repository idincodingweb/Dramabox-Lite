import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const cfg = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function run() {
    console.log("Config loaded");
}
run();
