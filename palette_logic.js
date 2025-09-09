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
let allSignups = []; 

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
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const bg = new Image();
    bg.crossOrigin = "anonymous";
    bg.src = 'https://raw.githubusercontent.com/Sarup098/artevia/main/IMG_8306.JPG';
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = 'https://raw.githubusercontent.com/Sarup098/artevia/main/Artevia_Palette_Logo.png';
    await Promise.all([
        new Promise(resolve => bg.onload = resolve),
        new Promise(resolve => logo.onload = resolve)
    ]);
    
    const canvasAspect = canvas.width / canvas.height;
    const imgAspect = bg.width / bg.height;
    let newWidth, newHeight, newX, newY;
    if (imgAspect > canvasAspect) {
        newHeight = canvas.height;
        newWidth = bg.width * (newHeight / bg.height);
        newX = (canvas.width - newWidth) / 2;
        newY = 0;
    } else {
        newWidth = canvas.width;
        newHeight = bg.height * (newWidth / bg.width);
        newY = (canvas.height - newHeight) / 2;
        newX = 0;
    }
    ctx.drawImage(bg, newX, newY, newWidth, newHeight);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(logo, (canvas.width - 600) / 2, 100, 600, 200);
    ctx.font = 'bold 120px Lora, serif';
    ctx.fillStyle = '#FBBF24';
    ctx.textAlign = 'center';
    ctx.fillText('10% OFF', canvas.width / 2, 450);
    ctx.font = '40px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('On your first order above ₹399', canvas.width / 2, 520);
    
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 6;
    ctx.setLineDash([25, 15]);
    ctx.lineDashOffset = 0;
    ctx.beginPath();
    ctx.roundRect(140, 600, 800, 220, [20]);
    ctx.stroke();

    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, couponCode, {
        format: "CODE128",
        lineColor: "#FBBF24",
        background: "transparent",
        width: 4,
        height: 80,
        displayValue: false
    });
    ctx.drawImage(barcodeCanvas, (canvas.width - barcodeCanvas.width) / 2, 625);
    
    ctx.font = 'bold 50px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(couponCode, canvas.width / 2, 780);
    
    ctx.font = '30px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`This coupon is exclusively for ${name}`, canvas.width / 2, 880);
    const link = document.createElement('a');
    link.download = `ArteviaPalette-Coupon-${couponCode}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
}

function showLoading(isSubmitting) {
    submitButton.disabled = isSubmitting;
    submitButtonText.classList.toggle('hidden', isSubmitting);
    submitSpinner.classList.toggle('hidden', !isSubmitting);
}

// --- PUBLIC PAGE LOGIC ---
openFormBtn.addEventListener('click', () => {
    formIntro.classList.add('hidden');
    formContainer.classList.add('bg-black/50', 'backdrop-blur-sm', 'p-6');
    form.classList.remove('hidden');
});

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    formFeedback.textContent = '';
    const nameValue = nameInput.value.trim();
    const phoneValue = phoneInput.value.trim();
    if (nameValue === "") {
        formFeedback.textContent = 'Please enter your name.';
        formFeedback.style.color = '#FBBF24';
        return;
    }
    if (!/^\d{10}$/.test(phoneValue)) {
        formFeedback.textContent = 'Please enter a valid 10-digit phone number.';
        formFeedback.style.color = '#FBBF24';
        return;
    }
    
    showLoading(true);
    try {
        const q = query(collection(db, "signups"), where("phone", "==", phoneValue));
        const querySnapshot = await getDocs(q);
        let couponCode;
        let isNewUser = true;
        if (!querySnapshot.empty) {
            isNewUser = false;
            const originalDoc = querySnapshot.docs.sort((a,b) => a.data().timestamp - b.data().timestamp)[0];
            couponCode = originalDoc.data().couponCode;
        } else {
            couponCode = generateCouponCode();
        }
        if (isNewUser) {
            await addDoc(collection(db, "signups"), { name: nameValue, phone: phoneValue, couponCode: couponCode, used: false, timestamp: serverTimestamp() });
        } else {
            const existingNames = new Set(querySnapshot.docs.map(doc => doc.data().name.trim().toLowerCase()));
            if (!existingNames.has(nameValue.toLowerCase())) {
                 await addDoc(collection(db, "signups"), { name: nameValue, phone: phoneValue, couponCode: couponCode, used: false, timestamp: serverTimestamp() });
            }
        }
        formFeedback.innerHTML = `Success! Your code for 10% OFF on your first order above ₹399 is <strong class="text-yellow-400">${couponCode}</strong>.`;
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download Coupon';
        downloadButton.className = 'bg-yellow-500 text-black font-bold py-2 px-4 rounded-full text-xs mt-2 hover:bg-yellow-400';
        downloadButton.onclick = () => generateCouponImage(couponCode, nameValue);
        formFeedback.appendChild(document.createElement('br'));
        formFeedback.appendChild(downloadButton);
        form.reset();
        form.classList.add('hidden'); // Hide the form, but keep the success message
    } catch (error) {
        formFeedback.textContent = 'Oops! Something went wrong. Please try again.';
        formFeedback.style.color = '#EF4444';
        console.error("Error: ", error);
    } finally {
        showLoading(false);
    }
});

// --- ADMIN LOGIC ---
togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeOpen.classList.toggle('hidden', !isPassword);
    eyeClosed.classList.toggle('hidden', isPassword);
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPassword = passwordInput.value;
    let adminName = null;
    let adminRole = 'standard';
    if (enteredPassword === 'sarup@2004') { adminName = 'Sarup'; adminRole = 'super'; }
    else if (enteredPassword === 'sekhar@2002') adminName = 'Sekhar';
    else if (enteredPassword === 'anukriti') adminName = 'Anukriti';
    if (adminName) {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        sessionStorage.setItem('adminName', adminName);
        sessionStorage.setItem('adminRole', adminRole);
        showDashboard();
    } else {
        loginError.textContent = 'Incorrect password.';
        passwordInput.value = '';
    }
});

logoutBtn.addEventListener('click', () => {
     sessionStorage.clear();
     if (unsubscribe) unsubscribe();
     window.location.hash = '';
     window.location.reload();
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
            if (!groupedSignups.has(data.phone)) groupedSignups.set(data.phone, []);
        }
    });
    uniqueContactsEl.textContent = groupedSignups.size;
    signupsTodayEl.textContent = signupsToday;

    const displayGroupedSignups = new Map();
    filteredSignups.forEach(data => {
        if(data.phone) {
            if(!displayGroupedSignups.has(data.phone)) displayGroupedSignups.set(data.phone, []);
            displayGroupedSignups.get(data.phone).push(data);
        }
    });

    tableBody.innerHTML = ''; 
    cardsContainer.innerHTML = '';
    if (displayGroupedSignups.size === 0) {
        const emptyMessage = '<tr><td colspan="6" class="text-center p-6 text-gray-500">No matching sign-ups found.</td></tr>';
        tableBody.innerHTML = emptyMessage;
        cardsContainer.innerHTML = `<p class="text-center p-6 text-gray-500">No matching sign-ups found.</p>`;
        return;
    }
    const adminName = sessionStorage.getItem('adminName') || 'The Team';
    const adminRole = sessionStorage.getItem('adminRole');
    const deleteGroupBtn = (phone) => adminRole === 'super' ? `<button class="delete-btn text-red-500 hover:text-red-700 text-xs font-semibold" data-phone="${phone}">Delete All</button>` : '';
    const deleteSingleBtn = (id) => adminRole === 'super' ? `<button class="delete-single-btn text-red-500 hover:text-red-700" data-doc-id="${id}"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>` : '';

    displayGroupedSignups.forEach((entries, phone) => {
        const primaryEntry = entries[0]; 
        const date = primaryEntry.timestamp ? primaryEntry.timestamp.toDate().toLocaleString('en-IN') : 'N/A';
        const whatsappMessage = encodeURIComponent(`Hello ${primaryEntry.name}! This is ${adminName} from Artevia Palette. Thanks for signing up! Your discount code is ${primaryEntry.couponCode}. We're excited to see you soon.`);
        const whatsappLink = `https://wa.me/91${primaryEntry.phone}?text=${whatsappMessage}`;
        const uniqueNames = new Set(entries.map(e => e.name.trim().toLowerCase()));
        const isExpandable = entries.length > 1 && uniqueNames.size > 1;

        let tableHtml = `<tr ${isExpandable ? `class="cursor-pointer" data-toggle-id="desktop-${phone}"` : ''}>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">${primaryEntry.name} ${isExpandable ? `<span class="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">+ ${entries.length - 1} more</span>` : ''}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${primaryEntry.phone}</td>
            <td class="px-6 py-4 text-sm text-gray-700 font-mono">${primaryEntry.couponCode || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${date}</td>
            <td class="px-6 py-4 text-sm"><div class="relative inline-block w-10 mr-2 align-middle select-none"><input type="checkbox" id="toggle-${primaryEntry.id}" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${primaryEntry.used ? 'checked' : ''} data-doc-id="${primaryEntry.id}"/><label for="toggle-${primaryEntry.id}" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label></div></td>
            <td class="px-6 py-4 text-sm"><div class="flex items-center gap-4"><a href="${whatsappLink}" target="_blank" class="text-green-600 hover:text-green-800">Chat</a> ${deleteGroupBtn(phone)}</div></td>
        </tr>`;
        if (isExpandable) {
            for (let i = 1; i < entries.length; i++) {
                const entry = entries[i];
                tableHtml += `<tr class="hidden bg-gray-50" data-details-for="desktop-${phone}">
                    <td class="pl-12 py-3 text-sm text-gray-700 flex items-center justify-between">${entry.name} ${deleteSingleBtn(entry.id)}</td><td></td>
                    <td class="px-6 py-3 text-sm text-gray-700 font-mono">${entry.couponCode}</td>
                    <td class="px-6 py-3 text-sm text-gray-500">${entry.timestamp.toDate().toLocaleString('en-IN')}</td>
                    <td class="px-6 py-3 text-center"><input type="checkbox" class="toggle-checkbox-sub" ${entry.used ? 'checked' : ''} data-doc-id="${entry.id}"></td><td></td>
                </tr>`;
            }
        }
        tableBody.innerHTML += tableHtml;

        let cardHtml = `<div class="bg-white p-4 rounded-lg shadow-md">
            <div class="flex justify-between items-start">
                <div><p class="font-bold text-gray-900">${primaryEntry.name}</p><p class="text-sm text-gray-500">${primaryEntry.phone}</p></div>
                <div class="flex items-center gap-3">${deleteGroupBtn(phone)} <a href="${whatsappLink}" target="_blank" class="text-green-600">Chat</a></div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                <div><p class="text-xs text-gray-500">Coupon: <span class="font-mono text-gray-700">${primaryEntry.couponCode || 'N/A'}</span></p><p class="text-xs text-gray-500">Date: <span class="text-gray-700">${date}</span></p></div>
                <div class="relative inline-block w-10 align-middle select-none"><input type="checkbox" id="toggle-mobile-${primaryEntry.id}" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${primaryEntry.used ? 'checked' : ''} data-doc-id="${primaryEntry.id}"/><label for="toggle-mobile-${primaryEntry.id}" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label></div>
            </div>`;
        if (isExpandable) {
            let subEntriesHtml = `<div class="hidden mt-3 pt-3 border-t border-gray-200 space-y-2" data-details-for="mobile-${phone}">`;
            for (let i = 1; i < entries.length; i++) {
                const entry = entries[i];
                subEntriesHtml += `<div class="text-xs flex justify-between items-center">
                    <div><p class="text-gray-800 font-semibold">${entry.name}</p><p class="text-gray-500">Coupon: <span class="font-mono">${entry.couponCode}</span></p></div>
                    ${deleteSingleBtn(entry.id)}
                </div>`;
            }
            subEntriesHtml += `</div>`;
            cardHtml += subEntriesHtml;
            cardHtml += `<button class="text-xs text-blue-600 font-semibold mt-2" data-toggle-id="mobile-${phone}">View ${entries.length - 1} more</button>`;
        }
        cardHtml += `</div>`;
        cardsContainer.innerHTML += cardHtml;
    });
}


