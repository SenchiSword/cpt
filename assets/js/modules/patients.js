// Gestion des patients

// Variables globales
let isEditingPatient = false;
let currentEditingPatientId = null;
let currentPatientPageId = null;
// NOTE: 'storage' sera défini via initPatients()

// Fonction pour formater la date en format français (jj/mm/aaaa)
function formatFrenchDate(dateString) {
    if (!dateString) return 'Non renseigné';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// Fonction pour calculer l'âge à partir de la date de naissance
function calculateAgeFromBirthDate(birthDateString) {
    if (!birthDateString) return 0;
    
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) return 0;
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Fonction pour vérifier si un patient est inactif (pas de RDV depuis 180 jours)
function isPatientInactive(patientId) {
    if (!window.storage) return false;
    
    const appointments = window.storage.getAppointmentsByPatient(patientId);
    
    if (appointments.length === 0) {
        // Si le patient n'a jamais eu de rendez-vous
        const patient = window.storage.getPatientById(patientId);
        if (patient && patient.dateAjout) {
            const dateAjout = new Date(patient.dateAjout);
            const today = new Date();
            const diffTime = Math.abs(today - dateAjout);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 180;
        }
        return false;
    }
    
    // Trier les rendez-vous par date (du plus récent au plus ancien)
    const sortedAppointments = appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastAppointment = sortedAppointments[0];
    
    if (!lastAppointment || !lastAppointment.date) return false;
    
    const lastAppointmentDate = new Date(lastAppointment.date);
    const today = new Date();
    const diffTime = Math.abs(today - lastAppointmentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 180;
}

// Fonction pour obtenir le statut d'un patient (actif ou inactif)
function getPatientStatus(patientId) {
    if (!window.storage) return 'Actif';
    
    const patient = window.storage.getPatientById(patientId);
    if (!patient) return 'Actif';
    
    // Vérifier le statut stocké
    const storedStatus = patient.statut;
    
    // Si le statut est déjà "Inactif", le garder
    if (storedStatus === 'Inactif') return 'Inactif';
    
    // Vérifier si le patient est inactif selon la règle des 180 jours
    if (isPatientInactive(patientId)) {
        // Mettre à jour le statut dans la base de données
        const updatedPatient = {
            ...patient,
            statut: 'Inactif'
        };
        window.storage.updatePatient(updatedPatient);
        return 'Inactif';
    }
    
    // Si le patient a un statut "En attente" ou autre, le garder
    if (storedStatus && storedStatus !== 'Actif') {
        return storedStatus;
    }
    
    return 'Actif';
}

// Initialiser la gestion des patients
function initPatients(storageInstance) {
    window.storage = storageInstance; // Stockage global
}

// Fonction de soumission du formulaire patient
function handlePatientFormSubmit(e) {
    e.preventDefault();
    e.stopImmediatePropagation(); // Empêche d'autres écouteurs
    
    if (!window.storage) return;
    
    const submitFormBtn = document.getElementById('submitFormBtn');
    const patientForm = document.getElementById('patientForm');
    const formInputs = patientForm.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    formInputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#e74c3c';
            input.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
        } else {
            input.style.borderColor = '#d0ddec';
            input.style.boxShadow = 'none';
        }
    });
    
    if (!document.getElementById('consentement').checked) {
        alert('Veuillez accepter les conditions de traitement des données.');
        return;
    }
    
    if (isValid) {
        submitFormBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
        submitFormBtn.disabled = true;
        
        setTimeout(() => {
            // Calculer l'âge dynamiquement à partir de la date de naissance
            const dateNaissance = document.getElementById('date-naissance').value;
            const ageCalcule = calculateAgeFromBirthDate(dateNaissance);
            
            const patientData = {
                id: isEditingPatient ? currentEditingPatientId : getNextPatientId(window.storage),
                prenom: document.getElementById('prenom').value,
                nom: document.getElementById('nom').value,
                cinPasseport: document.getElementById('cin_passeport').value,
                age: ageCalcule, // Utiliser l'âge calculé
                dateNaissance: dateNaissance,
                situation: document.getElementById('situation').value,
                telephone: document.getElementById('telephone').value,
                email: document.getElementById('email').value,
                adresse: document.getElementById('adresse').value,
                profession: document.getElementById('profession').value,
                motif: document.getElementById('motif').value,
                dentsConcernees: document.getElementById('dents-concernees').value || '',
                premiereConsultation: document.getElementById('premiere-consultation').value,
                contactUrgenceNom: document.getElementById('contact-urgence-nom').value,
                lienParente: document.getElementById('lien-parente').value,
                telUrgence: document.getElementById('tel-urgence').value,
                notes: document.getElementById('notes').value,
                tabac: isEditingPatient ? document.getElementById('tabac').value : '',
                alcool: isEditingPatient ? document.getElementById('alcool').value : '',
                cafeThe: isEditingPatient ? document.getElementById('cafe-the').value : '',
                niveauStress: isEditingPatient ? document.getElementById('niveau-stress').value : '',
                sommeil: isEditingPatient ? document.getElementById('sommeil').value : '',
                // Nouveaux champs pour les antécédents médicaux
                allergies: isEditingPatient ? document.getElementById('allergies').value : '',
                maladiesCardiaques: isEditingPatient ? document.getElementById('maladies-cardiaques').value : '',
                hypertension: isEditingPatient ? document.getElementById('hypertension').value : '',
                diabete: isEditingPatient ? document.getElementById('diabete').value : '',
                troublesCoagulation: isEditingPatient ? document.getElementById('troubles-coagulation').value : '',
                maladiesInfectieuses: isEditingPatient ? document.getElementById('maladies-infectieuses').value : '',
                traitementCours: isEditingPatient ? document.getElementById('traitement-cours').value : '',
                grossesse: isEditingPatient ? document.getElementById('grossesse').value : '',
                antecedentsDetails: isEditingPatient ? document.getElementById('antecedents-details').value : '',
                dateAjout: isEditingPatient ? window.storage.getPatientById(currentEditingPatientId).dateAjout : new Date().toISOString().split('T')[0],
                statut: 'Actif' // Toujours créer les patients avec statut "Actif"
            };
            
            if (isEditingPatient) {
                // Pour l'édition, garder le statut existant s'il existe
                if (currentEditingPatientId) {
                    const existingPatient = window.storage.getPatientById(currentEditingPatientId);
                    if (existingPatient && existingPatient.statut) {
                        patientData.statut = existingPatient.statut;
                    }
                }
                window.storage.updatePatient(patientData);
                alert(`Patient ${patientData.prenom} ${patientData.nom} mis à jour avec succès !\nCIN/Passeport: ${patientData.cinPasseport}`);
            } else {
                window.storage.addPatient(patientData);
                alert(`Patient ${patientData.prenom} ${patientData.nom} ajouté avec succès !\nID: ${formatPatientIdForDisplay(patientData.id)}\nCIN/Passeport: ${patientData.cinPasseport}`);
            }
            
            submitFormBtn.innerHTML = isEditingPatient ? 
                '<i class="fas fa-save"></i> Mettre à jour le patient' : 
                '<i class="fas fa-save"></i> Enregistrer le nouveau patient';
            submitFormBtn.disabled = false;
            
            closePatientFormModal();
            patientForm.reset();
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('premiere-consultation').value = today;
            
            // Réinitialiser les menus déroulants
            document.getElementById('tabac').value = '';
            document.getElementById('alcool').value = '';
            document.getElementById('cafe-the').value = '';
            document.getElementById('niveau-stress').value = '';
            document.getElementById('sommeil').value = '';
            
            // Réinitialiser les menus déroulants des antécédents
            document.getElementById('allergies').value = '';
            document.getElementById('maladies-cardiaques').value = '';
            document.getElementById('hypertension').value = '';
            document.getElementById('diabete').value = '';
            document.getElementById('troubles-coagulation').value = '';
            document.getElementById('maladies-infectieuses').value = '';
            document.getElementById('traitement-cours').value = '';
            document.getElementById('grossesse').value = '';
            document.getElementById('antecedents-details').value = '';
            
            // Mettre à jour l'interface
            if (typeof updateDashboard === 'function') updateDashboard();
            if (typeof displayRecentPatients === 'function') displayRecentPatients();
            if (typeof displayAllPatients === 'function') displayAllPatients();
            
            if (document.getElementById('patientsListContent').style.display !== 'none') {
                if (typeof showPatientsList === 'function') showPatientsList();
            }
            
            // Si on est sur la page patient, la mettre à jour
            if (currentPatientPageId && currentPatientPageId === patientData.id) {
                if (typeof showPatientPage === 'function') showPatientPage(patientData.id);
            }
        }, 1000);
    } else {
        alert('Veuillez remplir tous les champs obligatoires (marqués d\'un *).');
    }
}

