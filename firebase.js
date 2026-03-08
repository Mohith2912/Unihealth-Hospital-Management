// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArT58XNlHQyPyvji-e8HCEovVeYrhF7t8",
  authDomain: "uni-health-64e06.firebaseapp.com",
  databaseURL: "https://uni-health-64e06-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "uni-health-64e06",
  storageBucket: "uni-health-64e06.firebasestorage.app",
  messagingSenderId: "421283614648",
  appId: "1:421283614648:web:4d4c894371c2a1e0b1494d",
  measurementId: "G-CS84CLKB80"
}
// After firebase.initializeApp(firebaseConfig);
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Simple helper wrappers used everywhere
window.uhDbRef = (path) => db.ref(path);
window.uhDbOnValue = (ref, cb) => ref.on('value', cb);
window.uhDbUpdate = (ref, data) => ref.update(data);
