// Gestion de l'authentification

// Variables globales
let currentUser = null;
// NOTE: 'storage' sera défini via initAuth()

// Initialiser l'authentification
function initAuth(storageInstance) {
    window.storage = storageInstance; // Stockage global
    
    // Vérifier si une session existe déjà
    const savedSession = window.storage.getSession();
    if (savedSession) {
        currentUser = savedSession;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        updateUserInterface();
        return true;
    }
    return false;
}

// Fonction de connexion
function login(username, password) {
    if (!window.storage) return null;
    
    const user = window.storage.authenticate(username, password);
    
    if (user) {
        currentUser = user;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        updateUserInterface();
        return user;
    } else {
        document.getElementById('loginError').style.display = 'block';
        return null;
    }
}

// Fonction de déconnexion
function logout() {
    if (!window.storage) return;
    
    window.storage.clearSession();
    currentUser = null;
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginForm').reset();
}

// Mettre à jour l'interface utilisateur
function updateUserInterface() {
    if (!currentUser) return;
    
    document.getElementById('sidebarUserName').textContent = currentUser.fullName;
    document.getElementById('sidebarUserRole').textContent = currentUser.role === 'admin' ? 'Administrateur' : 'Utilisateur';
    document.getElementById('topbarUserName').textContent = currentUser.fullName;
    document.getElementById('topbarUserRole').textContent = currentUser.role === 'admin' ? 'Administrateur' : 'Utilisateur';
    
    const initials = currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('topbarUserAvatar').textContent = initials;
    
    const adminElements = document.querySelectorAll('.admin-only');
    if (currentUser.role === 'admin') {
        adminElements.forEach(el => el.style.display = 'flex');
    } else {
        adminElements.forEach(el => el.style.display = 'none');
    }
}

// Obtenir l'utilisateur actuel
function getCurrentUser() {
    return currentUser;
}

// Vérifier si l'utilisateur est administrateur
function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}