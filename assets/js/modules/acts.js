// Gestion des actes et paiements

// Variables globales
let currentPatientActsId = null;
let actsData = {};

// Initialiser la gestion des actes
function initActs(storageInstance) {
    window.storage = storageInstance; // Stockage global
    loadActsData();
    
    // Ajouter la délégation d'événements pour tous les boutons
    setupGlobalEventDelegation();
    
    // Initialiser la date d'aujourd'hui
    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        const actDateInput = document.getElementById('actDate');
        if (actDateInput) actDateInput.value = today;
    }, 100);
}

// Charger les données des actes depuis le stockage
function loadActsData() {
    const savedData = localStorage.getItem('dental_clinic_acts');
    if (savedData) {
        actsData = JSON.parse(savedData);
    } else {
        actsData = {};
    }
}

// Sauvegarder les données des actes
function saveActsData() {
    localStorage.setItem('dental_clinic_acts', JSON.stringify(actsData));
}

// Configurer la délégation d'événements globale
function setupGlobalEventDelegation() {
    // Délégation d'événements pour TOUS les boutons dynamiques
    document.addEventListener('click', function(e) {
        // 1. Pour les boutons "Ajouter une phase"
        if (e.target.closest('.add-phase-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.add-phase-btn');
            const actIndex = btn.getAttribute('data-act-index');
            if (actIndex !== null && actIndex !== undefined) {
                console.log('Ajouter phase - actIndex:', actIndex);
                openAddPhaseModal(parseInt(actIndex));
                return;
            }
        }
        
        // 2. Pour les boutons "Ajouter un paiement"
        if (e.target.closest('.add-payment-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.add-payment-btn');
            const actIndex = btn.getAttribute('data-act-index');
            if (actIndex !== null && actIndex !== undefined) {
                console.log('Ajouter paiement - actIndex:', actIndex);
                openAddPaymentModal(parseInt(actIndex));
                return;
            }
        }
        
        // 3. Pour les boutons d'édition d'actes
        if (e.target.closest('.edit-act-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.edit-act-btn');
            const actIndex = btn.getAttribute('data-index');
            if (actIndex !== null && actIndex !== undefined) {
                editAct(parseInt(actIndex));
                return;
            }
        }
        
        // 4. Pour les boutons de suppression d'actes
        if (e.target.closest('.delete-act-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.delete-act-btn');
            const actIndex = btn.getAttribute('data-index');
            if (actIndex !== null && actIndex !== undefined) {
                deleteAct(parseInt(actIndex));
                return;
            }
        }
        
        // 5. Pour les boutons d'édition de phases
        if (e.target.closest('.edit-phase-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.edit-phase-btn');
            const actIndex = btn.getAttribute('data-act-index');
            const phaseIndex = btn.getAttribute('data-phase-index');
            if (actIndex !== null && phaseIndex !== undefined) {
                editTreatmentPhase(parseInt(actIndex), parseInt(phaseIndex));
                return;
            }
        }
        
        // 6. Pour les boutons de suppression de phases
        if (e.target.closest('.delete-phase-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.delete-phase-btn');
            const actIndex = btn.getAttribute('data-act-index');
            const phaseIndex = btn.getAttribute('data-phase-index');
            if (actIndex !== null && phaseIndex !== undefined) {
                deleteTreatmentPhase(parseInt(actIndex), parseInt(phaseIndex));
                return;
            }
        }
        
        // 7. Pour les boutons d'édition de paiements
        if (e.target.closest('.edit-payment-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.edit-payment-btn');
            const actIndex = btn.getAttribute('data-act-index');
            const paymentIndex = btn.getAttribute('data-payment-index');
            if (actIndex !== null && paymentIndex !== undefined) {
                editPayment(parseInt(actIndex), parseInt(paymentIndex));
                return;
            }
        }
        
        // 8. Pour les boutons de suppression de paiements
        if (e.target.closest('.delete-payment-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.delete-payment-btn');
            const actIndex = btn.getAttribute('data-act-index');
            const paymentIndex = btn.getAttribute('data-payment-index');
            if (actIndex !== null && paymentIndex !== undefined) {
                deletePayment(parseInt(actIndex), parseInt(paymentIndex));
                return;
            }
        }
        
        // 9. Pour les en-têtes d'actes (toggle)
        if (e.target.closest('.act-header') && !e.target.closest('.act-actions button')) {
            e.preventDefault();
            e.stopPropagation();
            const actHeader = e.target.closest('.act-header');
            const actItem = actHeader.closest('.act-item');
            if (actItem) {
                const actIndex = actItem.getAttribute('data-index');
                if (actIndex !== null && actIndex !== undefined) {
                    toggleActDetails(parseInt(actIndex));
                    return;
                }
            }
        }
        
        // 10. Pour le bouton d'ajout d'acte principal
        if (e.target.closest('#saveActBtn') || e.target.id === 'saveActBtn') {
            e.preventDefault();
            e.stopPropagation();
            addNewAct();
            return;
        }
        
        // 11. Pour voir les images d'une phase
        if (e.target.closest('.view-images-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.view-images-btn');
            const actIndex = btn.getAttribute('data-act-index');
            const phaseIndex = btn.getAttribute('data-phase-index');
            if (actIndex !== null && phaseIndex !== undefined) {
                viewPhaseImages(parseInt(actIndex), parseInt(phaseIndex));
                return;
            }
        }
    });
}

// Charger les actes pour un patient spécifique
function loadPatientActs(patientId) {
    currentPatientActsId = patientId;
    
    if (!actsData[patientId]) {
        actsData[patientId] = {
            acts: []
        };
        saveActsData();
    }
    
    displayActsList();
    updateFinancialSummary();
}

