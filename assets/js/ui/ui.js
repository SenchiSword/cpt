// Gestion de l'interface utilisateur

// NOTE: 'storage' sera défini via initUI()

// Initialiser l'interface utilisateur
function initUI(storageInstance) {
    window.storage = storageInstance; // Stockage global
}

// Fonction pour exporter les données en PDF (simulé)
function exportToPDF(patient = null) {
    alert('Fonction d\'export PDF - Cette fonctionnalité nécessite une bibliothèque externe comme jsPDF.');
    // Implémentation réelle nécessiterait jsPDF: https://github.com/parallax/jsPDF
}

// Fonction pour exporter les données en Excel (simulé)
function exportToExcel(patient = null) {
    alert('Fonction d\'export Excel - Cette fonctionnalité nécessite une bibliothèque externe comme SheetJS.');
    // Implémentation réelle nécessiterait SheetJS: https://github.com/SheetJS/sheetjs
}

// Mettre à jour le tableau de bord
function updateDashboard() {
    if (!window.storage) return;
    
    const patients = window.storage.getPatients();
    document.getElementById('totalPatients').textContent = patients.length;
    
    const today = new Date().toISOString().split('T')[0];
    const appointmentsToday = window.storage.getAppointments().filter(a => a.date === today && a.status === 'Confirmé').length;
    document.getElementById('todayAppointments').textContent = appointmentsToday;
    
    const pendingInvoices = patients.filter(p => p.statut === 'En attente').length;
    document.getElementById('pendingInvoices').textContent = pendingInvoices;
    
    const evolution = patients.length > 5 ? '+12%' : '+0%';
    document.getElementById('activityStats').textContent = evolution;
}

// Navigation
function showDashboard() {
    document.getElementById('patientsListContent').style.display = 'none';
    document.getElementById('appointmentsContent').style.display = 'none';
    document.getElementById('accountingContent').style.display = 'none';
    document.getElementById('usersContent').style.display = 'none';
    document.getElementById('patientPage').style.display = 'none';
    document.getElementById('labWorksContent').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Tableau de bord';
    document.getElementById('pageSubtitle').textContent = 'Bienvenue dans votre espace de gestion';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById('dashboardTab').classList.add('active');
    
    if (typeof currentPatientPageId !== 'undefined') {
        currentPatientPageId = null;
    }
}

function showPatientsList() {
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('appointmentsContent').style.display = 'none';
    document.getElementById('accountingContent').style.display = 'none';
    document.getElementById('usersContent').style.display = 'none';
    document.getElementById('patientPage').style.display = 'none';
    document.getElementById('labWorksContent').style.display = 'none';
    document.getElementById('patientsListContent').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Liste des patients';
    document.getElementById('pageSubtitle').textContent = `Total: ${window.storage.getPatients().length} patient(s)`;
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById('patientsTab').classList.add('active');
    
    if (typeof currentPatientPageId !== 'undefined') {
        currentPatientPageId = null;
    }
    
    if (typeof displayAllPatients === 'function') displayAllPatients();
}

function showAppointments() {
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('patientsListContent').style.display = 'none';
    document.getElementById('accountingContent').style.display = 'none';
    document.getElementById('usersContent').style.display = 'none';
    document.getElementById('patientPage').style.display = 'none';
    document.getElementById('labWorksContent').style.display = 'none';
    document.getElementById('appointmentsContent').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Calendrier des rendez-vous';
    document.getElementById('pageSubtitle').textContent = 'Gérez les rendez-vous des patients';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById('appointmentsTab').classList.add('active');
    
    if (typeof currentPatientPageId !== 'undefined') {
        currentPatientPageId = null;
    }
    
    if (typeof updateCalendar === 'function') updateCalendar();
    if (typeof displayAppointmentsTable === 'function') displayAppointmentsTable();
}

function showAccounting() {
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('patientsListContent').style.display = 'none';
    document.getElementById('appointmentsContent').style.display = 'none';
    document.getElementById('usersContent').style.display = 'none';
    document.getElementById('patientPage').style.display = 'none';
    document.getElementById('labWorksContent').style.display = 'none';
    document.getElementById('accountingContent').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Gestion Comptable';
    document.getElementById('pageSubtitle').textContent = 'Gérez les factures et les paiements';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById('accountingTab').classList.add('active');
    
    if (typeof currentPatientPageId !== 'undefined') {
        currentPatientPageId = null;
    }
    
    if (typeof displayAccountingTable === 'function') displayAccountingTable();
    if (typeof populatePatientFilterForAccounting === 'function') populatePatientFilterForAccounting();
}

function showLabWorks() {
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('patientsListContent').style.display = 'none';
    document.getElementById('appointmentsContent').style.display = 'none';
    document.getElementById('accountingContent').style.display = 'none';
    document.getElementById('usersContent').style.display = 'none';
    document.getElementById('patientPage').style.display = 'none';
    document.getElementById('labWorksContent').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Travaux de Laboratoire';
    document.getElementById('pageSubtitle').textContent = 'Gérez les travaux de laboratoire';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById('labWorksTab').classList.add('active');
    
    if (typeof currentPatientPageId !== 'undefined') {
        currentPatientPageId = null;
    }
    
    if (typeof displayLabWorksTable === 'function') displayLabWorksTable();
}

function showUsers() {
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('patientsListContent').style.display = 'none';
    document.getElementById('appointmentsContent').style.display = 'none';
    document.getElementById('accountingContent').style.display = 'none';
    document.getElementById('patientPage').style.display = 'none';
    document.getElementById('labWorksContent').style.display = 'none';
    document.getElementById('usersContent').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Gestion des utilisateurs';
    document.getElementById('pageSubtitle').textContent = 'Gérez les accès à l\'application';
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById('usersTab').classList.add('active');
    
    if (typeof currentPatientPageId !== 'undefined') {
        currentPatientPageId = null;
    }
    
    if (typeof displayUsersList === 'function') displayUsersList();
}

// Afficher la liste des utilisateurs
function displayUsersList() {
    if (!window.storage) return;
    
    const container = document.getElementById('usersListContainer');
    const users = window.storage.getUsers();
    
    if (users.length === 0) {
        container.innerHTML = '<p>Aucun utilisateur trouvé.</p>';
        return;
    }
    
    const currentUser = getCurrentUser();
    
    let html = `
        <table class="patients-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom d'utilisateur</th>
                    <th>Nom complet</th>
                    <th>Rôle</th>
                    <th>Email</th>
                    <th>Dernière connexion</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const canDelete = user.id !== currentUser.id;
        
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.fullName}</td>
                <td><span class="status-badge ${user.role === 'admin' ? 'status-active' : 'status-pending'}">${user.role}</span></td>
                <td>${user.email}</td>
                <td>${user.lastLogin ? formatShortDate(user.lastLogin.split('T')[0]) : 'Jamais'}</td>
                <td class="actions-cell">
                    ${canDelete ? `<button class="btn btn-small btn-delete delete-user-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>` : '<span class="patient-id">Utilisateur actuel</span>'}
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = parseInt(this.getAttribute('data-id'));
            if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                if (window.storage.deleteUser(userId)) {
                    displayUsersList();
                    alert('Utilisateur supprimé avec succès.');
                }
            }
        });
    });
}