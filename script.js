// --- DATA (Avec GPS) ---
const defaultItems = [
  { id: 1, title: "Rolex Submariner", desc: "Montre authentique. Remise en main propre.", city: "Paris 8e", lat: 48.866, lng: 2.312, category: "luxe", price: 150, likes: 42, user: "Stan M.", userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80", isSafeZone: true, img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=500&q=80" },
  { id: 2, title: "Robe Soirée (3j)", desc: "Robe de créateur. Taille 38.", city: "Lyon", lat: 45.764, lng: 4.835, category: "mode", price: 40, likes: 128, user: "Sophie L.", userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", isSafeZone: false, img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=80" },
  { id: 3, title: "Canon EOS R6", desc: "Boîtier nu + 50mm.", city: "Paris", lat: 48.856, lng: 2.352, category: "tech", price: 45, likes: 15, user: "Stan M.", isSafeZone: true, img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80" },
  { id: 4, title: "Sac Gucci", desc: "Modèle Dionysus.", city: "Bordeaux", lat: 44.837, lng: -0.579, category: "luxe", price: 65, likes: 89, user: "Clara M.", isSafeZone: true, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80" },
  { id: 5, title: "Drone DJI Mini", desc: "Pack Fly More.", city: "Marseille", lat: 43.296, lng: 5.369, category: "tech", price: 30, likes: 33, user: "Marc D.", isSafeZone: false, img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=500&q=80" },
];

let items = JSON.parse(localStorage.getItem('rentSphere_items')) || defaultItems;
let favorites = JSON.parse(localStorage.getItem('rentSphere_favs')) || [];

function saveData() {
    localStorage.setItem('rentSphere_items', JSON.stringify(items));
    localStorage.setItem('rentSphere_favs', JSON.stringify(favorites));
}

let currentDetailId = null;
let currentDailyPrice = 0;
let map;

// --- NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + pageId).style.display = 'block';
    
    const indexMap = { 'home':0, 'search':1, 'chat':2, 'profile':3 };
    if(indexMap[pageId] !== undefined) document.querySelectorAll('.nav-link')[indexMap[pageId]].classList.add('active');

    if(pageId === 'home') renderGrid(items, 'products-grid');
    if(pageId === 'search') renderGrid(items, 'search-results');
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
    const item = items.find(i => i.id === id);
    if(!item) return;
    currentDetailId = item.id;

    document.getElementById('detail-img').src = item.img;
    document.getElementById('detail-title').innerText = item.title;
    document.getElementById('detail-price').innerText = item.price + "€ /jour";
    document.getElementById('detail-city').innerText = item.city;
    document.getElementById('detail-cat').innerText = item.category.toUpperCase();
    document.getElementById('detail-desc').innerText = item.desc || "Pas de description.";
    document.getElementById('detail-user').innerText = item.user;
    
    if(item.userAvatar) document.getElementById('detail-avatar').style.backgroundImage = `url('${item.userAvatar}')`;
    else document.getElementById('detail-avatar').style.backgroundColor = "#ccc";

    document.getElementById('detail-safe-alert').style.display = item.isSafeZone ? 'flex' : 'none';
    showPage('product');

    // INITIALISER LA CARTE
    setTimeout(() => {
        if (map) { map.remove(); map = null; }
        
        const lat = item.lat || 48.8566;
        const lng = item.lng || 2.3522;

        map = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        L.marker([lat, lng]).addTo(map)
            .bindPopup(item.isSafeZone ? "<b>Safe Zone</b><br>Commissariat" : "<b>Lieu de RDV</b><br>" + item.city)
            .openPopup();
    }, 200);
}

function openBookingFromDetail() {
    const item = items.find(i => i.id === currentDetailId);
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
    const price = document.getElementById('post-price').value;
    const cat = document.getElementById('post-cat').value;
    const city = document.getElementById('post-city').value || "Paris";
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
            lat: 48.8566, lng: 2.3522, // Par défaut Paris
            category: cat, 
            price: parseInt(price), 
            likes: 0,
            user: "Stan M.", 
            userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
            isSafeZone: isSafe,
            img: imgSrc
        };
        items.unshift(newItem);
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
        createItem("https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=500&q=80");
    }
}

// --- UTILS ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    let newTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    icon.className = newTheme === 'light' ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
}
function confirmPayment() { alert("Paiement validé !"); closeModal('modal-booking'); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openCharter() { document.getElementById('modal-charter').style.display = 'block'; }
function goToPostForm() { closeModal('modal-charter'); document.getElementById('modal-post').style.display = 'block'; }
function filterItems(cat) { 
    document.querySelectorAll('.chip').forEach(b => b.classList.remove('active')); event.target.classList.add('active'); 
    const filtered = cat === 'all' ? items : items.filter(i => i.category === cat); 
    renderGrid(filtered, 'products-grid'); 
}
function switchTab(tab) { 
    document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active')); event.target.classList.add('active'); 
    document.getElementById('tab-reviews').style.display = tab === 'reviews' ? 'block' : 'none'; 
    document.getElementById('tab-favs').style.display = tab === 'favs' ? 'block' : 'none'; 
    if(tab === 'favs') renderFavorites(); 
}
function toggleLike(e, id) { e.stopPropagation(); const item = items.find(i => i.id === id); if(favorites.includes(id)) { favorites = favorites.filter(f => f !== id); item.likes--; } else { favorites.push(id); item.likes++; } saveData(); const active = document.querySelector('.page-section[style*="block"]').id; if(active === 'page-home') renderGrid(items, 'products-grid'); if(active === 'page-profile') renderFavorites(); if(active === 'page-search') renderGrid(items, 'search-results'); }
function renderFavorites() { const favItems = items.filter(i => favorites.includes(i.id)); const container = document.getElementById('favorites-grid'); if(favItems.length === 0) container.innerHTML = '<p style="text-align:center; color:gray; width:100%;">Aucun favori.</p>'; else renderGrid(favItems, 'favorites-grid'); }
const reviews = [{ author: "Julie M.", text: "Transaction parfaite.", stars: 5 }, { author: "Thomas L.", text: "Matériel top.", stars: 5 }];
const reviewList = document.getElementById('reviews-list'); if(reviewList) { reviewList.innerHTML = ''; reviews.forEach(rev => { reviewList.innerHTML += `<div style="border-bottom:1px solid var(--border); padding:15px 0;"><div style="font-weight:500; margin-bottom:5px;">${rev.author} ⭐${rev.stars}</div><div style="color:var(--text-dim); font-size:14px;">"${rev.text}"</div></div>`; }); }
window.onclick = function(e) { if(e.target.classList.contains('modal-backdrop')) e.target.style.display = "none"; }
setTimeout(() => { document.getElementById('notif-dot').style.display = 'block'; document.getElementById('new-msg').style.display = 'flex'; }, 3000);
function readMessage() { document.getElementById('notif-dot').style.display = 'none'; document.getElementById('new-msg').style.background = 'transparent'; document.querySelector('.unread-circle').style.display = 'none'; }

// INIT
renderGrid(items, 'products-grid');