// Fonction pour afficher la page patient avec onglets
function showPatientPage(patientId) {
    if (!window.storage) return;
    
    const patient = window.storage.getPatientById(patientId);
    if (!patient) return;
    
    currentPatientPageId = patientId;
    
    // Masquer les autres contenus
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('patientsListContent').style.display = 'none';
    document.getElementById('appointmentsContent').style.display = 'none';
    document.getElementById('accountingContent').style.display = 'none';
    document.getElementById('usersContent').style.display = 'none';
    document.getElementById('patientPage').style.display = 'block';
    
    // Mettre à jour le titre de la page
    document.getElementById('pageTitle').textContent = 'Fiche Patient';
    document.getElementById('pageSubtitle').textContent = 'Gestion complète du patient';
    
    // Calculer l'âge dynamiquement
    const ageCalcule = calculateAgeFromBirthDate(patient.dateNaissance);
    
    // Obtenir le statut du patient (actif/inactif)
    const patientStatus = getPatientStatus(patientId);
    
    // Mettre à jour l'en-tête avec les modifications demandées
    const initials = (patient.prenom ? patient.prenom[0] : '') + (patient.nom ? patient.nom[0] : '');
    document.getElementById('patientPageAvatar').textContent = initials.toUpperCase();
    document.getElementById('patientPageName').textContent = `${patient.prenom} ${patient.nom}`;
    document.getElementById('patientPageId').textContent = formatPatientIdForDisplay(patient.id);
    
    // Remplacer "Profession" par "Date de naissance" + "Âge" côte à côte
    document.getElementById('patientPageProfession').innerHTML = `
        <div class="birthdate-age-container">
            <div class="birthdate-item">
                <i class="fas fa-birthday-cake"></i>
                <span>${formatFrenchDate(patient.dateNaissance)}</span>
            </div>
            <div class="birthdate-age-separator"></div>
            <div class="age-item">
                <i class="fas fa-user-clock"></i>
                <span>${ageCalcule} ans</span>
            </div>
        </div>
    `;
    
    document.getElementById('patientPageStatus').textContent = patientStatus;
    
    // MODIFICATION: Ajouter la ligne d'informations supplémentaires sous l'ID avec email sous l'adresse
    const infoLine = `
        <div class="patient-info-line">
            <div class="info-item-small">
                <i class="fas fa-home"></i>
                <span>${patient.adresse || 'Adresse non renseignée'}</span>
            </div>
            ${patient.email ? `
            <div class="info-item-small">
                <i class="fas fa-envelope"></i>
                <span>${patient.email}</span>
            </div>` : ''}
            <div class="info-item-small">
                <i class="fas fa-phone"></i>
                <span>${patient.telephone}</span>
            </div>
        </div>
    `;
    
    // Insérer la ligne d'informations après l'ID
    const idElement = document.getElementById('patientPageId');
    if (idElement.nextElementSibling && idElement.nextElementSibling.classList.contains('patient-info-line')) {
        idElement.nextElementSibling.remove();
    }
    idElement.insertAdjacentHTML('afterend', infoLine);
    
    // Mettre à jour la dernière visite
    const appointments = window.storage.getAppointmentsByPatient(patientId);
    const lastAppointment = appointments
        .filter(a => a.status === 'Terminé')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (lastAppointment) {
        document.getElementById('patientPageLastVisit').textContent = 
            `Dernière visite: ${formatShortDate(lastAppointment.date)}`;
    } else {
        document.getElementById('patientPageLastVisit').textContent = 'Aucune visite';
    }
    
    // Charger le contenu de l'onglet Informations
    loadPatientInformations(patient, ageCalcule, patientStatus);
    
    // Charger les actes du patient
    if (typeof loadPatientActs === 'function') {
        loadPatientActs(patientId);
    }
    
    // Activer l'onglet Informations par défaut
    activateTab('informations');
}