// Fonction pour afficher les actes avec interface expandable
function displayActsList() {
    if (!currentPatientActsId || !actsData[currentPatientActsId]) return;
    
    const container = document.getElementById('actsListContainer');
    const acts = actsData[currentPatientActsId].acts;
    
    if (acts.length === 0) {
        container.innerHTML = `
            <div class="no-acts-message">
                <i class="fas fa-file-medical"></i>
                <p>Aucun acte médical enregistré</p>
                <small>Utilisez le formulaire ci-dessus pour ajouter un premier acte</small>
            </div>
        `;
        return;
    }
    
    let html = `<div class="acts-section">`;
    
    acts.forEach((act, actIndex) => {
        // Calculer le total payé pour cet acte
        const actPaid = act.payments ? act.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
        const actRemaining = act.price - actPaid;
        
        html += `
            <div class="act-item expanded" data-index="${actIndex}">
                <div class="act-header">
                    <div class="act-header-left">
                        <i class="fas fa-chevron-down act-toggle-icon"></i>
                        <div class="act-title">
                            <strong>${act.type}</strong>
                            <span class="act-subtitle">Dent: ${act.tooth} | Date: ${formatShortDate(act.date)}</span>
                        </div>
                    </div>
                    <div class="act-header-right">
                        <span class="price-tag">${act.price.toFixed(2)} DH</span>
                        <div class="act-status">
                            <span class="status-badge ${actRemaining <= 0 ? 'status-paid' : 'status-pending'}">
                                ${actRemaining <= 0 ? 'Payé' : 'Reste: ' + actRemaining.toFixed(2) + ' DH'}
                            </span>
                        </div>
                        <div class="act-actions">
                            <button class="btn btn-small btn-edit edit-act-btn" data-index="${actIndex}" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-small btn-danger delete-act-btn" data-index="${actIndex}" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="act-details" id="actDetails${actIndex}" style="display: block;">
                    <!-- Notes de l'acte -->
                    ${act.notes ? `
                    <div class="act-notes">
                        <div class="info-label">Notes:</div>
                        <div class="info-value">${act.notes}</div>
                    </div>` : ''}
                    
                    <!-- Phases de traitement pour cet acte -->
                    <div class="treatment-phases-section">
                        <div class="section-subheader">
                            <h5><i class="fas fa-list-ol"></i> Phases de traitement</h5>
                            <button class="btn btn-small btn-primary add-phase-btn" data-act-index="${actIndex}">
                                <i class="fas fa-plus"></i> Ajouter une phase
                            </button>
                        </div>
                        
                        <div class="treatment-phases-list" id="treatmentPhases${actIndex}">
                            ${displayTreatmentPhasesForAct(actIndex)}
                        </div>
                    </div>
                    
                    <!-- Paiements pour cet acte -->
                    <div class="payments-section">
                        <div class="section-subheader">
                            <h5><i class="fas fa-money-bill-wave"></i> Paiements</h5>
                            <button class="btn btn-small btn-success add-payment-btn" data-act-index="${actIndex}">
                                <i class="fas fa-plus"></i> Ajouter un paiement
                            </button>
                        </div>
                        
                        <div class="payments-list" id="payments${actIndex}">
                            ${displayPaymentsForAct(actIndex)}
                        </div>
                    </div>
                    
                    <!-- SUPPRIMÉ: Résumé financier de l'acte -->
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    container.innerHTML = html;
}

// Toggle les détails d'un acte
function toggleActDetails(actIndex) {
    const actItem = document.querySelector(`.act-item[data-index="${actIndex}"]`);
    
    if (!actItem) return;
    
    const details = actItem.querySelector('.act-details');
    const toggleIcon = actItem.querySelector('.act-toggle-icon');
    
    if (actItem.classList.contains('expanded')) {
        actItem.classList.remove('expanded');
        details.style.display = 'none';
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-right');
        }
    } else {
        actItem.classList.add('expanded');
        details.style.display = 'block';
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-down');
        }
    }
}

// ============================================
// FONCTIONS POUR LES PHOTOS
// ============================================

// Ouvrir le modal pour ajouter une phase de traitement AVEC PHOTOS
function openAddPhaseModal(actIndex) {
    console.log('Opening phase modal for act:', actIndex);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Aucun patient sélectionné.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) {
        alert('Acte non trouvé.');
        return;
    }
    
    // Fermer tout autre modal ouvert
    const existingModal = document.getElementById('addPhaseModal');
    if (existingModal) existingModal.remove();
    
    const today = new Date().toISOString().split('T')[0];
    
    const modalHtml = `
        <div class="modal" id="addPhaseModal" style="display: flex;">
            <div class="modal-content" style="max-width: 800px; margin: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> Ajouter une phase de traitement</h3>
                    <button class="close-modal" onclick="document.getElementById('addPhaseModal').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div class="form-group">
                        <label for="newPhaseDate" class="form-label">Date *</label>
                        <input type="date" id="newPhaseDate" class="form-input" value="${today}">
                    </div>
                    
                    <div class="form-group">
                        <label for="newPhaseDescription" class="form-label">Description *</label>
                        <input type="text" id="newPhaseDescription" class="form-input" placeholder="Description de la phase">
                    </div>
                    
                    <div class="form-group">
                        <label for="newPhaseNotes" class="form-label">Notes</label>
                        <textarea id="newPhaseNotes" class="form-textarea" rows="3" placeholder="Notes optionnelles"></textarea>
                    </div>
                    
                    <!-- SECTION PHOTOS -->
                    <div class="form-group">
                        <label class="form-label">Photos (avant/après)</label>
                        
                        <div id="newPhasePhotosContainer" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px; min-height: 80px; padding: 10px; border: 1px dashed #ddd; border-radius: 8px;">
                            <div style="width: 100%; text-align: center; padding: 20px; color: #888;">
                                <i class="fas fa-images" style="font-size: 24px; margin-bottom: 10px;"></i>
                                <p>Aucune photo ajoutée</p>
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <input type="file" id="newPhasePhotoUpload" accept="image/*" multiple style="display: none;">
                            <button type="button" class="btn btn-primary" id="addPhotosBtn">
                                <i class="fas fa-camera"></i> Ajouter des photos
                            </button>
                            <small style="display: block; margin-top: 5px; color: #888;">Formats acceptés: JPG, PNG, GIF (max 5MB par photo)</small>
                        </div>
                        
                        <div id="photoUploadStatus" style="margin-top: 10px; font-size: 13px;"></div>
                    </div>
                    
                    <div class="form-buttons" style="margin-top: 30px; border-top: 1px solid #e1e9f5; padding-top: 20px;">
                        <button class="form-btn-reset" onclick="document.getElementById('addPhaseModal').remove()">Annuler</button>
                        <button class="form-btn-submit" id="savePhaseBtn" data-act-index="${actIndex}">
                            <i class="fas fa-save"></i> Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv.firstElementChild);
    
    // Attacher les événements pour les photos
    setTimeout(() => {
        const saveBtn = document.getElementById('savePhaseBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                saveNewPhase(parseInt(this.getAttribute('data-act-index')));
            });
        }
        
        const addPhotosBtn = document.getElementById('addPhotosBtn');
        const photoUploadInput = document.getElementById('newPhasePhotoUpload');
        
        if (addPhotosBtn && photoUploadInput) {
            addPhotosBtn.addEventListener('click', function() {
                photoUploadInput.click();
            });
            
            photoUploadInput.addEventListener('change', function(e) {
                handlePhotoUpload(e, 'newPhasePhotosContainer');
            });
        }
    }, 100);
}