function showDashboard() {
    mainContent.classList.add('hidden');
    adminSection.classList.remove('hidden');
    loginModal.classList.add('hidden');
    dashboard.classList.remove('hidden');
    setupRealtimeListener();
}

dashboard.addEventListener('change', async (e) => {
    if (e.target.matches('.toggle-checkbox, .toggle-checkbox-sub')) {
        const docId = e.target.dataset.docId;
        const isUsed = e.target.checked;
        try {
            await updateDoc(doc(db, 'signups', docId), { used: isUsed });
        } catch (error) {
            console.error("Error updating doc: ", error);
            e.target.checked = !isUsed;
        }
    }
});

dashboard.addEventListener('click', (e) => {
    const deleteGroupButton = e.target.closest('.delete-btn');
    const deleteSingleButton = e.target.closest('.delete-single-btn');
    if (deleteGroupButton) {
        itemToDelete = { type: 'group', id: deleteGroupButton.dataset.phone };
        deleteModalTitle.textContent = 'Delete Contact Group?';
        deleteModalText.textContent = `This will permanently delete all entries for this phone number. This action cannot be undone.`;
        deleteConfirmModal.classList.remove('hidden');
    } else if (deleteSingleButton) {
        itemToDelete = { type: 'single', id: deleteSingleButton.dataset.docId };
        deleteModalTitle.textContent = 'Delete This Entry?';
        deleteModalText.textContent = `This will permanently delete this single sign-up. This action cannot be undone.`;
        deleteConfirmModal.classList.remove('hidden');
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteConfirmModal.classList.add('hidden');
    itemToDelete = { type: null, id: null };
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!itemToDelete.id) return;
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';
    try {
        if (itemToDelete.type === 'group') {
            const q = query(collection(db, "signups"), where("phone", "==", itemToDelete.id));
            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
            await Promise.all(deletePromises);
        } else if (itemToDelete.type === 'single') {
            await deleteDoc(doc(db, 'signups', itemToDelete.id));
        }
    } catch (error) {
        console.error("Error deleting documents: ", error);
    } finally {
        deleteConfirmModal.classList.add('hidden');
        itemToDelete = { type: null, id: null };
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Delete';
    }
});