// Fonction pour charger les informations du patient
function loadPatientInformations(patient, ageCalculated, patientStatus) {
    let html = `
        <div class="patient-info-form photo-layout">
            <!-- Section principale - Informations personnelles -->
            <div class="personal-info-section">
                <!-- Colonne gauche -->
                <div class="info-column-left">
                    <!-- Bloc Informations personnelles -->
                    <div class="info-block">
                        <div class="info-block-header">
                            <i class="fas fa-user-circle"></i>
                            <h3>Informations personnelles</h3>
                        </div>
                        <div class="info-grid-two-col">
                            <div class="info-item">
                                <div class="info-label">CIN / Passeport</div>
                                <div class="info-value">${patient.cinPasseport || 'Non renseigné'}</div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-label">Âge</div>
                                <div class="info-value">${ageCalculated} ans</div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-label">Date de naissance</div>
                                <div class="info-value">${formatFrenchDate(patient.dateNaissance)}</div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-label">Situation familiale</div>
                                <div class="info-value">${patient.situation || 'Non renseigné'}</div>
                            </div>
                        </div>
                        
                        <div class="info-separator"></div>
                        
                        <div class="info-item">
                            <div class="info-label">Profession</div>
                            <div class="info-value">${patient.profession || 'Non renseigné'}</div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">Statut</div>
                            <div class="info-value">
                                <span class="status-badge status-${patientStatus.toLowerCase()}">${patientStatus}</span>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">Date inscription</div>
                                <div class="info-value">${formatFrenchDate(patient.dateAjout)}</div>
                        </div>
                    </div>
                    
                    <!-- Bloc Contact d'urgence -->
                    <div class="info-block">
                        <div class="info-block-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Contact d'urgence</h3>
                        </div>
                        <div class="info-grid-one-col">
                            <div class="info-item">
                                <div class="info-label">Nom et prénom</div>
                                <div class="info-value">${patient.contactUrgenceNom || 'Non renseigné'}</div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-label">Lien de parenté</div>
                                <div class="info-value">${patient.lienParente || 'Non renseigné'}</div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-label">Téléphone d'urgence</div>
                                <div class="info-value">${patient.telUrgence || 'Non renseigné'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Colonne droite -->
                <div class="info-column-right">
                    <!-- Bloc Informations de contact -->
                    <div class="info-block">
                        <div class="info-block-header">
                            <i class="fas fa-address-card"></i>
                            <h3>Informations de contact</h3>
                        </div>
                        <div class="info-grid-one-col">
                            <div class="info-item">
                                <div class="info-label">Téléphone</div>
                                <div class="info-value">${patient.telephone}</div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-label">Adresse</div>
                                <div class="info-value">${patient.adresse}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bloc Motif de consultation -->
                    <div class="info-block">
                        <div class="info-block-header">
                            <i class="fas fa-notes-medical"></i>
                            <h3>Motif de consultation</h3>
                        </div>
                        <div class="info-grid-one-col">
                            <div class="info-item">
                                <div class="info-label">Raison de consultation</div>
                                <div class="info-value">${patient.motif}</div>
                            </div>
                            
                            ${patient.dentsConcernees ? `
                            <div class="info-item">
                                <div class="info-label">Dents concernées</div>
                                <div class="info-value">${patient.dentsConcernees}</div>
                            </div>` : ''}
                            
                            <div class="info-item">
                                <div class="info-label">Date 1ère consultation</div>
                                <div class="info-value">${formatFrenchDate(patient.premiereConsultation)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bloc Dernière visite -->
                    <div class="info-block">
                        <div class="info-block-header">
                            <i class="fas fa-calendar-check"></i>
                            <h3>Dernière activité</h3>
                        </div>
                        <div class="info-grid-one-col">
                            <div class="info-item">
                                <div class="info-label">Dernier rendez-vous</div>
                                <div class="info-value">${getLastAppointmentInfo(patient.id)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;
    
    // Ajouter les habitudes de vie si elles existent (VERSION COMPACTE)
    if (patient.tabac || patient.alcool || patient.cafeThe || patient.niveauStress || patient.sommeil) {
        html += `
            <!-- Bloc Habitudes de vie (version compacte) -->
            <div class="info-block habits-info-block compact">
                <div class="info-block-header">
                    <i class="fas fa-heartbeat"></i>
                    <h3>Habitudes de vie</h3>
                </div>
                <div class="habits-grid-compact">
                    ${patient.tabac ? `
                    <div class="habit-item-compact">
                        <div class="habit-label-compact">Tabac</div>
                        <div class="habit-value-compact">${patient.tabac}</div>
                    </div>` : ''}
                    
                    ${patient.alcool ? `
                    <div class="habit-item-compact">
                        <div class="habit-label-compact">Alcool</div>
                        <div class="habit-value-compact">${patient.alcool}</div>
                    </div>` : ''}
                    
                    ${patient.cafeThe ? `
                    <div class="habit-item-compact">
                        <div class="habit-label-compact">Café/Thé</div>
                        <div class="habit-value-compact">${patient.cafeThe}</div>
                    </div>` : ''}
                    
                    ${patient.niveauStress ? `
                    <div class="habit-item-compact">
                        <div class="habit-label-compact">Stress</div>
                        <div class="habit-value-compact">${patient.niveauStress}</div>
                    </div>` : ''}
                    
                    ${patient.sommeil ? `
                    <div class="habit-item-compact">
                        <div class="habit-label-compact">Sommeil</div>
                        <div class="habit-value-compact">${patient.sommeil}</div>
                    </div>` : ''}
                </div>
            </div>
        `;
    }
    
    // Ajouter les antécédents médicaux si ils existent (VERSION COMPACTE)
    const antecedentsItems = [];
    if (patient.allergies && patient.allergies !== '') antecedentsItems.push({ label: 'Allergies', value: patient.allergies });
    if (patient.maladiesCardiaques && patient.maladiesCardiaques !== '') antecedentsItems.push({ label: 'Maladies cardiaques', value: patient.maladiesCardiaques });
    if (patient.hypertension && patient.hypertension !== '') antecedentsItems.push({ label: 'Hypertension artérielle', value: patient.hypertension });
    if (patient.diabete && patient.diabete !== '') antecedentsItems.push({ label: 'Diabète', value: patient.diabete });
    if (patient.troublesCoagulation && patient.troublesCoagulation !== '') antecedentsItems.push({ label: 'Troubles de coagulation', value: patient.troublesCoagulation });
    if (patient.maladiesInfectieuses && patient.maladiesInfectieuses !== '') antecedentsItems.push({ label: 'Maladies infectieuses', value: patient.maladiesInfectieuses });
    if (patient.traitementCours && patient.traitementCours !== '') antecedentsItems.push({ label: 'Traitement médical en cours', value: patient.traitementCours });
    if (patient.grossesse && patient.grossesse !== '' && patient.grossesse !== 'Non applicable') antecedentsItems.push({ label: 'Grossesse', value: patient.grossesse });

    if (antecedentsItems.length > 0 || patient.antecedentsDetails) {
        html += `
            <!-- Bloc Antécédents médicaux (version compacte) -->
            <div class="info-block habits-info-block compact">
                <div class="info-block-header">
                    <i class="fas fa-file-medical"></i>
                    <h3>Antécédents médicaux</h3>
                </div>
        `;
        
        if (antecedentsItems.length > 0) {
            html += `
                <div class="habits-grid-compact">
            `;
            
            antecedentsItems.forEach(item => {
                html += `
                    <div class="habit-item-compact">
                        <div class="habit-label-compact">${item.label}</div>
                        <div class="habit-value-compact ${getAntecedentValueClass(item.value)}">${item.value}</div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        if (patient.antecedentsDetails) {
            html += `
                <div style="margin-top: 15px;">
                    <div class="info-label" style="margin-bottom: 8px; font-size: 11px;">Détails des antécédents</div>
                    <div class="info-value" style="background-color: #f9fbff; border: 1px solid #e1e9f5; border-radius: 6px; padding: 10px; font-size: 12px; color: #444; line-height: 1.5;">
                        ${patient.antecedentsDetails.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
    }
    
    // Ajouter les notes si elles existent
    if (patient.notes) {
        html += `
            <!-- Bloc Notes supplémentaires -->
            <div class="info-block notes-info-block">
                <div class="info-block-header">
                    <i class="fas fa-sticky-note"></i>
                    <h3>Notes supplémentaires</h3>
                </div>
                <div class="info-value">
                    ${patient.notes.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }
    
    html += `</div>`; // Fermer patient-info-form
    
    document.getElementById('informationsContent').innerHTML = html;
}

// Fonction pour obtenir les informations du dernier rendez-vous - CORRIGÉE
function getLastAppointmentInfo(patientId) {
    if (!window.storage) return 'Aucun rendez-vous';
    
    const appointments = window.storage.getAppointmentsByPatient(patientId);
    
    if (appointments.length === 0) {
        return 'Aucun rendez-vous';
    }
    
    // Trier les rendez-vous par date (du plus récent au plus ancien)
    const sortedAppointments = appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastAppointment = sortedAppointments[0];
    
    if (!lastAppointment) return 'Aucun rendez-vous';
    
    const lastDate = new Date(lastAppointment.date);
    const today = new Date();
    
    // Vérifier que la date n'est pas dans le futur
    if (lastDate > today) {
        // Si le rendez-vous est dans le futur, chercher le dernier rendez-vous passé
        const pastAppointments = appointments.filter(a => {
            const appointmentDate = new Date(a.date);
            return appointmentDate <= today;
        });
        
        if (pastAppointments.length === 0) {
            return 'Premier RDV à venir';
        }
        
        const lastPastAppointment = pastAppointments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (!lastPastAppointment) return 'Aucun RDV passé';
        
        const lastPastDate = new Date(lastPastAppointment.date);
        const diffTime = Math.abs(today - lastPastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return `${formatShortDate(lastPastAppointment.date)} (il y a ${diffDays} jours)`;
    }
    
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${formatShortDate(lastAppointment.date)} (il y a ${diffDays} jours)`;
}

// Fonction utilitaire pour les icônes des antécédents
function getAntecedentIcon(label) {
    const icons = {
        'Allergies': 'allergies',
        'Maladies cardiaques': 'heartbeat',
        'Hypertension artérielle': 'tachometer-alt',
        'Diabète': 'syringe',
        'Troubles de coagulation': 'tint',
        'Maladies infectieuses': 'virus',
        'Traitement médical en cours': 'pills',
        'Grossesse': 'baby'
    };
    return icons[label] || 'stethoscope';
}

// Fonction pour la classe CSS selon la valeur
function getAntecedentValueClass(value) {
    if (value === 'Oui') return 'antecedent-yes';
    if (value === 'Non') return 'antecedent-no';
    return '';
}

// Fonction pour activer un onglet
function activateTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.patient-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Masquer tous les contenus
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    const tabElement = document.querySelector(`.patient-tab[data-tab="${tabName}"]`);
    const contentElement = document.getElementById(`${tabName}Tab`);
    
    if (tabElement) tabElement.classList.add('active');
    if (contentElement) contentElement.classList.add('active');
    
    // Si on active l'onglet Acts, charger les actes
    if (tabName === 'acts' && typeof currentPatientPageId !== 'undefined' && currentPatientPageId) {
        if (typeof loadPatientActs === 'function') {
            loadPatientActs(currentPatientPageId);
        }
    }
}

// Fonction pour ouvrir le modal de formulaire patient
function openPatientFormModal() {
    isEditingPatient = false;
    currentEditingPatientId = null;
    
    document.getElementById('modalTitle').textContent = 'Formulaire de consultation - Nouveau patient';
    document.getElementById('formHeaderTitle').textContent = 'Formulaire de consultation - Informations complètes';
    document.getElementById('submitButtonText').textContent = 'Enregistrer le nouveau patient';
    
    // Masquer les sections des habitudes de vie et antécédents
    document.getElementById('habitsSection').style.display = 'none';
    document.getElementById('antecedentsSection').style.display = 'none';
    
    document.getElementById('patientModal').style.display = 'flex';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('premiere-consultation').value = today;
    
    document.getElementById('patientForm').reset();
    document.getElementById('patientId').value = '';
    
    // Réinitialiser les menus déroulants
    document.getElementById('tabac').value = '';
    document.getElementById('alcool').value = '';
    document.getElementById('cafe-the').value = '';
    document.getElementById('niveau-stress').value = '';
    document.getElementById('sommeil').value = '';
    
    // Réinitialiser les menus déroulants des antécédents
    document.getElementById('allergies').value = '';
    document.getElementById('maladies-cardiaques').value = '';
    document.getElementById('hypertension').value = '';
    document.getElementById('diabete').value = '';
    document.getElementById('troubles-coagulation').value = '';
    document.getElementById('maladies-infectieuses').value = '';
    document.getElementById('traitement-cours').value = '';
    document.getElementById('grossesse').value = '';
    document.getElementById('antecedents-details').value = '';
    
    const allInputs = document.getElementById('patientForm').querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.style.borderColor = '#d0ddec';
        input.style.boxShadow = 'none';
    });
    
    // Définir une date de naissance par défaut et calculer l'âge
    setTimeout(() => {
        const dateNaissanceInput = document.getElementById('date-naissance');
        const ageInput = document.getElementById('age');
        
        if (dateNaissanceInput && ageInput) {
            const today = new Date();
            const defaultBirthDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
            dateNaissanceInput.value = defaultBirthDate.toISOString().split('T')[0];
            
            // Calculer l'âge automatiquement
            const ageCalcule = calculateAgeFromBirthDate(dateNaissanceInput.value);
            ageInput.value = ageCalcule;
        }
    }, 100);
}

// Fonction pour ouvrir le modal pour éditer un patient
function openEditPatientModal(patientId) {
    if (!window.storage) return;
    
    const patient = window.storage.getPatientById(patientId);
    if (!patient) return;
    
    isEditingPatient = true;
    currentEditingPatientId = patientId;
    
    document.getElementById('modalTitle').textContent = `Modification du patient - ${patient.prenom} ${patient.nom}`;
    document.getElementById('formHeaderTitle').textContent = `Modification des informations du patient`;
    document.getElementById('submitButtonText').textContent = 'Mettre à jour le patient';
    
    // Afficher les sections des habitudes de vie et antécédents
    document.getElementById('habitsSection').style.display = 'block';
    document.getElementById('antecedentsSection').style.display = 'block';
    
    // Calculer l'âge actuel
    const ageCalcule = calculateAgeFromBirthDate(patient.dateNaissance);
    
    // Remplir le formulaire avec les données du patient
    document.getElementById('patientId').value = patient.id;
    document.getElementById('prenom').value = patient.prenom || '';
    document.getElementById('nom').value = patient.nom || '';
    document.getElementById('cin_passeport').value = patient.cinPasseport || '';
    document.getElementById('age').value = ageCalcule || '';
    document.getElementById('date-naissance').value = patient.dateNaissance || '';
    document.getElementById('situation').value = patient.situation || '';
    document.getElementById('telephone').value = patient.telephone || '';
    document.getElementById('email').value = patient.email || '';
    document.getElementById('adresse').value = patient.adresse || '';
    document.getElementById('profession').value = patient.profession || '';
    document.getElementById('motif').value = patient.motif || '';
    document.getElementById('dents-concernees').value = patient.dentsConcernees || '';
    document.getElementById('premiere-consultation').value = patient.premiereConsultation || '';
    document.getElementById('contact-urgence-nom').value = patient.contactUrgenceNom || '';
    document.getElementById('lien-parente').value = patient.lienParente || '';
    document.getElementById('tel-urgence').value = patient.telUrgence || '';
    document.getElementById('notes').value = patient.notes || '';
    
    // Remplir les menus déroulants des habitudes
    const habitFields = ['tabac', 'alcool', 'cafe-the', 'niveau-stress', 'sommeil'];
    habitFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            // Convertir le nom du champ pour correspondre aux données patient
            const patientFieldName = field.replace('-', '');
            element.value = patient[patientFieldName] || '';
        }
    });
    
    // Remplir les menus déroulants des antécédents
    const antecedentFields = [
        'allergies', 'maladies-cardiaques', 'hypertension', 'diabete',
        'troubles-coagulation', 'maladies-infectieuses', 'traitement-cours', 'grossesse'
    ];
    
    antecedentFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            // Convertir le nom du champ pour correspondre aux données patient
            let patientFieldName = field.replace('-', '');
            // Cas spécial pour traitement-cours qui devient traitementCours
            if (field === 'traitement-cours') {
                patientFieldName = 'traitementCours';
            }
            element.value = patient[patientFieldName] || '';
        }
    });
    
    // Détails des antécédents
    const antecedentsDetailsElement = document.getElementById('antecedents-details');
    if (antecedentsDetailsElement) {
        antecedentsDetailsElement.value = patient.antecedentsDetails || '';
    }
    
    document.getElementById('patientModal').style.display = 'flex';
}

// Fonction pour fermer le modal de formulaire patient
function closePatientFormModal() {
    document.getElementById('patientModal').style.display = 'none';
}

// Fonction pour afficher tous les patients (avec recherche)
function displayAllPatients(searchQuery = '') {
    if (!window.storage) return;
    
    const container = document.getElementById('allPatientsContainer');
    let patients;
    
    if (searchQuery) {
        patients = window.storage.searchPatients(searchQuery);
    } else {
        patients = window.storage.getPatients();
    }
    
    if (patients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <h3>${searchQuery ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}</h3>
                <p>${searchQuery ? 'Essayez une autre recherche ou' : 'Commencez par ajouter votre premier patient en cliquant sur le bouton "Ajouter un patient".'}</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="patients-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>CIN/Passeport</th>
                    <th>Âge</th>
                    <th>Téléphone</th>
                    <th>Date d'inscription</th>
                    <th>Dernier RDV</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    patients.forEach(patient => {
        // Calculer l'âge dynamiquement pour l'affichage
        const ageCalcule = calculateAgeFromBirthDate(patient.dateNaissance);
        
        // Obtenir le statut du patient (actif/inactif)
        const patientStatus = getPatientStatus(patient.id);
        
        // Obtenir les informations du dernier rendez-vous
        const lastAppointmentInfo = getLastAppointmentInfo(patient.id);
        
        html += `
            <tr>
                <td>${formatPatientIdForDisplay(patient.id)}</td>
                <td>
                    <div class="patient-name">${patient.prenom} ${patient.nom}</div>
                    <div class="patient-id">${patient.profession}</div>
                </td>
                <td>${patient.cinPasseport || 'N/A'}</td>
                <td>${ageCalcule} ans</td>
                <td>${patient.telephone}</td>
                <td>${formatShortDate(patient.dateAjout)}</td>
                <td>
                    <div style="font-size: 12px; color: #666;">${lastAppointmentInfo}</div>
                </td>
                <td>
                    <span class="status-badge status-${patientStatus.toLowerCase()}">${patientStatus}</span>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-small btn-primary view-patient-btn" data-id="${patient.id}">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                    <button class="btn btn-small btn-edit edit-patient-btn" data-id="${patient.id}">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-small btn-delete delete-patient-btn" data-id="${patient.id}">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
    
    // Ajouter les événements
    container.querySelectorAll('.view-patient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const patientId = this.getAttribute('data-id');
            showPatientPage(patientId);
        });
    });
    
    container.querySelectorAll('.edit-patient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const patientId = this.getAttribute('data-id');
            openEditPatientModal(patientId);
        });
    });
    
    container.querySelectorAll('.delete-patient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const patientId = this.getAttribute('data-id');
            if (confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
                window.storage.deletePatient(patientId);
                if (typeof updateDashboard === 'function') updateDashboard();
                if (typeof displayRecentPatients === 'function') displayRecentPatients();
                displayAllPatients();
                alert('Patient supprimé avec succès.');
            }
        });
    });
}

