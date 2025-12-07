// --- DATA (Avec Coordonnées GPS) ---
const items = [
  { 
    id: 1, 
    title: "Rolex Submariner", 
    desc: "Montre de luxe authentique. Remise en main propre obligatoire.",
    city: "Paris 8e",
    lat: 48.866, lng: 2.312, // Champs-Élysées
    category: "luxe", price: 150, likes: 42, user: "Stan M.", 
    userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    isSafeZone: true, 
    img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=500&q=80" 
  },
  { 
    id: 2, 
    title: "Robe Soirée (3j)", 
    desc: "Robe de créateur portée une fois. Taille 38.",
    city: "Lyon",
    lat: 45.764, lng: 4.835,
    category: "mode", price: 40, likes: 128, user: "Sophie L.", 
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    isSafeZone: false, 
    img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=80" 
  },
  { id: 3, title: "Canon EOS R6", desc: "Boîtier nu + 50mm.", city: "Paris", lat: 48.856, lng: 2.352, category: "tech", price: 45, likes: 15, user: "Stan M.", isSafeZone: true, img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80" },
  { id: 4, title: "Sac Gucci", desc: "Modèle Dionysus.", city: "Bordeaux", lat: 44.837, lng: -0.579, category: "luxe", price: 65, likes: 89, user: "Clara M.", isSafeZone: true, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80" },
  { id: 5, title: "Drone DJI Mini", desc: "Pack Fly More.", city: "Marseille", lat: 43.296, lng: 5.369, category: "tech", price: 30, likes: 33, user: "Marc D.", isSafeZone: false, img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=500&q=80" },
];

let map; // Variable pour la carte

let itemsData = JSON.parse(localStorage.getItem('rentSphere_items')) || items;
let favorites = JSON.parse(localStorage.getItem('rentSphere_favs')) || [];

function saveData() {
    localStorage.setItem('rentSphere_items', JSON.stringify(itemsData));
    localStorage.setItem('rentSphere_favs', JSON.stringify(favorites));
}

let currentDetailId = null;
let currentDailyPrice = 0;

// --- NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + pageId).style.display = 'block';
    
    const indexMap = { 'home':0, 'search':1, 'chat':2, 'profile':3 };
    if(indexMap[pageId] !== undefined) document.querySelectorAll('.nav-link')[indexMap[pageId]].classList.add('active');

    if(pageId === 'home') renderGrid(itemsData, 'products-grid');
    if(pageId === 'search') renderGrid(itemsData, 'search-results');
    if(pageId === 'profile') renderFavorites();
}
function goBack() { showPage('home'); }

// --- RENDER ---
function renderGrid(data, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if(data.length === 0) { container.innerHTML = '<p style="text-align:center; color:gray; width:100%;">Aucun résultat.</p>'; return; }

    data.forEach(item => {
        const isFav = favorites.includes(item.id);
        const heartClass = isFav ? 'liked' : '';
        const heartIcon = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const safeIcon = item.isSafeZone ? '<i class="fa-solid fa-shield-cat safe-icon-card"></i>' : '';

        const div = document.createElement('div');
        div.className = 'card';
        div.onclick = (e) => { if(!e.target.closest('.like-overlay') && !e.target.closest('.btn-card-action')) openProductPage(item.id); };

        div.innerHTML = `
            <div class="card-img-wrap">
                <div class="like-overlay ${heartClass}" onclick="toggleLike(event, ${item.id})">
                    <i class="${heartIcon}"></i> <span>${item.likes || 0}</span>
                </div>
                <img src="${item.img}" class="card-img">
            </div>
            <div class="card-info">
                <div class="card-header">
                    <h3 class="card-title">${item.title} ${safeIcon}</h3>
                    <div class="card-price">${item.price}€</div>
                </div>
                <button class="btn-card-action" onclick="openBookingFromCard(event, '${item.title}', ${item.price}, ${item.isSafeZone})">Réserver</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// --- PRODUCT DETAIL & MAP ---
function openProductPage(id) {
    const item = itemsData.find(i => i.id === id);
    if(!item) return;
    currentDetailId = item.id;

    document.getElementById('detail-img').src = item.img;
    document.getElementById('detail-title').innerText = item.title;
    document.getElementById('detail-price').innerText = item.price + "€ /jour";
    document.getElementById('detail-city').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${item.city}`;
    document.getElementById('detail-cat').innerText = item.category.toUpperCase();
    document.getElementById('detail-desc').innerText = item.desc || "Pas de description.";
    document.getElementById('detail-user').innerText = item.user;
    
    if(item.userAvatar) document.getElementById('detail-avatar').style.backgroundImage = `url('${item.userAvatar}')`;
    else document.getElementById('detail-avatar').style.backgroundColor = "#ccc";

    document.getElementById('detail-safe-alert').style.display = item.isSafeZone ? 'flex' : 'none';
    
    showPage('product');

    // INITIALISATION CARTE LEAFLET
    // On attend un tout petit peu que la page soit affichée
    setTimeout(() => {
        // Si une carte existe déjà, on la supprime pour en refaire une propre
        if (map) {
            map.remove();
            map = null;
        }

        // Coordonnées par défaut (Paris) si l'item n'en a pas
        const lat = item.lat || 48.8566;
        const lng = item.lng || 2.3522;

        // Création de la carte
        map = L.map('map').setView([lat, lng], 13);

        // Ajout des tuiles (le fond de carte OpenStreetMap)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Ajout du marqueur
        L.marker([lat, lng]).addTo(map)
            .bindPopup(item.isSafeZone ? "<b>Safe Zone</b><br>Commissariat" : "<b>Lieu de RDV</b><br>" + item.city)
            .openPopup();
    }, 100);
}

function openBookingFromDetail() {
    const item = itemsData.find(i => i.id === currentDetailId);
    openBooking(item.title, item.price, item.isSafeZone);
}
function openBookingFromCard(e, title, price, isSafe) {
    e.stopPropagation();
    openBooking(title, price, isSafe);
}

// --- CALC & BOOKING ---
function calculateTotal() {
    const startInput = document.getElementById('start-date').value;
    const endInput = document.getElementById('end-date').value;
    const fees = 5;
    if (startInput && endInput) {
        const start = new Date(startInput);
        const end = new Date(endInput);
        const timeDiff = end - start;
        let days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        if (days < 1) days = 1;
        const total = (days * currentDailyPrice) + fees;
        document.getElementById('total-days').innerText = days + " jour(s)";
        document.getElementById('final-total').innerText = total + "€";
    }
}

function openBooking(title, price, isSafe) {
    currentDailyPrice = price;
    document.getElementById('price-per-day').innerText = price + "€";
    document.getElementById('total-days').innerText = "-";
    document.getElementById('final-total').innerText = "-";
    document.getElementById('start-date').value = "";
    document.getElementById('end-date').value = "";
    document.getElementById('modal-safe-msg').style.display = isSafe ? 'flex' : 'none';
    document.getElementById('modal-booking').style.display = 'block';
}

// --- UPLOAD & POST ---
function previewImage() {
    const fileInput = document.getElementById('post-file');
    const preview = document.getElementById('preview-img');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = "block";
        }
        reader.readAsDataURL(file);
    }
}

function submitAd() {
    const title = document.getElementById('post-title').value;
    const city = document.getElementById('post-city').value || "Paris";
    const price = document.getElementById('post-price').value;
    const cat = document.getElementById('post-cat').value;
    const fileInput = document.getElementById('post-file');
    const file = fileInput.files[0];

    if(!title || !price) return alert("Infos manquantes !");

    const createItem = (imgSrc) => {
        const isSafe = (cat === 'luxe');
        const newItem = { 
            id: Date.now(), 
            title: title, 
            desc: "Ajouté depuis l'application.",
            city: city, 
            lat: 48.8566, lng: 2.3522, // Par défaut Paris pour les nouvelles annonces
            category: cat, 
            price: parseInt(price), 
            likes: 0,
            user: "Stan M.", 
            userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
            isSafeZone: isSafe,
            img: imgSrc
        };
        itemsData.unshift(newItem);
        saveData();
        closeModal('modal-post'); 
        showPage('home');
    };

    if (file) {
        if (file.size > 2000000) return alert("Image trop lourde !");
        const reader = new FileReader();
        reader.onload = function(e) { createItem(e.target.result); };
        reader.readAsDataURL(file);
    } else {
        createItem("