// Gérer l'upload de photos
function handlePhotoUpload(event, containerId) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const container = document.getElementById(containerId);
    const statusDiv = document.getElementById('photoUploadStatus');
    
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Traitement de ${files.length} photo(s)...`;
        statusDiv.style.color = '#1a6dbb';
    }
    
    let processedCount = 0;
    const totalFiles = files.length;
    const photosArray = [];
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Parcourir tous les fichiers
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Vérifier le type de fichier
        if (!file.type.match('image.*')) {
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Le fichier "${file.name}" n'est pas une image valide`;
                statusDiv.style.color = '#e74c3c';
            }
            continue;
        }
        
        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> La photo "${file.name}" est trop grande (max 5MB)`;
                statusDiv.style.color = '#e74c3c';
            }
            continue;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            processedCount++;
            photosArray.push({
                name: file.name,
                data: e.target.result,
                type: file.type,
                size: file.size
            });
            
            // Ajouter la miniature
            const photoIndex = photosArray.length - 1;
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-thumbnail';
            photoDiv.style.cssText = `
                position: relative;
                width: 100px;
                height: 100px;
                border-radius: 8px;
                overflow: hidden;
                border: 2px solid #e1e9f5;
            `;
            
            photoDiv.innerHTML = `
                <img src="${e.target.result}" alt="Photo ${processedCount}" 
                     style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" class="delete-photo-btn" 
                        data-index="${photoIndex}"
                        style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            container.appendChild(photoDiv);
            
            // Mettre à jour le compteur
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${processedCount}/${totalFiles} photo(s) ajoutée(s)`;
                statusDiv.style.color = '#00a86b';
            }
            
            // Si toutes les photos sont traitées
            if (processedCount === totalFiles) {
                // Stocker les photos temporairement
                window.tempPhotos = photosArray;
                
                setTimeout(() => {
                    if (statusDiv) {
                        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${totalFiles} photo(s) prête(s) à être enregistrées`;
                    }
                }, 500);
            }
        };
        
        reader.onerror = function() {
            processedCount++;
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Erreur lors du traitement de la photo ${processedCount}`;
                statusDiv.style.color = '#e74c3c';
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    // Réinitialiser l'input
    event.target.value = '';
    
    // Attacher les événements de suppression aux boutons de suppression
    setTimeout(() => {
        document.querySelectorAll('.delete-photo-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteTempPhoto(index, containerId);
            });
        });
    }, 100);
}

// Supprimer une photo temporaire
function deleteTempPhoto(index, containerId) {
    if (!window.tempPhotos || window.tempPhotos.length <= index) return;
    
    window.tempPhotos.splice(index, 1);
    
    // Réafficher les miniatures
    const container = document.getElementById(containerId);
    const statusDiv = document.getElementById('photoUploadStatus');
    
    if (container) {
        container.innerHTML = '';
        
        if (window.tempPhotos.length === 0) {
            container.innerHTML = `
                <div style="width: 100%; text-align: center; padding: 20px; color: #888;">
                    <i class="fas fa-images" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Aucune photo ajoutée</p>
                </div>
            `;
        } else {
            window.tempPhotos.forEach((photo, i) => {
                const photoDiv = document.createElement('div');
                photoDiv.className = 'photo-thumbnail';
                photoDiv.style.cssText = `
                    position: relative;
                    width: 100px;
                    height: 100px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid #e1e9f5;
                `;
                
                photoDiv.innerHTML = `
                    <img src="${photo.data}" alt="Photo ${i + 1}" 
                         style="width: 100%; height: 100%; object-fit: cover;">
                    <button type="button" class="delete-photo-btn" 
                            data-index="${i}"
                            style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                container.appendChild(photoDiv);
            });
            
            // Réattacher les événements
            setTimeout(() => {
                document.querySelectorAll('.delete-photo-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idx = parseInt(this.getAttribute('data-index'));
                        deleteTempPhoto(idx, containerId);
                    });
                });
            }, 50);
        }
    }
    
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${window.tempPhotos.length} photo(s) restante(s)`;
        statusDiv.style.color = '#1a6dbb';
    }
}

// Sauvegarder une nouvelle phase avec photos
function saveNewPhase(actIndex) {
    console.log('Saving phase for act:', actIndex);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    const date = document.getElementById('newPhaseDate')?.value || '';
    const description = document.getElementById('newPhaseDescription')?.value?.trim() || '';
    const notes = document.getElementById('newPhaseNotes')?.value?.trim() || '';
    
    if (!date || !description) {
        alert('Veuillez remplir tous les champs obligatoires (*).');
        return;
    }
    
    // Récupérer les photos
    const photos = window.tempPhotos ? window.tempPhotos.map(photo => photo.data) : [];
    
    const newPhase = {
        id: Date.now(),
        date: date,
        description: description,
        notes: notes,
        photos: photos,
        createdAt: new Date().toISOString()
    };
    
    if (!acts[actIndex].treatmentPhases) {
        acts[actIndex].treatmentPhases = [];
    }
    
    acts[actIndex].treatmentPhases.push(newPhase);
    saveActsData();
    
    // Nettoyer les photos temporaires
    window.tempPhotos = null;
    
    // Fermer le modal
    const modal = document.getElementById('addPhaseModal');
    if (modal) modal.remove();
    
    // Mettre à jour l'affichage
    displayActsList();
    
    alert('Phase de traitement ajoutée avec succès!');
}

// Modifier une phase de traitement AVEC PHOTOS
function editTreatmentPhase(actIndex, phaseIndex) {
    console.log('Editing phase:', phaseIndex, 'for act:', actIndex);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    const phases = acts[actIndex].treatmentPhases || [];
    if (phaseIndex < 0 || phaseIndex >= phases.length) {
        alert('Erreur: Phase non trouvée.');
        return;
    }
    
    const phase = phases[phaseIndex];
    
    // Ouvrir un modal pour modifier la phase
    const existingModal = document.getElementById('editPhaseModal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div class="modal" id="editPhaseModal" style="display: flex;">
            <div class="modal-content" style="max-width: 800px; margin: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Modifier la phase de traitement</h3>
                    <button class="close-modal" onclick="document.getElementById('editPhaseModal').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <input type="hidden" id="editPhaseActIndex" value="${actIndex}">
                    <input type="hidden" id="editPhaseIndex" value="${phaseIndex}">
                    
                    <div class="form-group">
                        <label for="editPhaseDate" class="form-label">Date *</label>
                        <input type="date" id="editPhaseDate" class="form-input" value="${phase.date}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editPhaseDescription" class="form-label">Description *</label>
                        <input type="text" id="editPhaseDescription" class="form-input" value="${phase.description}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editPhaseNotes" class="form-label">Notes</label>
                        <textarea id="editPhaseNotes" class="form-textarea" rows="3">${phase.notes || ''}</textarea>
                    </div>
                    
                    <!-- SECTION PHOTOS EXISTANTES -->
                    <div class="form-group">
                        <label class="form-label">Photos existantes</label>
                        
                        <div id="existingPhotosContainer" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px; min-height: 80px; padding: 10px; border: 1px solid #e1e9f5; border-radius: 8px;">
                            ${phase.photos && phase.photos.length > 0 ? 
                                phase.photos.map((photo, idx) => `
                                    <div class="existing-photo" style="position: relative; width: 100px; height: 100px;">
                                        <img src="${photo}" alt="Photo ${idx + 1}" 
                                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 2px solid #e1e9f5;">
                                        <button type="button" class="delete-existing-photo-btn" 
                                                data-index="${idx}"
                                                style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('') : 
                                '<div style="width: 100%; text-align: center; padding: 20px; color: #888;">Aucune photo</div>'
                            }
                        </div>
                    </div>
                    
                    <!-- SECTION AJOUT DE NOUVELLES PHOTOS -->
                    <div class="form-group">
                        <label class="form-label">Ajouter de nouvelles photos</label>
                        
                        <div id="newPhotosContainer" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px; min-height: 80px; padding: 10px; border: 1px dashed #ddd; border-radius: 8px;">
                            <div style="width: 100%; text-align: center; padding: 20px; color: #888;">
                                <i class="fas fa-images" style="font-size: 24px; margin-bottom: 10px;"></i>
                                <p>Aucune nouvelle photo ajoutée</p>
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <input type="file" id="editPhasePhotoUpload" accept="image/*" multiple style="display: none;">
                            <button type="button" class="btn btn-primary" id="addMorePhotosBtn">
                                <i class="fas fa-camera"></i> Ajouter des photos
                            </button>
                            <small style="display: block; margin-top: 5px; color: #888;">Formats acceptés: JPG, PNG, GIF (max 5MB par photo)</small>
                        </div>
                        
                        <div id="editPhotoUploadStatus" style="margin-top: 10px; font-size: 13px;"></div>
                    </div>
                    
                    <div class="form-buttons" style="margin-top: 30px; border-top: 1px solid #e1e9f5; padding-top: 20px;">
                        <button class="form-btn-reset" onclick="document.getElementById('editPhaseModal').remove()">Annuler</button>
                        <button class="form-btn-submit" id="updatePhaseBtn">
                            <i class="fas fa-save"></i> Enregistrer les modifications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv.firstElementChild);
    
    // Initialiser les photos existantes
    window.existingPhotos = phase.photos ? [...phase.photos] : [];
    window.newPhotos = [];
    
    // Attacher les événements
    setTimeout(() => {
        const updateBtn = document.getElementById('updatePhaseBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', function() {
                updateTreatmentPhase(actIndex, phaseIndex);
            });
        }
        
        // Bouton pour ajouter des photos
        const addMorePhotosBtn = document.getElementById('addMorePhotosBtn');
        const editPhotoUploadInput = document.getElementById('editPhasePhotoUpload');
        
        if (addMorePhotosBtn && editPhotoUploadInput) {
            addMorePhotosBtn.addEventListener('click', function() {
                editPhotoUploadInput.click();
            });
            
            editPhotoUploadInput.addEventListener('change', function(e) {
                handleEditPhotoUpload(e, 'newPhotosContainer', 'editPhotoUploadStatus');
            });
        }
        
        // Boutons pour supprimer les photos existantes
        document.querySelectorAll('.delete-existing-photo-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteExistingPhoto(index);
            });
        });
    }, 100);
}

