// Application principale
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le stockage
    const storage = new LocalFileStorage();
    
    // Initialiser l'authentification
    initAuth(storage);
    
    // Initialiser les modules
    initPatients(storage);
    initAppointments(storage);
    initUI(storage);
    initActs(storage);
    initAccounting(storage);
    initLabWorks(storage);
    
    // Variables globales - DÉCLAREZ ICI SEULEMENT
    window.currentDayViewDate = new Date();
    
    // Références aux éléments AVEC VÉRIFICATION NULL
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const patientForm = document.getElementById('patientForm');
    const appointmentForm = document.getElementById('appointmentForm');
    
    // FORMULAIRE INTÉGRÉ - RÉFÉRENCES POUR LE CALCUL D'ÂGE
    const dateNaissanceInput = document.getElementById('date-naissance');
    const ageInput = document.getElementById('age');
    
    // Gestion des statuts
    const statusSelect = document.getElementById('statusSelect');
    const statusReasonGroup = document.getElementById('statusReasonGroup');
    const cancelStatusBtn = document.getElementById('cancelStatusBtn');
    const saveStatusBtn = document.getElementById('saveStatusBtn');
    
    // Gestion de l'édition de rendez-vous
    const cancelEditAppointmentBtn = document.getElementById('cancelEditAppointmentBtn');
    const saveEditAppointmentBtn = document.getElementById('saveEditAppointmentBtn');
    const closeEditAppointmentModalBtn = document.getElementById('closeEditAppointmentModalBtn');
    const closeAppointmentStatusModalBtn = document.getElementById('closeAppointmentStatusModalBtn');
    
    // Recherche
    const searchPatientInput = document.getElementById('searchPatientInput');
    const searchPatientBtn = document.getElementById('searchPatientBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    // Export
    const exportPatientPDF = document.getElementById('exportPatientPDF');
    const exportPatientExcel = document.getElementById('exportPatientExcel');
    const exportAllPatientsPDF = document.getElementById('exportAllPatientsPDF');
    const exportAllPatientsExcel = document.getElementById('exportAllPatientsExcel');
    
    // Contrôles du calendrier
    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    const todayBtn = document.getElementById('todayBtn');
    
    // Filtres
    const filterDate = document.getElementById('filterDate');
    const filterPatient = document.getElementById('filterPatient');
    const filterStatus = document.getElementById('filterStatus');
    const filterRoom = document.getElementById('filterRoom');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    // Page patient
    const backToPatientsListBtn = document.getElementById('backToPatientsListBtn');
    const editPatientFromPageBtn = document.getElementById('editPatientFromPageBtn');
    const addAppointmentFromPageBtn = document.getElementById('addAppointmentFromPageBtn');
    const deletePatientFromPageBtn = document.getElementById('deletePatientFromPageBtn');
    const exportPatientFromPageBtn = document.getElementById('exportPatientFromPageBtn');
    const viewPatientAppointmentsBtn = document.getElementById('viewPatientAppointmentsBtn');
    
    // Comptable
    const searchAccountingInput = document.getElementById('searchAccountingInput');
    const searchAccountingBtn = document.getElementById('searchAccountingBtn');
    const clearAccountingSearchBtn = document.getElementById('clearAccountingSearchBtn');
    const filterAccountingInvoice = document.getElementById('filterAccountingInvoice');
    const filterAccountingPatient = document.getElementById('filterAccountingPatient');
    const exportAccountingExcelBtn = document.getElementById('exportAccountingExcelBtn');
    const backToDashboardFromAccountingBtn = document.getElementById('backToDashboardFromAccountingBtn');
    
    // Initialisation
    updateDashboard();
    displayRecentPatients();
    displayAllPatients();
    updateCalendar();
    displayAppointmentsTable();
    populatePatientFilter();
    
    // Initialiser Lab Works
    initLabWorksEvents();
    updateLabWorkPatientSelect();
    
    // ============================================
    // FONCTION POUR CALCULER L'ÂGE
    // ============================================
    function calculateAgeFromBirthDate(birthDate, ageInputElement) {
        if (!birthDate) return 0;
        
        const birth = new Date(birthDate);
        const today = new Date();
        
        if (isNaN(birth.getTime())) {
            console.error('Date de naissance invalide:', birthDate);
            return 0;
        }
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        // Ajuster si l'anniversaire n'est pas encore passé cette année
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        // Mettre à jour le champ âge
        if (ageInputElement) {
            ageInputElement.value = age;
        }
        
        return age;
    }
    
    // ============================================
    // CALCUL AUTOMATIQUE DE L'ÂGE
    // ============================================
    if (dateNaissanceInput && ageInput) {
        dateNaissanceInput.addEventListener('change', function() {
            calculateAgeFromBirthDate(this.value, ageInput);
        });
        
        // Définir une date par défaut et calculer l'âge au chargement
        setTimeout(() => {
            if (!dateNaissanceInput.value) {
                const today = new Date();
                const defaultBirthDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
                dateNaissanceInput.value = defaultBirthDate.toISOString().split('T')[0];
                calculateAgeFromBirthDate(dateNaissanceInput.value, ageInput);
            }
        }, 500);
    }
    
    // ============================================
    // ÉVÉNEMENTS EXISTANTS
    // ============================================
    
    // Attacher les événements du formulaire patient AVEC VÉRIFICATION
    if (patientForm) {
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!window.storage) return;
            
            // Recalculer l'âge avant soumission
            const dateNaissanceValue = document.getElementById('date-naissance')?.value;
            const ageField = document.getElementById('age');
            
            if (dateNaissanceValue && ageField) {
                calculateAgeFromBirthDate(dateNaissanceValue, ageField);
            }
            
            // Appeler la fonction de soumission originale
            handlePatientFormSubmit(e);
        });
    }
    
    // Attacher l'événement du formulaire de rendez-vous AVEC VÉRIFICATION
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentFormSubmit);
    }
    
    // Gestion de l'édition de rendez-vous AVEC VÉRIFICATION
    if (saveEditAppointmentBtn) {
        saveEditAppointmentBtn.addEventListener('click', handleEditAppointmentSave);
    }
    
    if (cancelEditAppointmentBtn) {
        cancelEditAppointmentBtn.addEventListener('click', closeEditAppointmentModal);
    }
    
    if (closeEditAppointmentModalBtn) {
        closeEditAppointmentModalBtn.addEventListener('click', closeEditAppointmentModal);
    }
    
    // Gestion du statut des rendez-vous AVEC VÉRIFICATION
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            const status = this.value;
            if (status === 'Annulé' || status === 'Absent') {
                if (statusReasonGroup) statusReasonGroup.style.display = 'block';
            } else {
                if (statusReasonGroup) statusReasonGroup.style.display = 'none';
            }
        });
    }
    
    if (saveStatusBtn) {
        saveStatusBtn.addEventListener('click', function() {
            const appointmentId = parseInt(document.getElementById('statusAppointmentId')?.value || 0);
            const status = document.getElementById('statusSelect')?.value;
            const reason = document.getElementById('statusReason')?.value;
            
            if (window.storage?.updateAppointmentStatus(appointmentId, status, reason)) {
                alert(`Statut du rendez-vous mis à jour : ${status}`);
                closeAppointmentStatusModal();
                updateCalendar();
                displayAppointmentsTable();
                updateDashboard();
            }
        });
    }
    
    if (cancelStatusBtn) {
        cancelStatusBtn.addEventListener('click', closeAppointmentStatusModal);
    }
    
    if (closeAppointmentStatusModalBtn) {
        closeAppointmentStatusModalBtn.addEventListener('click', closeAppointmentStatusModal);
    }
    
    // Navigation des onglets de la page patient AVEC VÉRIFICATION
    document.querySelectorAll('.patient-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            activateTab(tabName);
        });
    });
    
    // Retour à la liste des patients AVEC VÉRIFICATION
    if (backToPatientsListBtn) {
        backToPatientsListBtn.addEventListener('click', showPatientsList);
    }
    
    // Éditer le patient depuis la page AVEC VÉRIFICATION
    if (editPatientFromPageBtn) {
        editPatientFromPageBtn.addEventListener('click', function() {
            if (typeof currentPatientPageId !== 'undefined' && currentPatientPageId) {
                openEditPatientModal(currentPatientPageId);
            }
        });
    }
    
    // Ajouter un rendez-vous depuis la page AVEC VÉRIFICATION
    if (addAppointmentFromPageBtn) {
        addAppointmentFromPageBtn.addEventListener('click', function() {
            if (typeof currentPatientPageId !== 'undefined' && currentPatientPageId) {
                openAppointmentModal(null, null, null, currentPatientPageId);
            }
        });
    }
    
    // Supprimer le patient depuis la page AVEC VÉRIFICATION
    if (deletePatientFromPageBtn) {
        deletePatientFromPageBtn.addEventListener('click', function() {
            if (typeof currentPatientPageId !== 'undefined' && currentPatientPageId) {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
                    window.storage.deletePatient(currentPatientPageId);
                    alert('Patient supprimé avec succès.');
                    showPatientsList();
                    updateDashboard();
                }
            }
        });
    }
    
    // Exporter en PDF depuis la page AVEC VÉRIFICATION
    if (exportPatientFromPageBtn) {
        exportPatientFromPageBtn.addEventListener('click', function() {
            exportToPDF(window.storage.getPatientById(currentPatientPageId));
        });
    }
    
    // Voir les rendez-vous du patient AVEC VÉRIFICATION
    if (viewPatientAppointmentsBtn) {
        viewPatientAppointmentsBtn.addEventListener('click', function() {
            if (typeof currentPatientPageId !== 'undefined' && currentPatientPageId) {
                activateTab('appointments');
            }
        });
    }
    
    // Recherche de patients AVEC VÉRIFICATION
    if (searchPatientBtn) {
        searchPatientBtn.addEventListener('click', function() {
            const query = searchPatientInput?.value?.trim() || '';
            displayAllPatients(query);
        });
    }
    
    if (searchPatientInput) {
        searchPatientInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                displayAllPatients(query);
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (searchPatientInput) searchPatientInput.value = '';
            displayAllPatients();
        });
    }
    
    // Export des données AVEC VÉRIFICATION
    if (exportPatientPDF) {
        exportPatientPDF.addEventListener('click', function() {
            exportToPDF();
        });
    }
    
    if (exportPatientExcel) {
        exportPatientExcel.addEventListener('click', function() {
            exportToExcel();
        });
    }
    
    if (exportAllPatientsPDF) {
        exportAllPatientsPDF.addEventListener('click', function() {
            exportToPDF(null);
        });
    }
    
    if (exportAllPatientsExcel) {
        exportAllPatientsExcel.addEventListener('click', function() {
            exportToExcel(null);
        });
    }
    
    // Ajouter un utilisateur (admin seulement) AVEC VÉRIFICATION
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            if (!isAdmin()) {
                alert('Cette fonctionnalité est réservée aux administrateurs.');
                return;
            }
            
            const username = prompt('Nom d\'utilisateur:');
            if (!username) return;
            
            const password = prompt('Mot de passe:');
            if (!password) return;
            
            const fullName = prompt('Nom complet:');
            if (!fullName) return;
            
            const email = prompt('Email:');
            const role = confirm('Cet utilisateur est-il un administrateur ?') ? 'admin' : 'user';
            
            const newUser = window.storage.addUser({
                username,
                password,
                fullName,
                role,
                email: email || `${username}@cabinetdentaire.local`
            });
            
            if (newUser) {
                alert(`Utilisateur ${newUser.username} créé avec succès !`);
                displayUsersList();
            }
        });
    }
    
    // Contrôles du calendrier AVEC VÉRIFICATION
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', function() {
            window.currentDayViewDate.setDate(window.currentDayViewDate.getDate() - 1);
            updateCalendar();
        });
    }
    
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', function() {
            window.currentDayViewDate.setDate(window.currentDayViewDate.getDate() + 1);
            updateCalendar();
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', function() {
            window.currentDayViewDate = new Date();
            updateCalendar();
        });
    }
    
    // Filtres AVEC VÉRIFICATION
    if (filterDate) {
        filterDate.addEventListener('change', displayAppointmentsTable);
    }
    
    if (filterPatient) {
        filterPatient.addEventListener('change', displayAppointmentsTable);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', displayAppointmentsTable);
    }
    
    if (filterRoom) {
        filterRoom.addEventListener('change', displayAppointmentsTable);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            if (filterDate) filterDate.value = '';
            if (filterPatient) filterPatient.value = '';
            if (filterStatus) filterStatus.value = '';
            if (filterRoom) filterRoom.value = '';
            displayAppointmentsTable();
        });
    }
    
    // Événements de connexion/déconnexion AVEC VÉRIFICATION
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username')?.value;
            const password = document.getElementById('password')?.value;
            
            if (username && password) {
                login(username, password);
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // ============================================
    // GESTION COMPTABLE
    // ============================================
    
    // Recherche comptable
    if (searchAccountingBtn) {
        searchAccountingBtn.addEventListener('click', function() {
            const query = searchAccountingInput?.value?.trim() || '';
            const invoiceFilter = filterAccountingInvoice?.value || '';
            const patientFilter = filterAccountingPatient?.value || '';
            if (typeof displayAccountingTable === 'function') {
                displayAccountingTable(query, invoiceFilter, patientFilter);
            }
        });
    }
    
    if (searchAccountingInput) {
        searchAccountingInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                const invoiceFilter = filterAccountingInvoice?.value || '';
                const patientFilter = filterAccountingPatient?.value || '';
                if (typeof displayAccountingTable === 'function') {
                    displayAccountingTable(query, invoiceFilter, patientFilter);
                }
            }
        });
    }
    
    if (clearAccountingSearchBtn) {
        clearAccountingSearchBtn.addEventListener('click', function() {
            if (searchAccountingInput) searchAccountingInput.value = '';
            if (filterAccountingInvoice) filterAccountingInvoice.value = '';
            if (filterAccountingPatient) filterAccountingPatient.value = '';
            if (typeof displayAccountingTable === 'function') {
                displayAccountingTable();
            }
        });
    }
    
    if (filterAccountingInvoice) {
        filterAccountingInvoice.addEventListener('change', function() {
            const query = searchAccountingInput?.value?.trim() || '';
            const invoiceFilter = this.value;
            const patientFilter = filterAccountingPatient?.value || '';
            if (typeof displayAccountingTable === 'function') {
                displayAccountingTable(query, invoiceFilter, patientFilter);
            }
        });
    }
    
    if (filterAccountingPatient) {
        filterAccountingPatient.addEventListener('change', function() {
            const query = searchAccountingInput?.value?.trim() || '';
            const invoiceFilter = filterAccountingInvoice?.value || '';
            const patientFilter = this.value;
            if (typeof displayAccountingTable === 'function') {
                displayAccountingTable(query, invoiceFilter, patientFilter);
            }
        });
    }
    
    // Export Excel comptable
    if (exportAccountingExcelBtn) {
        exportAccountingExcelBtn.addEventListener('click', function() {
            if (typeof exportAccountingToExcel === 'function') {
                exportAccountingToExcel();
            }
        });
    }
    
    // Retour au dashboard depuis comptable
    if (backToDashboardFromAccountingBtn) {
        backToDashboardFromAccountingBtn.addEventListener('click', showDashboard);
    }
    
    // ============================================
    // NAVIGATION
    // ============================================
    
    // Fonction pour attacher un événement seulement si l'élément existe
    function safeAddEventListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    }
    
    // Attacher tous les événements de navigation
    safeAddEventListener('openPatientsCardBtn', 'click', openPatientFormModal);
    safeAddEventListener('closeModalBtn', 'click', closePatientFormModal);
    safeAddEventListener('addPatientFromListBtn', 'click', openPatientFormModal);
    safeAddEventListener('viewAllPatientsBtn', 'click', showPatientsList);
    safeAddEventListener('patientsTab', 'click', showPatientsList);
    safeAddEventListener('appointmentsTab', 'click', showAppointments);
    safeAddEventListener('accountingTab', 'click', showAccounting);
    safeAddEventListener('labWorksTab', 'click', showLabWorks);
    safeAddEventListener('dashboardTab', 'click', showDashboard);
    safeAddEventListener('usersTab', 'click', showUsers);
    safeAddEventListener('backToDashboardBtn', 'click', showDashboard);
    safeAddEventListener('backToDashboardFromAppointmentsBtn', 'click', showDashboard);
    safeAddEventListener('backToDashboardFromUsersBtn', 'click', showDashboard);
    safeAddEventListener('backToDashboardFromLabWorksBtn', 'click', showDashboard);
    safeAddEventListener('newAppointmentBtn', 'click', () => openAppointmentModal());
    safeAddEventListener('addAppointmentBtn', 'click', () => openAppointmentModal());
    safeAddEventListener('viewAppointmentsBtn', 'click', showAppointments);
    safeAddEventListener('viewAccountingBtn', 'click', showAccounting);
    safeAddEventListener('cancelAppointmentBtn', 'click', closeAppointmentModal);
    safeAddEventListener('closeAppointmentModalBtn', 'click', closeAppointmentModal);
    
    // Toggle du formulaire des phases AVEC VÉRIFICATION
    const addPhaseFormToggle = document.getElementById('addPhaseFormToggle');
    if (addPhaseFormToggle) {
        addPhaseFormToggle.addEventListener('click', function() {
            const form = document.getElementById('addPhaseForm');
            if (form) {
                if (form.style.display === 'none') {
                    form.style.display = 'block';
                    this.innerHTML = '<i class="fas fa-minus"></i> Masquer le formulaire';
                } else {
                    form.style.display = 'none';
                    this.innerHTML = '<i class="fas fa-plus"></i> Nouvelle phase';
                }
            }
        });
    }
    
    // Toggle du formulaire des paiements AVEC VÉRIFICATION
    const addPaymentFormToggle = document.getElementById('addPaymentFormToggle');
    if (addPaymentFormToggle) {
        addPaymentFormToggle.addEventListener('click', function() {
            const form = document.getElementById('addPaymentForm');
            if (form) {
                if (form.style.display === 'none') {
                    form.style.display = 'block';
                    this.innerHTML = '<i class="fas fa-minus"></i> Masquer le formulaire';
                } else {
                    form.style.display = 'none';
                    this.innerHTML = '<i class="fas fa-plus"></i> Nouveau paiement';
                }
            }
        });
    }
    
    // Fermer les modals en cliquant à l'extérieur AVEC VÉRIFICATION
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('patientModal')) {
            closePatientFormModal();
        }
        if (event.target === document.getElementById('appointmentModal')) {
            closeAppointmentModal();
        }
        if (event.target === document.getElementById('appointmentStatusModal')) {
            closeAppointmentStatusModal();
        }
        if (event.target === document.getElementById('editAppointmentModal')) {
            closeEditAppointmentModal();
        }
        if (event.target === document.getElementById('labWorkModal')) {
            closeLabWorkModal();
        }
        const viewPhaseImagesModal = document.getElementById('viewPhaseImagesModal');
        if (event.target === viewPhaseImagesModal && viewPhaseImagesModal) {
            viewPhaseImagesModal.remove();
        }
    });
    
    // Mettre à jour les créneaux horaires quand la date ou la salle change AVEC VÉRIFICATION
    const appointmentDateInput = document.getElementById('appointmentDate');
    const appointmentRoomSelect = document.getElementById('appointmentRoom');
    const appointmentDurationSelect = document.getElementById('appointmentDuration');
    
    if (appointmentDateInput) {
        appointmentDateInput.addEventListener('change', function() {
            updateTimeSlots(
                this.value,
                appointmentRoomSelect?.value,
                parseInt(appointmentDurationSelect?.value || 60)
            );
        });
    }
    
    if (appointmentRoomSelect) {
        appointmentRoomSelect.addEventListener('change', function() {
            updateTimeSlots(
                appointmentDateInput?.value,
                this.value,
                parseInt(appointmentDurationSelect?.value || 60)
            );
        });
    }
    
    if (appointmentDurationSelect) {
        appointmentDurationSelect.addEventListener('change', function() {
            updateTimeSlots(
                appointmentDateInput?.value,
                appointmentRoomSelect?.value,
                parseInt(this.value || 60)
            );
        });
    }
    
    // Réinitialiser le formulaire patient AVEC VÉRIFICATION
    const formResetBtn = document.getElementById('formResetBtn');
    if (formResetBtn && patientForm) {
        formResetBtn.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir réinitialiser le formulaire?')) {
                patientForm.reset();
                const today = new Date().toISOString().split('T')[0];
                const premiereConsultationInput = document.getElementById('premiere-consultation');
                if (premiereConsultationInput) premiereConsultationInput.value = today;
                
                const allInputs = patientForm.querySelectorAll('input, select, textarea');
                allInputs.forEach(input => {
                    input.style.borderColor = '#d0ddec';
                    input.style.boxShadow = 'none';
                });
                
                // Réinitialiser les menus déroulants des antécédents
                const antecedents = [
                    'allergies', 'maladies-cardiaques', 'hypertension', 'diabete',
                    'troubles-coagulation', 'maladies-infectieuses', 'traitement-cours', 'grossesse'
                ];
                
                antecedents.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.value = '';
                });
                
                const antecedentsDetails = document.getElementById('antecedents-details');
                if (antecedentsDetails) antecedentsDetails.value = '';
                
                // Réinitialiser les menus déroulants des habitudes
                const habitudes = ['tabac', 'alcool', 'cafe-the', 'niveau-stress', 'sommeil'];
                habitudes.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.value = '';
                });
                
                // Définir une date de naissance par défaut et calculer l'âge
                setTimeout(() => {
                    if (dateNaissanceInput && ageInput) {
                        const today = new Date();
                        const defaultBirthDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
                        dateNaissanceInput.value = defaultBirthDate.toISOString().split('T')[0];
                        calculateAgeFromBirthDate(dateNaissanceInput.value, ageInput);
                    }
                }, 100);
            }
        });
    }
    
    // Initialiser le carousel d'images pour les phases de traitement
    function initImageCarousel() {
        // Les fonctions sont déjà définies dans acts.js
        // Cette fonction est juste pour la compatibilité
    }
    
    // Appeler l'initialisation du carousel
    initImageCarousel();
});