tableBody.addEventListener('click', (e) => {
    const headerRow = e.target.closest('tr[data-toggle-id]');
    if (headerRow) {
        const toggleId = headerRow.dataset.toggleId;
        document.querySelectorAll(`tr[data-details-for="${toggleId}"]`).forEach(row => row.classList.toggle('hidden'));
    }
});

cardsContainer.addEventListener('click', (e) => {
    const toggleButton = e.target.closest('button[data-toggle-id]');
    if (toggleButton) {
        const toggleId = toggleButton.dataset.toggleId;
        const detailsDiv = document.querySelector(`div[data-details-for="${toggleId}"]`);
        detailsDiv.classList.toggle('hidden');
        toggleButton.textContent = detailsDiv.classList.contains('hidden') ? `View ${detailsDiv.children.length} more` : 'Hide details';
    }
});

function checkAdminRoute() {
    if (window.location.hash === '#admin') {
        mainContent.classList.add('hidden');
        adminSection.classList.remove('hidden');
        if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
            showDashboard();
        } else {
            loginModal.classList.remove('hidden');
        }
    } else {
        mainContent.classList.remove('hidden');
        adminSection.classList.add('hidden');
    }
}

window.addEventListener('DOMContentLoaded', checkAdminRoute);
window.addEventListener('hashchange', checkAdminRoute);