// Gérer l'upload de photos pour l'édition
function handleEditPhotoUpload(event, containerId, statusId) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const container = document.getElementById(containerId);
    const statusDiv = document.getElementById(statusId);
    
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Traitement de ${files.length} photo(s)...`;
        statusDiv.style.color = '#1a6dbb';
    }
    
    let processedCount = 0;
    const totalFiles = files.length;
    
    // Initialiser newPhotos si nécessaire
    if (!window.newPhotos) window.newPhotos = [];
    
    // Vider le conteneur si c'est la première fois
    if (window.newPhotos.length === 0) {
        container.innerHTML = '';
    }
    
    // Parcourir tous les fichiers
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Vérifier le type de fichier
        if (!file.type.match('image.*')) {
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Le fichier "${file.name}" n'est pas une image valide`;
                statusDiv.style.color = '#e74c3c';
            }
            continue;
        }
        
        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> La photo "${file.name}" est trop grande (max 5MB)`;
                statusDiv.style.color = '#e74c3c';
            }
            continue;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            processedCount++;
            const photoData = e.target.result;
            window.newPhotos.push(photoData);
            
            // Ajouter la miniature
            const photoIndex = window.newPhotos.length - 1;
            const photoDiv = document.createElement('div');
            photoDiv.className = 'new-photo-thumbnail';
            photoDiv.style.cssText = `
                position: relative;
                width: 100px;
                height: 100px;
                border-radius: 8px;
                overflow: hidden;
                border: 2px solid #4CAF50;
            `;
            
            photoDiv.innerHTML = `
                <img src="${photoData}" alt="Nouvelle photo ${processedCount}" 
                     style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" class="delete-new-photo-btn" 
                        data-index="${photoIndex}"
                        style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            container.appendChild(photoDiv);
            
            // Mettre à jour le compteur
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${processedCount}/${totalFiles} nouvelle(s) photo(s) ajoutée(s)`;
                statusDiv.style.color = '#00a86b';
            }
            
            // Si toutes les photos sont traitées
            if (processedCount === totalFiles) {
                setTimeout(() => {
                    if (statusDiv) {
                        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${totalFiles} nouvelle(s) photo(s) prête(s)`;
                    }
                }, 500);
            }
        };
        
        reader.onerror = function() {
            processedCount++;
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Erreur lors du traitement de la photo ${processedCount}`;
                statusDiv.style.color = '#e74c3c';
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    // Réinitialiser l'input
    event.target.value = '';
    
    // Attacher les événements de suppression aux nouvelles photos
    setTimeout(() => {
        document.querySelectorAll('.delete-new-photo-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteNewPhoto(index, containerId, statusId);
            });
        });
    }, 100);
}

// Supprimer une photo existante
function deleteExistingPhoto(index) {
    if (!window.existingPhotos || window.existingPhotos.length <= index) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
        window.existingPhotos.splice(index, 1);
        
        // Réafficher les photos existantes
        const container = document.getElementById('existingPhotosContainer');
        if (container) {
            if (window.existingPhotos.length === 0) {
                container.innerHTML = '<div style="width: 100%; text-align: center; padding: 20px; color: #888;">Aucune photo</div>';
            } else {
                container.innerHTML = window.existingPhotos.map((photo, idx) => `
                    <div class="existing-photo" style="position: relative; width: 100px; height: 100px;">
                        <img src="${photo}" alt="Photo ${idx + 1}" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 2px solid #e1e9f5;">
                        <button type="button" class="delete-existing-photo-btn" 
                                data-index="${idx}"
                                style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
                
                // Réattacher les événements
                setTimeout(() => {
                    document.querySelectorAll('.delete-existing-photo-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const idx = parseInt(this.getAttribute('data-index'));
                            deleteExistingPhoto(idx);
                        });
                    });
                }, 50);
            }
        }
    }
}