// Afficher les patients récents
function displayRecentPatients() {
    if (!window.storage) return;
    
    const container = document.getElementById('recentPatientsContainer');
    const patients = window.storage.getPatients();
    
    if (patients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <h3>Aucun patient enregistré</h3>
                <p>Commencez par ajouter votre premier patient en cliquant sur le bouton "Ajouter un patient".</p>
            </div>
        `;
        return;
    }
    
    const recentPatients = [...patients]
        .sort((a, b) => new Date(b.dateAjout) - new Date(a.dateAjout))
        .slice(0, 5);
    
    let html = `
        <table class="patients-table">
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>CIN/Passeport</th>
                    <th>Date d'inscription</th>
                    <th>Téléphone</th>
                    <th>Prochain RDV</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    recentPatients.forEach(patient => {
        // Calculer l'âge dynamiquement
        const ageCalcule = calculateAgeFromBirthDate(patient.dateNaissance);
        
        // Obtenir le statut du patient
        const patientStatus = getPatientStatus(patient.id);
        
        const patientAppointments = window.storage.getAppointmentsByPatient(patient.id);
        let nextAppointment = 'Aucun';
        
        if (patientAppointments.length > 0) {
            const futureAppointments = patientAppointments
                .filter(a => new Date(a.date) >= new Date() && a.status === 'Confirmé')
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            if (futureAppointments.length > 0) {
                nextAppointment = formatShortDate(futureAppointments[0].date) + ' ' + futureAppointments[0].time;
            }
        }
        
        html += `
            <tr>
                <td>
                    <div class="patient-name">${patient.prenom} ${patient.nom}</div>
                    <div class="patient-id">ID: ${formatPatientIdForDisplay(patient.id)} | Âge: ${ageCalcule} ans</div>
                </td>
                <td>${patient.cinPasseport || 'N/A'}</td>
                <td>${formatShortDate(patient.dateAjout)}</td>
                <td>${patient.telephone}</td>
                <td>${nextAppointment}</td>
                <td>
                    <span class="status-badge status-${patientStatus.toLowerCase()}">${patientStatus}</span>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-secondary" id="viewMorePatientsBtn">
                <i class="fas fa-eye"></i> Voir tous les patients (${patients.length})
            </button>
        </div>
    `;
    
    container.innerHTML = html;
    if (document.getElementById('viewMorePatientsBtn')) {
        document.getElementById('viewMorePatientsBtn').addEventListener('click', function() {
            if (typeof showPatientsList === 'function') showPatientsList();
        });
    }
}

// NOUVELLE FONCTION: Exporter la liste des patients en Excel
function exportPatientsToExcel() {
    if (!window.storage) return;
    
    const patients = window.storage.getPatients();
    
    if (patients.length === 0) {
        alert('Aucun patient à exporter.');
        return;
    }
    
    // Créer les données pour Excel
    const excelData = patients.map(patient => {
        // Calculer l'âge dynamiquement
        const ageCalcule = calculateAgeFromBirthDate(patient.dateNaissance);
        
        // Obtenir le statut du patient
        const patientStatus = getPatientStatus(patient.id);
        
        // Obtenir les informations du dernier rendez-vous
        const lastAppointmentInfo = getLastAppointmentInfo(patient.id);
        
        // Compter les rendez-vous du patient
        const appointments = window.storage.getAppointmentsByPatient(patient.id);
        const appointmentCount = appointments.length;
        
        // Vérifier s'il y a des rendez-vous futurs
        const futureAppointments = appointments.filter(a => new Date(a.date) >= new Date());
        const nextAppointment = futureAppointments.length > 0 ? 
            `${formatShortDate(futureAppointments[0].date)} ${futureAppointments[0].time}` : 
            'Aucun';
        
        return {
            'ID Patient': formatPatientIdForDisplay(patient.id),
            'Nom': patient.nom,
            'Prénom': patient.prenom,
            'CIN/Passeport': patient.cinPasseport || 'N/A',
            'Âge': ageCalcule + ' ans',
            'Date de naissance': formatFrenchDate(patient.dateNaissance),
            'Situation familiale': patient.situation || 'N/A',
            'Téléphone': patient.telephone,
            'Email': patient.email || 'N/A',
            'Adresse': patient.adresse || 'N/A',
            'Profession': patient.profession || 'N/A',
            'Motif consultation': patient.motif || 'N/A',
            'Dents concernées': patient.dentsConcernees || 'N/A',
            'Date 1ère consultation': formatFrenchDate(patient.premiereConsultation),
            'Contact urgence': patient.contactUrgenceNom || 'N/A',
            'Tél urgence': patient.telUrgence || 'N/A',
            'Statut': patientStatus,
            'Date inscription': formatFrenchDate(patient.dateAjout),
            'Dernier RDV': lastAppointmentInfo,
            'Prochain RDV': nextAppointment,
            'Nombre total de RDV': appointmentCount,
            'Nombre RDV futurs': futureAppointments.length,
            'Habitudes tabac': patient.tabac || 'N/A',
            'Habitudes alcool': patient.alcool || 'N/A',
            'Habitudes café/thé': patient.cafeThe || 'N/A',
            'Niveau stress': patient.niveauStress || 'N/A',
            'Qualité sommeil': patient.sommeil || 'N/A',
            'Notes': patient.notes ? patient.notes.replace(/\n/g, ' ') : 'N/A'
        };
    });
    
    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    
    // Créer une feuille de calcul
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Définir la largeur des colonnes
    const colWidths = [
        { wch: 12 }, // ID Patient
        { wch: 15 }, // Nom
        { wch: 15 }, // Prénom
        { wch: 18 }, // CIN/Passeport
        { wch: 8 },  // Âge
        { wch: 15 }, // Date naissance
        { wch: 18 }, // Situation
        { wch: 15 }, // Téléphone
        { wch: 20 }, // Email
        { wch: 25 }, // Adresse
        { wch: 15 }, // Profession
        { wch: 25 }, // Motif consultation
        { wch: 18 }, // Dents concernées
        { wch: 18 }, // Date 1ère consultation
        { wch: 20 }, // Contact urgence
        { wch: 15 }, // Tél urgence
        { wch: 12 }, // Statut
        { wch: 15 }, // Date inscription
        { wch: 20 }, // Dernier RDV
        { wch: 15 }, // Prochain RDV
        { wch: 15 }, // Nombre total RDV
        { wch: 15 }, // Nombre RDV futurs
        { wch: 15 }, // Tabac
        { wch: 15 }, // Alcool
        { wch: 15 }, // Café/thé
        { wch: 15 }, // Stress
        { wch: 15 }, // Sommeil
        { wch: 30 }  // Notes
    ];
    ws['!cols'] = colWidths;
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');
    
    // Ajouter une feuille de statistiques
    const statsData = [
        ['STATISTIQUES PATIENTS'],
        ['Date d\'export:', new Date().toLocaleDateString('fr-FR')],
        [''],
        ['Nombre total de patients:', patients.length],
        ['Patients actifs:', patients.filter(p => getPatientStatus(p.id) === 'Actif').length],
        ['Patients inactifs:', patients.filter(p => getPatientStatus(p.id) === 'Inactif').length],
        [''],
        ['RÉPARTITION PAR ÂGE'],
        ['Moins de 18 ans:', patients.filter(p => calculateAgeFromBirthDate(p.dateNaissance) < 18).length],
        ['18-30 ans:', patients.filter(p => {
            const age = calculateAgeFromBirthDate(p.dateNaissance);
            return age >= 18 && age <= 30;
        }).length],
        ['31-50 ans:', patients.filter(p => {
            const age = calculateAgeFromBirthDate(p.dateNaissance);
            return age >= 31 && age <= 50;
        }).length],
        ['Plus de 50 ans:', patients.filter(p => calculateAgeFromBirthDate(p.dateNaissance) > 50).length],
        [''],
        ['MOYENNES'],
        ['Âge moyen:', (patients.reduce((sum, p) => sum + calculateAgeFromBirthDate(p.dateNaissance), 0) / patients.length).toFixed(1) + ' ans'],
        ['RDV moyen par patient:', (patients.reduce((sum, p) => {
            const appointments = window.storage.getAppointmentsByPatient(p.id);
            return sum + appointments.length;
        }, 0) / patients.length).toFixed(1)]
    ];
    
    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');
    
    // Générer la date pour le nom du fichier
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Exporter le fichier
    XLSX.writeFile(wb, `patients_${dateStr}.xlsx`);
    
    // Afficher une confirmation
    alert(`Export réussi !\n${patients.length} patients exportés vers "patients_${dateStr}.xlsx"`);
}

// Ajouter la fonction d'export au scope global
window.exportPatientsToExcel = exportPatientsToExcel;