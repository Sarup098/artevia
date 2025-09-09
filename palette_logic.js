import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCVnRmh3kRwnc9Feq3XBLfwuHS0gv8J36A",
    authDomain: "palette-9bee8.firebaseapp.com",
    projectId: "palette-9bee8",
    storageBucket: "palette-9bee8.appspot.com",
    messagingSenderId: "140431314373",
    appId: "1:140431314373:web:636fd2de7bdbae30598fac",
    measurementId: "G-PS1YJ5MDTF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- DOM ELEMENT SELECTORS ---
const mainContent = document.getElementById('main-content');
const openFormBtn = document.getElementById('open-form-btn');
const formIntro = document.getElementById('form-intro');
const formContainer = document.getElementById('form-container');
const form = document.getElementById('pre-launch-form');
const submitButton = document.getElementById('submit-button');
const submitButtonText = document.getElementById('submit-button-text');
const submitSpinner = document.getElementById('submit-spinner');
const formFeedback = document.getElementById('form-feedback');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const adminSection = document.getElementById('admin-section');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const dashboard = document.getElementById('dashboard');
const tableBody = document.getElementById('signups-table-body');
const cardsContainer = document.getElementById('signups-cards-container');
const logoutBtn = document.getElementById('logout-btn');
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeOpen = document.getElementById('eye-open');
const eyeClosed = document.getElementById('eye-closed');
const totalSignupsEl = document.getElementById('total-signups');
const uniqueContactsEl = document.getElementById('unique-contacts');
const signupsTodayEl = document.getElementById('signups-today');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteModalTitle = document.getElementById('delete-modal-title');
const deleteModalText = document.getElementById('delete-modal-text');
const searchInput = document.getElementById('search-input');
const exportCsvBtn = document.getElementById('export-csv-btn');

let unsubscribe = null;
let itemToDelete = { type: null, id: null };
let allSignups = []; // To store all data for searching and exporting

// --- HELPER FUNCTIONS ---
function generateCouponCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let coupon = 'PALETTE-';
    for (let i = 0; i < 6; i++) {
        coupon += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return coupon;
}

async function generateCouponImage(couponCode, name) {
    // ... (rest of the image generation code remains the same)
}

// --- PUBLIC PAGE LOGIC ---
openFormBtn.addEventListener('click', () => {
    formIntro.classList.add('hidden');
    formContainer.classList.add('bg-black/50', 'backdrop-blur-sm', 'p-6');
    form.classList.remove('hidden');
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ... (form submission logic remains the same)
});

// --- ADMIN LOGIC ---
togglePasswordBtn.addEventListener('click', () => {
    // ... (password toggle logic remains the same)
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // ... (login logic remains the same)
});

logoutBtn.addEventListener('click', () => {
    // ... (logout logic remains the same)
});

function setupRealtimeListener() {
    const q = query(collection(db, 'signups'), orderBy('timestamp', 'desc'));
    unsubscribe = onSnapshot(q, (querySnapshot) => {
        allSignups = [];
        querySnapshot.forEach(doc => {
            allSignups.push({ id: doc.id, ...doc.data() });
        });
        renderDashboard(allSignups);
    });
}

function renderDashboard(signups) {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredSignups = signups.filter(signup => 
        signup.name.toLowerCase().includes(searchTerm) || 
        signup.phone.toLowerCase().includes(searchTerm)
    );

    const groupedSignups = new Map();
    let signupsToday = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    totalSignupsEl.textContent = allSignups.length;
    
    allSignups.forEach(data => {
        if (data.timestamp && data.timestamp.toDate() >= today) signupsToday++;
        if (data.phone) {
            if (!groupedSignups.has(data.phone)) {
                 groupedSignups.set(data.phone, []);
            }
        }
    });
    uniqueContactsEl.textContent = groupedSignups.size;
    signupsTodayEl.textContent = signupsToday;

    const displayGroupedSignups = new Map();
    filteredSignups.forEach(data => {
        if(data.phone) {
            if(!displayGroupedSignups.has(data.phone)) {
                displayGroupedSignups.set(data.phone, []);
            }
            displayGroupedSignups.get(data.phone).push(data);
        }
    });

    tableBody.innerHTML = ''; 
    cardsContainer.innerHTML = '';
    // ... (rest of the renderDashboard logic remains the same, using displayGroupedSignups)
}

function showDashboard() {
    // ... (showDashboard logic remains the same)
}

// --- NEW FEATURES ---
searchInput.addEventListener('input', () => {
    renderDashboard(allSignups);
});

exportCsvBtn.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Phone,Coupon Code,Used,Timestamp\r\n";

    allSignups.forEach(signup => {
        const date = signup.timestamp ? signup.timestamp.toDate().toLocaleString('en-IN') : 'N/A';
        const row = [signup.name, signup.phone, signup.couponCode, signup.used, `"${date}"`].join(",");
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "artevia_palette_signups.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Event listeners and initial page load logic remains the same
// ...
</script>