// Supprimer une nouvelle photo
function deleteNewPhoto(index, containerId, statusId) {
    if (!window.newPhotos || window.newPhotos.length <= index) return;
    
    window.newPhotos.splice(index, 1);
    
    // Réafficher les nouvelles photos
    const container = document.getElementById(containerId);
    const statusDiv = document.getElementById(statusId);
    
    if (container) {
        if (window.newPhotos.length === 0) {
            container.innerHTML = `
                <div style="width: 100%; text-align: center; padding: 20px; color: #888;">
                    <i class="fas fa-images" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Aucune nouvelle photo ajoutée</p>
                </div>
            `;
        } else {
            container.innerHTML = '';
            window.newPhotos.forEach((photo, i) => {
                const photoDiv = document.createElement('div');
                photoDiv.className = 'new-photo-thumbnail';
                photoDiv.style.cssText = `
                    position: relative;
                    width: 100px;
                    height: 100px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid #4CAF50;
                `;
                
                photoDiv.innerHTML = `
                    <img src="${photo}" alt="Nouvelle photo ${i + 1}" 
                         style="width: 100%; height: 100%; object-fit: cover;">
                    <button type="button" class="delete-new-photo-btn" 
                            data-index="${i}"
                            style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                container.appendChild(photoDiv);
            });
            
            // Réattacher les événements
            setTimeout(() => {
                document.querySelectorAll('.delete-new-photo-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idx = parseInt(this.getAttribute('data-index'));
                        deleteNewPhoto(idx, containerId, statusId);
                    });
                });
            }, 50);
        }
    }
    
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${window.newPhotos.length} nouvelle(s) photo(s) restante(s)`;
        statusDiv.style.color = '#1a6dbb';
    }
}

// Mettre à jour une phase de traitement avec photos
function updateTreatmentPhase(actIndex, phaseIndex) {
    console.log('Updating phase:', phaseIndex, 'for act:', actIndex);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    const phases = acts[actIndex].treatmentPhases;
    if (!phases || phaseIndex < 0 || phaseIndex >= phases.length) {
        alert('Erreur: Phase non trouvée.');
        return;
    }
    
    const date = document.getElementById('editPhaseDate')?.value || '';
    const description = document.getElementById('editPhaseDescription')?.value?.trim() || '';
    const notes = document.getElementById('editPhaseNotes')?.value?.trim() || '';
    
    if (!date || !description) {
        alert('Veuillez remplir tous les champs obligatoires (*).');
        return;
    }
    
    // Combiner les photos existantes (celles non supprimées) avec les nouvelles photos
    const allPhotos = [...(window.existingPhotos || []), ...(window.newPhotos || [])];
    
    phases[phaseIndex] = {
        ...phases[phaseIndex],
        date: date,
        description: description,
        notes: notes,
        photos: allPhotos,
        updatedAt: new Date().toISOString()
    };
    
    saveActsData();
    
    // Nettoyer les variables temporaires
    window.existingPhotos = null;
    window.newPhotos = null;
    
    // Fermer le modal
    const modal = document.getElementById('editPhaseModal');
    if (modal) modal.remove();
    
    // Mettre à jour l'affichage
    displayActsList();
    
    alert('Phase de traitement modifiée avec succès!');
}

// Voir les images d'une phase
function viewPhaseImages(actIndex, phaseIndex) {
    if (!currentPatientActsId || !actsData[currentPatientActsId]) return;
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) return;
    
    const phases = acts[actIndex].treatmentPhases || [];
    if (phaseIndex < 0 || phaseIndex >= phases.length) return;
    
    const phase = phases[phaseIndex];
    if (!phase.photos || phase.photos.length === 0) {
        alert('Cette phase ne contient pas de photos.');
        return;
    }
    
    // Ouvrir un modal pour voir les photos
    const existingModal = document.getElementById('viewImagesModal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div class="modal" id="viewImagesModal" style="display: flex;">
            <div class="modal-content" style="max-width: 900px; margin: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-images"></i> Photos de la phase de traitement</h3>
                    <button class="close-modal" onclick="document.getElementById('viewImagesModal').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #1a6dbb; margin-bottom: 10px;">${phase.description}</h4>
                        <p style="color: #666;">Date: ${formatShortDate(phase.date)}</p>
                        ${phase.notes ? `<p style="color: #666; margin-top: 5px;">Notes: ${phase.notes}</p>` : ''}
                    </div>
                    
                    <div id="imagesCarousel" style="text-align: center; margin-bottom: 20px;">
                        <img id="currentImage" src="${phase.photos[0]}" 
                             alt="Photo 1" 
                             style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 2px solid #e1e9f5; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    </div>
                    
                    ${phase.photos.length > 1 ? `
                        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 20px;">
                            <button class="btn btn-secondary" onclick="changeImage(-1)" id="prevImageBtn">
                                <i class="fas fa-chevron-left"></i> Précédent
                            </button>
                            <span id="imageCounter" style="font-weight: 600; color: #1a6dbb;">
                                1 / ${phase.photos.length}
                            </span>
                            <button class="btn btn-secondary" onclick="changeImage(1)" id="nextImageBtn">
                                Suivant <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e9f5;">
                            ${phase.photos.map((photo, index) => `
                                <div class="thumbnail-selector ${index === 0 ? 'active' : ''}" 
                                     onclick="selectImage(${index})"
                                     style="cursor: pointer; width: 80px; height: 60px; border-radius: 6px; overflow: hidden; border: 2px solid ${index === 0 ? '#1a6dbb' : '#e1e9f5'};">
                                    <img src="${photo}" alt="Photo ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv.firstElementChild);
    
    // Stocker les données pour la navigation
    window.currentPhaseImages = phase.photos;
    window.currentImageIndex = 0;
}

// Fonctions de navigation pour le carousel d'images
function changeImage(direction) {
    if (!window.currentPhaseImages) return;
    
    window.currentImageIndex += direction;
    
    // Boucler les images
    if (window.currentImageIndex < 0) {
        window.currentImageIndex = window.currentPhaseImages.length - 1;
    } else if (window.currentImageIndex >= window.currentPhaseImages.length) {
        window.currentImageIndex = 0;
    }
    
    // Mettre à jour l'image
    const currentImage = document.getElementById('currentImage');
    const imageCounter = document.getElementById('imageCounter');
    
    if (currentImage) currentImage.src = window.currentPhaseImages[window.currentImageIndex];
    if (imageCounter) imageCounter.textContent = `${window.currentImageIndex + 1} / ${window.currentPhaseImages.length}`;
    
    // Mettre à jour les miniatures actives
    document.querySelectorAll('.thumbnail-selector').forEach((thumb, index) => {
        thumb.style.borderColor = index === window.currentImageIndex ? '#1a6dbb' : '#e1e9f5';
    });
}

function selectImage(index) {
    if (!window.currentPhaseImages || index < 0 || index >= window.currentPhaseImages.length) return;
    
    window.currentImageIndex = index;
    const currentImage = document.getElementById('currentImage');
    const imageCounter = document.getElementById('imageCounter');
    
    if (currentImage) currentImage.src = window.currentPhaseImages[index];
    if (imageCounter) imageCounter.textContent = `${index + 1} / ${window.currentPhaseImages.length}`;
    
    // Mettre à jour les miniatures actives
    document.querySelectorAll('.thumbnail-selector').forEach((thumb, thumbIndex) => {
        thumb.style.borderColor = thumbIndex === index ? '#1a6dbb' : '#e1e9f5';
    });
}

// ============================================
// FONCTIONS POUR AFFICHER LES PHASES AVEC PHOTOS
// ============================================

function displayTreatmentPhasesForAct(actIndex) {
    if (!currentPatientActsId || !actsData[currentPatientActsId] || !actsData[currentPatientActsId].acts[actIndex]) {
        return '<div class="no-data">Aucune phase de traitement</div>';
    }
    
    const act = actsData[currentPatientActsId].acts[actIndex];
    const phases = act.treatmentPhases || [];
    
    if (phases.length === 0) {
        return `
            <div class="empty-state-small">
                <i class="fas fa-list-ol"></i>
                <p>Aucune phase de traitement</p>
            </div>
        `;
    }
    
    let html = '<div class="phases-table">';
    
    phases.forEach((phase, phaseIndex) => {
        const hasPhotos = phase.photos && phase.photos.length > 0;
        const photoCount = hasPhotos ? phase.photos.length : 0;
        
        html += `
            <div class="phase-item">
                <div class="phase-info">
                    <div class="phase-date">${formatShortDate(phase.date)}</div>
                    <div class="phase-description">${phase.description}</div>
                    ${phase.notes ? `<div class="phase-notes"><small>${phase.notes}</small></div>` : ''}
                </div>
                <div class="phase-photos">
                    ${hasPhotos ? `
                        <div class="phase-images-thumbnails">
                            ${phase.photos.slice(0, 3).map((photo, imgIndex) => `
                                <div class="phase-image-thumbnail" onclick="viewPhaseImages(${actIndex}, ${phaseIndex})">
                                    <img src="${photo}" alt="Photo ${imgIndex + 1}" 
                                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 2px solid #e1e9f5; cursor: pointer;">
                                </div>
                            `).join('')}
                            ${photoCount > 3 ? `
                                <div class="phase-image-more" onclick="viewPhaseImages(${actIndex}, ${phaseIndex})" 
                                     style="width: 50px; height: 50px; border-radius: 6px; background-color: #f0f7ff; border: 2px dashed #1a6dbb; display: flex; align-items: center; justify-content: center; color: #1a6dbb; font-weight: 600; cursor: pointer;">
                                    +${photoCount - 3}
                                </div>
                            ` : ''}
                        </div>
                    ` : '<span class="no-photo">—</span>'}
                </div>
                <div class="phase-actions">
                    <button class="btn btn-small btn-edit edit-phase-btn" data-act-index="${actIndex}" data-phase-index="${phaseIndex}" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger delete-phase-btn" data-act-index="${actIndex}" data-phase-index="${phaseIndex}" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${hasPhotos ? `
                        <button class="btn btn-small btn-info view-images-btn" data-act-index="${actIndex}" data-phase-index="${phaseIndex}" title="Voir les photos">
                            <i class="fas fa-eye"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    return html;
}

// ============================================
// FONCTIONS EXISTANTES (inchangées)
// ============================================

// Ouvrir le modal pour ajouter un paiement
function openAddPaymentModal(actIndex) {
    console.log('Opening payment modal for act:', actIndex);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Aucun patient sélectionné.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) {
        alert('Acte non trouvé.');
        return;
    }
    
    // Fermer tout autre modal ouvert
    const existingModal = document.getElementById('addPaymentModal');
    if (existingModal) existingModal.remove();
    
    const today = new Date().toISOString().split('T')[0];
    
    const modalHtml = `
        <div class="modal" id="addPaymentModal" style="display: flex;">
            <div class="modal-content" style="max-width: 600px; margin: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> Ajouter un paiement</h3>
                    <button class="close-modal" onclick="document.getElementById('addPaymentModal').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div class="form-group">
                        <label for="newPaymentDate" class="form-label">Date *</label>
                        <input type="date" id="newPaymentDate" class="form-input" value="${today}">
                    </div>
                    <div class="form-group">
                        <label for="newPaymentAmount" class="form-label">Montant (DH) *</label>
                        <input type="number" id="newPaymentAmount" class="form-input" placeholder="0.00" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="newPaymentMethod" class="form-label">Méthode de paiement</label>
                        <select id="newPaymentMethod" class="form-select">
                            <option value="">-- Sélectionner --</option>
                            <option value="Espèces">Espèces</option>
                            <option value="Chèque">Chèque</option>
                            <option value="Carte">Carte</option>
                            <option value="Virement">Virement</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="newPaymentReference" class="form-label">Référence</label>
                        <input type="text" id="newPaymentReference" class="form-input" placeholder="N° chèque, référence, etc.">
                    </div>
                    <div class="form-group">
                        <label for="newPaymentNotes" class="form-label">Notes</label>
                        <textarea id="newPaymentNotes" class="form-textarea" rows="3" placeholder="Notes optionnelles"></textarea>
                    </div>
                    <div class="form-buttons" style="margin-top: 20px;">
                        <button class="form-btn-reset" onclick="document.getElementById('addPaymentModal').remove()">Annuler</button>
                        <button class="form-btn-submit" id="savePaymentBtn" data-act-index="${actIndex}">
                            <i class="fas fa-save"></i> Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv.firstElementChild);
    
    // Attacher l'événement pour le bouton Enregistrer
    setTimeout(() => {
        const saveBtn = document.getElementById('savePaymentBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                saveNewPayment(parseInt(this.getAttribute('data-act-index')));
            });
        }
    }, 100);
}

// Modifier un acte
function editAct(index) {
    console.log('Editing act:', index);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (index < 0 || index >= acts.length) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    const act = acts[index];
    
    // Ouvrir un modal pour modifier l'acte
    const existingModal = document.getElementById('editActModal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div class="modal" id="editActModal" style="display: flex;">
            <div class="modal-content" style="max-width: 600px; margin: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Modifier l'acte</h3>
                    <button class="close-modal" onclick="document.getElementById('editActModal').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <input type="hidden" id="editActIndex" value="${index}">
                    
                    <div class="form-group">
                        <label for="editActType" class="form-label">Type d'acte *</label>
                        <input type="text" id="editActType" class="form-input" value="${act.type}" placeholder="Extraction, Détartrage, etc." required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editActTooth" class="form-label">Dent *</label>
                        <input type="text" id="editActTooth" class="form-input" value="${act.tooth}" placeholder="14, 15, 16, etc." required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                            <label for="editActPrice" class="form-label">Prix (MAD) *</label>
                            <input type="number" id="editActPrice" class="form-input" value="${act.price}" min="0" step="0.01" required>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label for="editActDate" class="form-label">Date *</label>
                            <input type="date" id="editActDate" class="form-input" value="${act.date}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editActNotes" class="form-label">Notes</label>
                        <textarea id="editActNotes" class="form-textarea" rows="3" placeholder="Notes optionnelles">${act.notes || ''}</textarea>
                    </div>
                    
                    <div class="form-buttons" style="margin-top: 30px; border-top: 1px solid #e1e9f5; padding-top: 20px;">
                        <button class="form-btn-reset" onclick="document.getElementById('editActModal').remove()">Annuler</button>
                        <button class="form-btn-submit" id="updateActBtn">
                            <i class="fas fa-save"></i> Enregistrer les modifications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv.firstElementChild);
    
    // Attacher l'événement pour le bouton Enregistrer
    setTimeout(() => {
        const updateBtn = document.getElementById('updateActBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', function() {
                updateAct(index);
            });
        }
    }, 100);
}

// Mettre à jour un acte
function updateAct(index) {
    console.log('Updating act:', index);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (index < 0 || index >= acts.length) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    const type = document.getElementById('editActType')?.value?.trim() || '';
    const tooth = document.getElementById('editActTooth')?.value?.trim() || '';
    const price = parseFloat(document.getElementById('editActPrice')?.value || 0);
    const date = document.getElementById('editActDate')?.value || '';
    const notes = document.getElementById('editActNotes')?.value?.trim() || '';
    
    if (!type || !tooth || isNaN(price) || price <= 0 || !date) {
        alert('Veuillez remplir tous les champs obligatoires (*).');
        return;
    }
    
    // Sauvegarder les anciens paiements et phases
    const oldAct = acts[index];
    
    acts[index] = {
        ...oldAct,
        type: type,
        tooth: tooth,
        price: price,
        date: date,
        notes: notes,
        updatedAt: new Date().toISOString()
    };
    
    saveActsData();
    
    // Fermer le modal
    const modal = document.getElementById('editActModal');
    if (modal) modal.remove();
    
    // Mettre à jour l'affichage
    displayActsList();
    updateFinancialSummary();
    
    alert('Acte modifié avec succès!');
}

// Supprimer un acte
function deleteAct(index) {
    if (!currentPatientActsId || !actsData[currentPatientActsId]) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet acte et toutes ses phases de traitement et paiements associés ?')) {
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (index < 0 || index >= acts.length) return;
    
    acts.splice(index, 1);
    saveActsData();
    
    // Mettre à jour l'affichage
    displayActsList();
    updateFinancialSummary();
    
    alert('Acte supprimé avec succès!');
}

// Supprimer une phase de traitement
function deleteTreatmentPhase(actIndex, phaseIndex) {
    if (!currentPatientActsId || !actsData[currentPatientActsId]) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette phase de traitement ?')) {
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) return;
    
    const phases = acts[actIndex].treatmentPhases;
    if (phaseIndex < 0 || phaseIndex >= phases.length) return;
    
    phases.splice(phaseIndex, 1);
    saveActsData();
    
    // Mettre à jour l'affichage
    displayActsList();
    
    alert('Phase de traitement supprimée avec succès!');
}

// Modifier un paiement
function editPayment(actIndex, paymentIndex) {
    console.log('Editing payment:', paymentIndex, 'for act:', actIndex);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    const payments = acts[actIndex].payments || [];
    if (paymentIndex < 0 || paymentIndex >= payments.length) {
        alert('Erreur: Paiement non trouvé.');
        return;
    }
    
    const payment = payments[paymentIndex];
    
    // Ouvrir un modal pour modifier le paiement
    const existingModal = document.getElementById('editPaymentModal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div class="modal" id="editPaymentModal" style="display: flex;">
            <div class="modal-content" style="max-width: 600px; margin: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Modifier le paiement</h3>
                    <button class="close-modal" onclick="document.getElementById('editPaymentModal').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <input type="hidden" id="editPaymentActIndex" value="${actIndex}">
                    <input type="hidden" id="editPaymentIndex" value="${paymentIndex}">
                    
                    <div class="form-group">
                        <label for="editPaymentDate" class="form-label">Date *</label>
                        <input type="date" id="editPaymentDate" class="form-input" value="${payment.date}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editPaymentAmount" class="form-label">Montant (DH) *</label>
                        <input type="number" id="editPaymentAmount" class="form-input" value="${payment.amount}" min="0" step="0.01" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editPaymentMethod" class="form-label">Méthode de paiement</label>
                        <select id="editPaymentMethod" class="form-select">
                            <option value="">-- Sélectionner --</option>
                            <option value="Espèces" ${payment.method === 'Espèces' ? 'selected' : ''}>Espèces</option>
                            <option value="Chèque" ${payment.method === 'Chèque' ? 'selected' : ''}>Chèque</option>
                            <option value="Carte" ${payment.method === 'Carte' ? 'selected' : ''}>Carte</option>
                            <option value="Virement" ${payment.method === 'Virement' ? 'selected' : ''}>Virement</option>
                            <option value="Autre" ${payment.method === 'Autre' ? 'selected' : ''}>Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editPaymentReference" class="form-label">Référence</label>
                        <input type="text" id="editPaymentReference" class="form-input" value="${payment.reference || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="editPaymentNotes" class="form-label">Notes</label>
                        <textarea id="editPaymentNotes" class="form-textarea" rows="3">${payment.notes || ''}</textarea>
                    </div>
                    
                    <div class="form-buttons" style="margin-top: 20px;">
                        <button class="form-btn-reset" onclick="document.getElementById('editPaymentModal').remove()">Annuler</button>
                        <button class="form-btn-submit" id="updatePaymentBtn">
                            <i class="fas fa-save"></i> Enregistrer les modifications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv.firstElementChild);
    
    // Attacher l'événement pour le bouton Enregistrer
    setTimeout(() => {
        const updateBtn = document.getElementById('updatePaymentBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', function() {
                updatePayment(actIndex, paymentIndex);
            });
        }
    }, 100);
}

// Mettre à jour un paiement
function updatePayment(actIndex, paymentIndex) {
    console.log('Updating payment:', paymentIndex, 'for act:', actIndex);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    const payments = acts[actIndex].payments;
    if (!payments || paymentIndex < 0 || paymentIndex >= payments.length) {
        alert('Erreur: Paiement non trouvé.');
        return;
    }
    
    const date = document.getElementById('editPaymentDate')?.value || '';
    const amount = parseFloat(document.getElementById('editPaymentAmount')?.value || 0);
    const method = document.getElementById('editPaymentMethod')?.value || '';
    const reference = document.getElementById('editPaymentReference')?.value?.trim() || '';
    const notes = document.getElementById('editPaymentNotes')?.value?.trim() || '';
    
    if (!date || isNaN(amount) || amount <= 0) {
        alert('Veuillez remplir tous les champs obligatoires (*).');
        return;
    }
    
    payments[paymentIndex] = {
        ...payments[paymentIndex],
        date: date,
        amount: amount,
        method: method,
        reference: reference,
        notes: notes,
        updatedAt: new Date().toISOString()
    };
    
    saveActsData();
    
    // Fermer le modal
    const modal = document.getElementById('editPaymentModal');
    if (modal) modal.remove();
    
    // Mettre à jour l'affichage
    displayActsList();
    updateFinancialSummary();
    
    alert('Paiement modifié avec succès!');
}

// Supprimer un paiement
function deletePayment(actIndex, paymentIndex) {
    if (!currentPatientActsId || !actsData[currentPatientActsId]) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) return;
    
    const payments = acts[actIndex].payments;
    if (paymentIndex < 0 || paymentIndex >= payments.length) return;
    
    payments.splice(paymentIndex, 1);
    saveActsData();
    
    // Mettre à jour l'affichage
    displayActsList();
    updateFinancialSummary();
    
    alert('Paiement supprimé avec succès!');
}

// Sauvegarder un nouveau paiement
function saveNewPayment(actIndex) {
    console.log('Saving payment for act:', actIndex);
    
    if (!currentPatientActsId || !actsData[currentPatientActsId]) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    const acts = actsData[currentPatientActsId].acts;
    if (actIndex < 0 || actIndex >= acts.length) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    const date = document.getElementById('newPaymentDate')?.value || '';
    const amount = parseFloat(document.getElementById('newPaymentAmount')?.value || 0);
    const method = document.getElementById('newPaymentMethod')?.value || '';
    const reference = document.getElementById('newPaymentReference')?.value?.trim() || '';
    const notes = document.getElementById('newPaymentNotes')?.value?.trim() || '';
    
    if (!date || isNaN(amount) || amount <= 0) {
        alert('Veuillez remplir tous les champs obligatoires (*).');
        return;
    }
    
    const newPayment = {
        id: Date.now(),
        date: date,
        amount: amount,
        method: method,
        reference: reference,
        notes: notes,
        createdAt: new Date().toISOString()
    };
    
    if (!acts[actIndex].payments) {
        acts[actIndex].payments = [];
    }
    
    acts[actIndex].payments.push(newPayment);
    saveActsData();
    
    // Fermer le modal
    const modal = document.getElementById('addPaymentModal');
    if (modal) modal.remove();
    
    // Mettre à jour l'affichage et les résumés
    displayActsList();
    updateFinancialSummary();
    
    alert('Paiement enregistré avec succès!');
}

// Ajouter un nouvel acte
function addNewAct() {
    console.log('Adding new act');
    
    if (!currentPatientActsId) {
        alert('Aucun patient sélectionné.');
        return;
    }
    
    const type = document.getElementById('actType')?.value?.trim() || '';
    const tooth = document.getElementById('actTooth')?.value?.trim() || '';
    const price = parseFloat(document.getElementById('actPrice')?.value || 0);
    const date = document.getElementById('actDate')?.value || '';
    const notes = document.getElementById('actNotes')?.value?.trim() || '';
    
    if (!type || !tooth || isNaN(price) || price <= 0 || !date) {
        alert('Veuillez remplir tous les champs obligatoires (*).');
        return;
    }
    
    const newAct = {
        id: Date.now(),
        type: type,
        tooth: tooth,
        price: price,
        date: date,
        notes: notes,
        createdAt: new Date().toISOString(),
        treatmentPhases: [],
        payments: []
    };
    
    if (!actsData[currentPatientActsId]) {
        actsData[currentPatientActsId] = { acts: [] };
    }
    
    actsData[currentPatientActsId].acts.push(newAct);
    saveActsData();
    
    // Réinitialiser le formulaire
    const actTypeInput = document.getElementById('actType');
    const actToothInput = document.getElementById('actTooth');
    const actPriceInput = document.getElementById('actPrice');
    const actNotesInput = document.getElementById('actNotes');
    const actDateInput = document.getElementById('actDate');
    
    if (actTypeInput) actTypeInput.value = '';
    if (actToothInput) actToothInput.value = '';
    if (actPriceInput) actPriceInput.value = '';
    if (actNotesInput) actNotesInput.value = '';
    if (actDateInput) actDateInput.value = new Date().toISOString().split('T')[0];
    
    // Mettre à jour l'affichage
    displayActsList();
    updateFinancialSummary();
    
    alert('Acte ajouté avec succès!');
}

// Mettre à jour le résumé financier global
function updateFinancialSummary() {
    if (!currentPatientActsId || !actsData[currentPatientActsId]) return;
    
    const patientData = actsData[currentPatientActsId];
    
    // Calculer le total des actes
    const total = patientData.acts.reduce((sum, act) => sum + act.price, 0);
    
    // Calculer le total payé
    const paid = patientData.acts.reduce((sum, act) => {
        const actPaid = act.payments ? act.payments.reduce((paySum, payment) => paySum + payment.amount, 0) : 0;
        return sum + actPaid;
    }, 0);
    
    // Calculer le reste
    const remaining = total - paid;
    
    // Mettre à jour l'affichage global
    const totalAmount = document.getElementById('totalAmount');
    const paidAmount = document.getElementById('paidAmount');
    const remainingAmount = document.getElementById('remainingAmount');
    
    if (totalAmount) totalAmount.textContent = total.toFixed(2) + ' DH';
    if (paidAmount) paidAmount.textContent = paid.toFixed(2) + ' DH';
    if (remainingAmount) remainingAmount.textContent = remaining.toFixed(2) + ' DH';
    
    // Mettre à jour la couleur du reste
    if (remainingAmount) {
        if (remaining > 0) {
            remainingAmount.style.color = '#e74c3c';
        } else if (remaining < 0) {
            remainingAmount.style.color = '#f39c12';
        } else {
            remainingAmount.style.color = '#00a86b';
        }
    }
    
    saveActsData();
}

function displayPaymentsForAct(actIndex) {
    if (!currentPatientActsId || !actsData[currentPatientActsId] || !actsData[currentPatientActsId].acts[actIndex]) {
        return '<div class="no-data">Aucun paiement</div>';
    }
    
    const act = actsData[currentPatientActsId].acts[actIndex];
    const payments = act.payments || [];
    
    if (payments.length === 0) {
        return `
            <div class="empty-state-small">
                <i class="fas fa-money-bill-wave"></i>
                <p>Aucun paiement enregistré</p>
            </div>
        `;
    }
    
    let html = '<div class="payments-table">';
    
    payments.forEach((payment, paymentIndex) => {
        html += `
            <div class="payment-item">
                <div class="payment-info">
                    <div class="payment-date">${formatShortDate(payment.date)}</div>
                    <div class="payment-details">
                        <div class="payment-amount">
                            <span class="amount-value">${payment.amount.toFixed(2)} DH</span>
                            ${payment.method ? `<small class="payment-method">(${payment.method})</small>` : ''}
                        </div>
                        ${payment.reference ? `<div class="payment-reference"><small>Réf: ${payment.reference}</small></div>` : ''}
                        ${payment.notes ? `<div class="payment-notes"><small>${payment.notes}</small></div>` : ''}
                    </div>
                </div>
                <div class="payment-actions">
                    <button class="btn btn-small btn-edit edit-payment-btn" data-act-index="${actIndex}" data-payment-index="${paymentIndex}" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger delete-payment-btn" data-act-index="${actIndex}" data-payment-index="${paymentIndex}" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    return html;
}

// Fonction utilitaire pour formater les dates
function formatShortDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Exporter les fonctions nécessaires
window.toggleActDetails = toggleActDetails;
window.openAddPhaseModal = openAddPhaseModal;
window.openAddPaymentModal = openAddPaymentModal;
window.saveNewPhase = saveNewPhase;
window.saveNewPayment = saveNewPayment;
window.editAct = editAct;
window.updateAct = updateAct;
window.deleteAct = deleteAct;
window.editTreatmentPhase = editTreatmentPhase;
window.updateTreatmentPhase = updateTreatmentPhase;
window.deleteTreatmentPhase = deleteTreatmentPhase;
window.editPayment = editPayment;
window.updatePayment = updatePayment;
window.deletePayment = deletePayment;
window.viewPhaseImages = viewPhaseImages;
window.changeImage = changeImage;
window.selectImage = selectImage;
window.handlePhotoUpload = handlePhotoUpload;
window.deleteTempPhoto = deleteTempPhoto;
window.handleEditPhotoUpload = handleEditPhotoUpload;
window.deleteExistingPhoto = deleteExistingPhoto;
window.deleteNewPhoto = deleteNewPhoto;