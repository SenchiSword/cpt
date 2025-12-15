// Gestion des travaux de laboratoire

function initLabWorks(storageInstance) {
    window.storage = storageInstance;
}

// Afficher le tableau des Lab Works
function displayLabWorksTable(query = '', statusFilter = '') {
    if (!window.storage) return;
    
    const container = document.getElementById('labWorksTableBody');
    const labWorks = window.storage.searchLabWorks(query, statusFilter);
    
    if (labWorks.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="9" class="no-data">
                    <div class="empty-state">
                        <i class="fas fa-flask"></i>
                        <h3>Aucun travail de laboratoire trouvé</h3>
                        <p>Commencez par ajouter un nouveau travail de laboratoire</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    labWorks.forEach(labWork => {
        // Format des dates
        const dateSent = formatShortDate(labWork.dateSent);
        const dateExpectation = formatShortDate(labWork.dateExpectation);
        
        // Classe CSS pour le statut
        let statusClass = 'status-pending';
        if (labWork.status === 'Completed' || labWork.status === 'Ready') {
            statusClass = 'status-active';
        } else if (labWork.status === 'Delayed') {
            statusClass = 'status-inactive';
        } else if (labWork.status === 'In Progress') {
            statusClass = 'status-confirmed';
        }
        
        html += `
            <tr>
                <td>${dateSent}</td>
                <td>${dateExpectation}</td>
                <td><strong>${labWork.labName || 'N/A'}</strong></td>
                <td>${labWork.phone || 'N/A'}</td>
                <td>${labWork.typeWork || 'N/A'}</td>
                <td>
                    <div class="patient-name">${labWork.patientName || 'N/A'}</div>
                    ${labWork.patientId ? `<div class="patient-id">ID: ${labWork.patientId}</div>` : ''}
                </td>
                <td>${labWork.tooth || 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${labWork.status || 'Not Started'}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-small btn-edit edit-lab-work-btn" data-id="${labWork.id}">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-small btn-delete delete-lab-work-btn" data-id="${labWork.id}">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
    
    // Ajouter les événements
    container.querySelectorAll('.edit-lab-work-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const labWorkId = parseInt(this.getAttribute('data-id'));
            openLabWorkModal(labWorkId);
        });
    });
    
    container.querySelectorAll('.delete-lab-work-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const labWorkId = parseInt(this.getAttribute('data-id'));
            if (confirm('Êtes-vous sûr de vouloir supprimer ce travail de laboratoire ?')) {
                if (window.storage.deleteLabWork(labWorkId)) {
                    displayLabWorksTable();
                    alert('Travail de laboratoire supprimé avec succès.');
                }
            }
        });
    });
}

// Ouvrir le modal pour ajouter/modifier un Lab Work
function openLabWorkModal(labWorkId = null) {
    const modal = document.getElementById('labWorkModal');
    if (!modal) return;
    
    const title = document.getElementById('labWorkModalTitle');
    const submitBtn = document.getElementById('submitLabWorkBtn');
    
    if (labWorkId) {
        // Mode édition
        const labWork = window.storage.getLabWorkById(labWorkId);
        if (!labWork) return;
        
        title.textContent = 'Modifier le travail de laboratoire';
        submitBtn.textContent = 'Mettre à jour';
        
        // Remplir le formulaire
        document.getElementById('labWorkId').value = labWork.id;
        document.getElementById('labName').value = labWork.labName || '';
        document.getElementById('labPhone').value = labWork.phone || '';
        document.getElementById('labWorkType').value = labWork.typeWork || '';
        document.getElementById('labWorkTooth').value = labWork.tooth || '';
        document.getElementById('labWorkStatus').value = labWork.status || 'Not Started';
        document.getElementById('labWorkDateSent').value = labWork.dateSent || '';
        document.getElementById('labWorkDateExpectation').value = labWork.dateExpectation || '';
        document.getElementById('labWorkNotes').value = labWork.notes || '';
        
        // Remplir les informations patient
        if (labWork.patientId) {
            const patient = window.storage.getPatientById(labWork.patientId);
            if (patient) {
                document.getElementById('labWorkPatientSelect').value = labWork.patientId;
                document.getElementById('selectedPatientName').textContent = `${patient.prenom} ${patient.nom}`;
            }
        }
    } else {
        // Mode création
        title.textContent = 'Nouveau travail de laboratoire';
        submitBtn.textContent = 'Enregistrer';
        
        // Réinitialiser le formulaire
        document.getElementById('labWorkForm').reset();
        document.getElementById('labWorkId').value = '';
        document.getElementById('labWorkDateSent').value = new Date().toISOString().split('T')[0];
        
        // Calculer la date d'expectation par défaut (7 jours)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        document.getElementById('labWorkDateExpectation').value = nextWeek.toISOString().split('T')[0];
        
        document.getElementById('selectedPatientName').textContent = 'Aucun patient sélectionné';
    }
    
    modal.style.display = 'flex';
}

// Fermer le modal
function closeLabWorkModal() {
    const modal = document.getElementById('labWorkModal');
    if (modal) modal.style.display = 'none';
}

// Gérer la soumission du formulaire
function handleLabWorkFormSubmit(e) {
    e.preventDefault();
    
    if (!window.storage) return;
    
    const form = document.getElementById('labWorkForm');
    const labWorkId = document.getElementById('labWorkId').value;
    const patientId = document.getElementById('labWorkPatientSelect').value;
    const patient = patientId ? window.storage.getPatientById(patientId) : null;
    
    const labWorkData = {
        id: labWorkId ? parseInt(labWorkId) : window.storage.generateLabWorkId(),
        dateSent: document.getElementById('labWorkDateSent').value,
        dateExpectation: document.getElementById('labWorkDateExpectation').value,
        labName: document.getElementById('labName').value,
        phone: document.getElementById('labPhone').value,
        typeWork: document.getElementById('labWorkType').value,
        tooth: document.getElementById('labWorkTooth').value,
        status: document.getElementById('labWorkStatus').value,
        notes: document.getElementById('labWorkNotes').value,
        patientId: patientId || null,
        patientName: patient ? `${patient.prenom} ${patient.nom}` : ''
    };
    
    if (labWorkId) {
        // Mise à jour
        if (window.storage.updateLabWork(labWorkData)) {
            alert('Travail de laboratoire mis à jour avec succès.');
        }
    } else {
        // Création
        window.storage.addLabWork(labWorkData);
        alert('Travail de laboratoire ajouté avec succès.');
    }
    
    closeLabWorkModal();
    displayLabWorksTable();
}

// Mettre à jour le sélecteur de patient
function updateLabWorkPatientSelect() {
    if (!window.storage) return;
    
    const select = document.getElementById('labWorkPatientSelect');
    const patients = window.storage.getPatients();
    
    let html = '<option value="">Sélectionner un patient...</option>';
    
    patients.forEach(patient => {
        html += `<option value="${patient.id}">${patient.prenom} ${patient.nom} (ID: ${patient.id})</option>`;
    });
    
    if (select) select.innerHTML = html;
    
    // Événement pour mettre à jour le nom affiché
    if (select) {
        select.addEventListener('change', function() {
            const patientId = this.value;
            const patientNameSpan = document.getElementById('selectedPatientName');
            
            if (patientId) {
                const patient = window.storage.getPatientById(patientId);
                if (patient) {
                    patientNameSpan.textContent = `${patient.prenom} ${patient.nom}`;
                }
            } else {
                patientNameSpan.textContent = 'Aucun patient sélectionné';
            }
        });
    }
}

// Exporter en Excel - VERSION FONCTIONNELLE
function exportLabWorksToExcel() {
    if (!window.storage) return;
    
    const labWorks = window.storage.getLabWorks();
    
    if (labWorks.length === 0) {
        alert('Aucun travail de laboratoire à exporter.');
        return;
    }
    
    // Créer les données pour Excel
    const excelData = labWorks.map(labWork => {
        // Récupérer le patient si disponible
        let patientInfo = 'N/A';
        if (labWork.patientId) {
            const patient = window.storage.getPatientById(labWork.patientId);
            if (patient) {
                patientInfo = `${patient.prenom} ${patient.nom} (ID: ${patient.id})`;
            }
        }
        
        return {
            'Date d\'envoi': formatShortDate(labWork.dateSent),
            'Date de retour attendue': formatShortDate(labWork.dateExpectation),
            'Laboratoire': labWork.labName || 'N/A',
            'Téléphone': labWork.phone || 'N/A',
            'Type de travail': labWork.typeWork || 'N/A',
            'Patient': labWork.patientName || patientInfo,
            'ID Patient': labWork.patientId || 'N/A',
            'Dent': labWork.tooth || 'N/A',
            'Statut': labWork.status || 'Not Started',
            'Notes': labWork.notes || '',
            'Date création': labWork.createdAt ? formatShortDate(labWork.createdAt) : 'N/A'
        };
    });
    
    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    
    // Créer une feuille de calcul
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Définir la largeur des colonnes
    const colWidths = [
        { wch: 15 }, // Date d'envoi
        { wch: 20 }, // Date de retour
        { wch: 25 }, // Laboratoire
        { wch: 15 }, // Téléphone
        { wch: 20 }, // Type de travail
        { wch: 25 }, // Patient
        { wch: 15 }, // ID Patient
        { wch: 10 }, // Dent
        { wch: 15 }, // Statut
        { wch: 30 }, // Notes
        { wch: 15 }  // Date création
    ];
    ws['!cols'] = colWidths;
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, 'Travaux Laboratoire');
    
    // Générer la date pour le nom du fichier
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Exporter le fichier
    XLSX.writeFile(wb, `travaux_laboratoire_${dateStr}.xlsx`);
    
    // Afficher une confirmation
    alert(`Export réussi !\n${labWorks.length} travaux de laboratoire exportés vers "travaux_laboratoire_${dateStr}.xlsx"`);
}

// Initialiser les événements Lab Works
function initLabWorksEvents() {
    // Recherche
    const searchLabWorksBtn = document.getElementById('searchLabWorksBtn');
    const searchLabNameInput = document.getElementById('searchLabNameInput');
    const filterLabStatus = document.getElementById('filterLabStatus');
    const clearLabWorksSearchBtn = document.getElementById('clearLabWorksSearchBtn');
    
    if (searchLabWorksBtn) {
        searchLabWorksBtn.addEventListener('click', function() {
            const query = searchLabNameInput?.value?.trim() || '';
            const statusFilter = filterLabStatus?.value || '';
            displayLabWorksTable(query, statusFilter);
        });
    }
    
    if (searchLabNameInput) {
        searchLabNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                const statusFilter = filterLabStatus?.value || '';
                displayLabWorksTable(query, statusFilter);
            }
        });
    }
    
    if (filterLabStatus) {
        filterLabStatus.addEventListener('change', function() {
            const query = searchLabNameInput?.value?.trim() || '';
            const statusFilter = this.value;
            displayLabWorksTable(query, statusFilter);
        });
    }
    
    if (clearLabWorksSearchBtn) {
        clearLabWorksSearchBtn.addEventListener('click', function() {
            if (searchLabNameInput) searchLabNameInput.value = '';
            if (filterLabStatus) filterLabStatus.value = '';
            displayLabWorksTable();
        });
    }
    
    // Ajouter Lab Work
    const addLabWorkBtn = document.getElementById('addLabWorkBtn');
    if (addLabWorkBtn) {
        addLabWorkBtn.addEventListener('click', function() {
            openLabWorkModal();
        });
    }
    
    // Export Excel
    const exportLabWorksExcelBtn = document.getElementById('exportLabWorksExcelBtn');
    if (exportLabWorksExcelBtn) {
        exportLabWorksExcelBtn.addEventListener('click', exportLabWorksToExcel);
    }
    
    // Retour au dashboard
    const backToDashboardFromLabWorksBtn = document.getElementById('backToDashboardFromLabWorksBtn');
    if (backToDashboardFromLabWorksBtn) {
        backToDashboardFromLabWorksBtn.addEventListener('click', showDashboard);
    }
    
    // Formulaire
    const labWorkForm = document.getElementById('labWorkForm');
    if (labWorkForm) {
        labWorkForm.addEventListener('submit', handleLabWorkFormSubmit);
    }
    
    // Fermer le modal
    const closeLabWorkModalBtn = document.getElementById('closeLabWorkModalBtn');
    if (closeLabWorkModalBtn) {
        closeLabWorkModalBtn.addEventListener('click', closeLabWorkModal);
    }
    
    // Fermer en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('labWorkModal')) {
            closeLabWorkModal();
        }
    });
}
window.exportLabWorksToExcel = exportLabWorksToExcel;