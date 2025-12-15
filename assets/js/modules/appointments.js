// Gestion des rendez-vous

// Variables globales
let currentCalendarDate = new Date();
let currentCalendarView = 'day';
let currentDayViewDate = new Date();
// NOTE: 'storage' sera défini via initAppointments()

// Initialiser la gestion des rendez-vous
function initAppointments(storageInstance) {
    window.storage = storageInstance; // Stockage global
}

// Fonction pour vérifier si un créneau est disponible
function isTimeSlotAvailable(date, time, room, duration, excludeAppointmentId = null) {
    if (!window.storage) return false;
    
    const appointments = window.storage.getAppointmentsByDateAndRoom(date, room);
    const [startHour, startMinute] = time.split(':').map(Number);
    const endTime = new Date(0, 0, 0, startHour, startMinute + duration);
    const appointmentEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    
    for (const appointment of appointments) {
        if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
            continue;
        }
        
        const [appStartHour, appStartMinute] = appointment.time.split(':').map(Number);
        const appEndTime = new Date(0, 0, 0, appStartHour, appStartMinute + parseInt(appointment.duration));
        const appointmentEnd = `${appEndTime.getHours().toString().padStart(2, '0')}:${appEndTime.getMinutes().toString().padStart(2, '0')}`;
        
        // Vérifier les chevauchements
        if ((time >= appointment.time && time < appointmentEnd) ||
            (appointmentEndTime > appointment.time && appointmentEndTime <= appointmentEnd) ||
            (time <= appointment.time && appointmentEndTime >= appointmentEnd)) {
            return false;
        }
    }
    
    return true;
}

// Fonction pour mettre à jour le calendrier (maintenant seulement la vue jour)
function updateCalendar() {
    updateDayView();
}

// Fonction pour mettre à jour la vue jour
function updateDayView() {
    if (!window.storage) return;
    
    const date = window.currentDayViewDate || new Date();
    const dateString = date.toISOString().split('T')[0];
    document.getElementById('currentDayDate').textContent = formatDate(dateString);
    
    // Mettre à jour les deux salles
    updateRoomSchedule('room1Schedule', '1', dateString);
    updateRoomSchedule('room2Schedule', '2', dateString);
    
    // Mettre à jour le statut des salles
    updateRoomStatus();
}

// Fonction pour mettre à jour le planning d'une salle
function updateRoomSchedule(containerId, roomNumber, dateString) {
    if (!window.storage) return;
    
    const container = document.getElementById(containerId);
    const appointments = window.storage.getAppointmentsByDateAndRoom(dateString, roomNumber);
    
    let html = '';
    const timeSlots = generateTimeSlots();
    
    timeSlots.forEach(time => {
        const appointmentAtTime = appointments.find(a => a.time === time);
        
        if (appointmentAtTime) {
            const statusClass = getAppointmentStatusClass(appointmentAtTime.status);
            const endTime = new Date(0, 0, 0, 
                parseInt(appointmentAtTime.time.split(':')[0]), 
                parseInt(appointmentAtTime.time.split(':')[1]) + parseInt(appointmentAtTime.duration));
            const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
            
            html += `
                <div class="time-slot-day">
                    <div class="time-label">${time}</div>
                    <div class="slot-content booked ${statusClass}" data-id="${appointmentAtTime.id}">
                        <div>
                            <div style="font-weight: 600;">${appointmentAtTime.patientName}</div>
                            <div style="font-size: 12px; color: #666;">
                                ${appointmentAtTime.type} | ${time} - ${endTimeStr}
                            </div>
                            <div style="font-size: 11px; color: #888; margin-top: 3px;">
                                Statut: <span class="status-badge status-${appointmentAtTime.status.toLowerCase()}">${appointmentAtTime.status}</span>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-small btn-view view-appointment-btn" data-id="${appointmentAtTime.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-small btn-edit edit-appointment-btn" data-id="${appointmentAtTime.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-small btn-cancel manage-appointment-btn" data-id="${appointmentAtTime.id}">
                                <i class="fas fa-cog"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="time-slot-day">
                    <div class="time-label">${time}</div>
                    <div class="slot-content empty">
                        <div>Aucun rendez-vous</div>
                        <button class="btn btn-small btn-primary add-to-slot-btn" data-time="${time}" data-room="${roomNumber}">
                            <i class="fas fa-plus"></i> Ajouter
                        </button>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
    
    // Ajouter les événements
    container.querySelectorAll('.add-to-slot-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const time = this.getAttribute('data-time');
            const room = this.getAttribute('data-room');
            openAppointmentModal(dateString, time, room);
        });
    });
    
    container.querySelectorAll('.view-appointment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = parseInt(this.getAttribute('data-id'));
            viewAppointmentDetails(appointmentId);
        });
    });
    
    container.querySelectorAll('.edit-appointment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = parseInt(this.getAttribute('data-id'));
            openEditAppointmentModal(appointmentId);
        });
    });
    
    container.querySelectorAll('.manage-appointment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = parseInt(this.getAttribute('data-id'));
            openAppointmentStatusModal(appointmentId);
        });
    });
}

// Fonction pour mettre à jour le statut des salles
function updateRoomStatus() {
    if (!window.storage) return;
    
    const today = new Date().toISOString().split('T')[0];
    const appointmentsTodayRoom1 = window.storage.getAppointmentsByDateAndRoom(today, '1');
    const appointmentsTodayRoom2 = window.storage.getAppointmentsByDateAndRoom(today, '2');
    
    document.getElementById('room1Status').textContent = 
        appointmentsTodayRoom1.length > 0 ? `${appointmentsTodayRoom1.length} RDV aujourd'hui` : 'Disponible';
    document.getElementById('room1Status').className = 
        appointmentsTodayRoom1.length > 0 ? 'room-status status-busy' : 'room-status status-available';
        
    document.getElementById('room2Status').textContent = 
        appointmentsTodayRoom2.length > 0 ? `${appointmentsTodayRoom2.length} RDV aujourd'hui` : 'Disponible';
    document.getElementById('room2Status').className = 
        appointmentsTodayRoom2.length > 0 ? 'room-status status-busy' : 'room-status status-available';
}

// Fonction pour ouvrir le modal de rendez-vous
function openAppointmentModal(date = null, time = null, room = null, patientId = null) {
    if (!window.storage) return;
    
    // Remplir la liste des patients
    const patientSelect = document.getElementById('appointmentPatient');
    patientSelect.innerHTML = '<option value="">Sélectionner un patient</option>';
    
    const patients = window.storage.getPatients();
    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.prenom} ${patient.nom} (${patient.cinPasseport || 'N/A'})`;
        patientSelect.appendChild(option);
        
        // Sélectionner le patient si patientId est fourni
        if (patientId && patient.id.toString() === patientId.toString()) {
            option.selected = true;
        }
    });
    
    // Pré-remplir les champs si fournis
    if (date) {
        document.getElementById('appointmentDate').value = date;
    } else {
        document.getElementById('appointmentDate').value = new Date().toISOString().split('T')[0];
    }
    
    if (time) {
        updateTimeSlots(date || document.getElementById('appointmentDate').value, 
                       room || document.getElementById('appointmentRoom').value, 
                       parseInt(document.getElementById('appointmentDuration').value || 60), 
                       time);
    } else {
        updateTimeSlots(document.getElementById('appointmentDate').value, 
                       document.getElementById('appointmentRoom').value, 
                       parseInt(document.getElementById('appointmentDuration').value || 60));
    }
    
    if (room) {
        document.getElementById('appointmentRoom').value = room;
    }
    
    document.getElementById('appointmentModal').style.display = 'flex';
}

// Mettre à jour les créneaux horaires disponibles
function updateTimeSlots(date, room, duration, selectedTime = null) {
    const timeSelect = document.getElementById('appointmentTime');
    timeSelect.innerHTML = "<option value=''>Sélectionner l'heure</option>";
    
    if (!date || !room || !duration) return;
    
    const timeSlots = generateTimeSlots();
    
    timeSlots.forEach(slot => {
        const isAvailable = isTimeSlotAvailable(date, slot, room, duration);
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot;
        option.disabled = !isAvailable;
        if (!isAvailable) {
            option.textContent += ' (Indisponible)';
        }
        timeSelect.appendChild(option);
        
        // Sélectionner l'heure fournie
        if (selectedTime === slot) {
            option.selected = true;
        }
    });
}

// Fonction pour ouvrir le modal d'édition de rendez-vous
function openEditAppointmentModal(appointmentId) {
    if (!window.storage) return;
    
    const appointment = window.storage.getAppointments().find(a => a.id === appointmentId);
    if (!appointment) return;
    
    document.getElementById('editAppointmentId').value = appointmentId;
    document.getElementById('editPatientName').textContent = appointment.patientName;
    document.getElementById('editAppointmentDate').value = appointment.date;
    document.getElementById('editAppointmentRoom').value = appointment.room;
    document.getElementById('editAppointmentDuration').value = appointment.duration;
    document.getElementById('editAppointmentType').value = appointment.type;
    document.getElementById('editAppointmentNotes').value = appointment.notes || '';
    
    // Remplir les créneaux horaires disponibles
    const timeSelect = document.getElementById('editAppointmentTime');
    timeSelect.innerHTML = "<option value=''>Sélectionner l'heure</option>";
    
    const timeSlots = generateTimeSlots();
    timeSlots.forEach(slot => {
        const isAvailable = isTimeSlotAvailable(appointment.date, slot, appointment.room, parseInt(appointment.duration), appointmentId);
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot;
        option.disabled = !isAvailable;
        if (!isAvailable && slot !== appointment.time) {
            option.textContent += ' (Indisponible)';
        }
        timeSelect.appendChild(option);
        
        // Sélectionner l'heure actuelle
        if (slot === appointment.time) {
            option.selected = true;
        }
    });
    
    document.getElementById('editAppointmentModal').style.display = 'flex';
}

// Fonction pour ouvrir le modal de gestion de statut
function openAppointmentStatusModal(appointmentId) {
    if (!window.storage) return;
    
    const appointment = window.storage.getAppointments().find(a => a.id === appointmentId);
    if (!appointment) return;
    
    document.getElementById('statusAppointmentId').value = appointmentId;
    document.getElementById('statusPatientName').textContent = appointment.patientName;
    document.getElementById('statusDateTime').textContent = formatDateTime(appointment.date, appointment.time);
    document.getElementById('statusSelect').value = appointment.status;
    
    if (appointment.statusReason) {
        document.getElementById('statusReason').value = appointment.statusReason;
    }
    
    document.getElementById('appointmentStatusModal').style.display = 'flex';
}

// Fonction pour afficher les détails d'un rendez-vous
function viewAppointmentDetails(appointmentId) {
    if (!window.storage) return;
    
    const appointment = window.storage.getAppointments().find(a => a.id === appointmentId);
    if (!appointment) return;
    
    const patient = window.storage.getPatientById(appointment.patientId);
    const endTime = new Date(0, 0, 0, 
        parseInt(appointment.time.split(':')[0]), 
        parseInt(appointment.time.split(':')[1]) + parseInt(appointment.duration));
    const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    
    let html = `
        <div class="patient-info-header">
            <div class="patient-info-title">
                <div class="patient-avatar" style="width: 60px; height: 60px; font-size: 24px;">
                    ${(patient.prenom ? patient.prenom[0] : '') + (patient.nom ? patient.nom[0] : '')}
                </div>
                <div>
                    <h2 style="color: #1a6dbb; margin-bottom: 5px;">${appointment.patientName}</h2>
                    <p style="color: #666;">${appointment.type}</p>
                </div>
            </div>
            <div>
                <span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span>
            </div>
        </div>
        
        <div class="patient-info-details">
            <div class="info-section">
                <h4><i class="fas fa-calendar-alt"></i> Informations du rendez-vous</h4>
                <div class="info-row">
                    <div class="info-label">Date:</div>
                    <div class="info-value">${formatDate(appointment.date)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Heure:</div>
                    <div class="info-value">${appointment.time} - ${endTimeStr} (${appointment.duration} min)</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Salle:</div>
                    <div class="info-value">Salle ${appointment.room} - ${appointment.room === '1' ? 'Dentisterie Générale' : 'Chirurgie & Implants'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Statut:</div>
                    <div class="info-value"><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></div>
                </div>
                ${appointment.statusReason ? `
                <div class="info-row">
                    <div class="info-label">Raison:</div>
                    <div class="info-value">${appointment.statusReason}</div>
                </div>` : ''}
            </div>
            
            <div class="info-section">
                <h4><i class="fas fa-user-injured"></i> Informations patient</h4>
                <div class="info-row">
                    <div class="info-label">Téléphone:</div>
                    <div class="info-value">${patient.telephone}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">CIN/Passeport:</div>
                    <div class="info-value">${patient.cinPasseport || 'Non renseigné'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Âge:</div>
                    <div class="info-value">${patient.age} ans</div>
                </div>
            </div>
            
            ${appointment.notes ? `
            <div class="info-section" style="grid-column: 1 / -1;">
                <h4><i class="fas fa-sticky-note"></i> Notes du rendez-vous</h4>
                <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #e1e9f5;">
                    ${appointment.notes.replace(/\n/g, '<br>')}
                </div>
            </div>` : ''}
        </div>
        
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-edit" id="editAppointmentDetailsBtn" data-id="${appointmentId}">
                <i class="fas fa-edit"></i> Modifier
            </button>
            <button class="btn btn-cancel" id="manageAppointmentDetailsBtn" data-id="${appointmentId}">
                <i class="fas fa-cog"></i> Gérer le statut
            </button>
            <button class="btn btn-danger" id="deleteAppointmentDetailsBtn" data-id="${appointmentId}">
                <i class="fas fa-trash"></i> Supprimer
            </button>
        </div>
    `;
    
    // Créer un modal temporaire pour afficher les détails
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3><i class="fas fa-calendar-alt"></i> Détails du rendez-vous</h3>
                <button class="close-modal" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
            </div>
            <div class="patient-info-container">
                ${html}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Ajouter les événements
    setTimeout(() => {
        const editBtn = modal.querySelector('#editAppointmentDetailsBtn');
        const manageBtn = modal.querySelector('#manageAppointmentDetailsBtn');
        const deleteBtn = modal.querySelector('#deleteAppointmentDetailsBtn');
        const closeBtn = modal.querySelector('.close-modal');
        
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                modal.remove();
                openEditAppointmentModal(appointmentId);
            });
        }
        
        if (manageBtn) {
            manageBtn.addEventListener('click', function() {
                modal.remove();
                openAppointmentStatusModal(appointmentId);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
                    window.storage.deleteAppointment(appointmentId);
                    alert('Rendez-vous supprimé avec succès.');
                    modal.remove();
                    updateCalendar();
                    displayAppointmentsTable();
                    if (typeof updateDashboard === 'function') updateDashboard();
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.remove();
            });
        }
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }, 100);
}

// Fonction pour gérer la soumission du formulaire de rendez-vous
function handleAppointmentFormSubmit(e) {
    e.preventDefault();
    
    if (!window.storage) return;
    
    const patientId = document.getElementById('appointmentPatient').value;
    const patient = window.storage.getPatientById(patientId);
    
    if (!patient) {
        alert('Veuillez sélectionner un patient valide.');
        return;
    }
    
    const appointmentData = {
        id: window.storage.generateAppointmentId(),
        patientId: patientId,
        patientName: `${patient.prenom} ${patient.nom}`,
        type: document.getElementById('appointmentType').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        room: document.getElementById('appointmentRoom').value,
        duration: parseInt(document.getElementById('appointmentDuration').value),
        notes: document.getElementById('appointmentNotes').value,
        createdAt: new Date().toISOString(),
        status: 'Confirmé'
    };
    
    // Vérifier la disponibilité
    if (!isTimeSlotAvailable(appointmentData.date, appointmentData.time, appointmentData.room, appointmentData.duration)) {
        alert('Ce créneau horaire n\'est plus disponible. Veuillez en choisir un autre.');
        return;
    }
    
    window.storage.addAppointment(appointmentData);
    alert(`Rendez-vous enregistré pour ${appointmentData.patientName} le ${formatDate(appointmentData.date)} à ${appointmentData.time} (Salle ${appointmentData.room})`);
    
    closeAppointmentModal();
    updateCalendar();
    if (typeof updateDashboard === 'function') updateDashboard();
    displayAppointmentsTable();
    
    // Si on est sur la page patient, mettre à jour l'affichage
    if (typeof currentPatientPageId !== 'undefined' && currentPatientPageId && currentPatientPageId === patientId) {
        if (typeof showPatientPage === 'function') showPatientPage(patientId);
    }
}

// Fonction pour gérer la sauvegarde des modifications de rendez-vous
function handleEditAppointmentSave() {
    if (!window.storage) return;
    
    const appointmentId = parseInt(document.getElementById('editAppointmentId').value);
    const appointment = window.storage.getAppointments().find(a => a.id === appointmentId);
    
    if (!appointment) return;
    
    const updatedAppointment = {
        ...appointment,
        date: document.getElementById('editAppointmentDate').value,
        time: document.getElementById('editAppointmentTime').value,
        room: document.getElementById('editAppointmentRoom').value,
        duration: parseInt(document.getElementById('editAppointmentDuration').value),
        type: document.getElementById('editAppointmentType').value,
        notes: document.getElementById('editAppointmentNotes').value
    };
    
    // Vérifier la disponibilité
    if (!isTimeSlotAvailable(updatedAppointment.date, updatedAppointment.time, updatedAppointment.room, updatedAppointment.duration, appointmentId)) {
        alert('Ce créneau horaire n\'est plus disponible. Veuillez en choisir un autre.');
        return;
    }
    
    if (window.storage.updateAppointment(updatedAppointment)) {
        alert('Rendez-vous modifié avec succès.');
        closeEditAppointmentModal();
        updateCalendar();
        displayAppointmentsTable();
        if (typeof updateDashboard === 'function') updateDashboard();
    }
}

// Fonction pour afficher le tableau des rendez-vous
function displayAppointmentsTable() {
    if (!window.storage) return;
    
    const container = document.getElementById('appointmentsTableContainer');
    const appointments = window.storage.getAppointments();
    
    // Appliquer les filtres
    const filterDate = document.getElementById('filterDate').value;
    const filterPatient = document.getElementById('filterPatient').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const filterRoom = document.getElementById('filterRoom').value;
    
    let filteredAppointments = appointments;
    
    if (filterDate) {
        filteredAppointments = filteredAppointments.filter(a => a.date === filterDate);
    }
    
    if (filterPatient) {
        filteredAppointments = filteredAppointments.filter(a => a.patientId.toString() === filterPatient.toString());
    }
    
    if (filterStatus) {
        filteredAppointments = filteredAppointments.filter(a => a.status === filterStatus);
    }
    
    if (filterRoom) {
        filteredAppointments = filteredAppointments.filter(a => a.room === filterRoom);
    }
    
    // Trier par date et heure
    filteredAppointments.sort((a, b) => {
        if (a.date === b.date) {
            return a.time.localeCompare(b.time);
        }
        return new Date(b.date) - new Date(a.date);
    });
    
    if (filteredAppointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>Aucun rendez-vous trouvé</h3>
                <p>Essayez de modifier vos critères de filtrage ou créez un nouveau rendez-vous.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="patients-table">
            <thead>
                <tr>
                    <th>Date & Heure</th>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Salle</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredAppointments.forEach(appointment => {
        const endTime = new Date(0, 0, 0, 
            parseInt(appointment.time.split(':')[0]), 
            parseInt(appointment.time.split(':')[1]) + parseInt(appointment.duration));
        const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
        
        html += `
            <tr>
                <td>
                    <div style="font-weight: 600;">${formatShortDate(appointment.date)}</div>
                    <div class="patient-id">${appointment.time} - ${endTimeStr}</div>
                </td>
                <td>
                    <div class="patient-name">${appointment.patientName}</div>
                    <div class="patient-id">${appointment.patientId}</div>
                </td>
                <td>${appointment.type}</td>
                <td>Salle ${appointment.room}</td>
                <td>${appointment.duration} min</td>
                <td>
                    <span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-small btn-view view-appointment-table-btn" data-id="${appointment.id}">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                    <button class="btn btn-small btn-edit edit-appointment-table-btn" data-id="${appointment.id}">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-small btn-cancel manage-appointment-table-btn" data-id="${appointment.id}">
                        <i class="fas fa-cog"></i> Statut
                    </button>
                    <button class="btn btn-small btn-danger delete-appointment-table-btn" data-id="${appointment.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
    
    // Ajouter les événements
    container.querySelectorAll('.view-appointment-table-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = parseInt(this.getAttribute('data-id'));
            viewAppointmentDetails(appointmentId);
        });
    });
    
    container.querySelectorAll('.edit-appointment-table-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = parseInt(this.getAttribute('data-id'));
            openEditAppointmentModal(appointmentId);
        });
    });
    
    container.querySelectorAll('.manage-appointment-table-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = parseInt(this.getAttribute('data-id'));
            openAppointmentStatusModal(appointmentId);
        });
    });
    
    container.querySelectorAll('.delete-appointment-table-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = parseInt(this.getAttribute('data-id'));
            if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
                window.storage.deleteAppointment(appointmentId);
                displayAppointmentsTable();
                updateCalendar();
                if (typeof updateDashboard === 'function') updateDashboard();
                alert('Rendez-vous supprimé avec succès.');
            }
        });
    });
}

// Fermer le modal de rendez-vous
function closeAppointmentModal() {
    document.getElementById('appointmentModal').style.display = 'none';
}

// Fermer le modal de statut
function closeAppointmentStatusModal() {
    document.getElementById('appointmentStatusModal').style.display = 'none';
}

// Fermer le modal d'édition de rendez-vous
function closeEditAppointmentModal() {
    document.getElementById('editAppointmentModal').style.display = 'none';
}

// Remplir le filtre des patients
function populatePatientFilter() {
    if (!window.storage) return;
    
    const patients = window.storage.getPatients();
    const filterPatient = document.getElementById('filterPatient');
    filterPatient.innerHTML = '<option value="">Tous les patients</option>';
    
    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.prenom} ${patient.nom} (${patient.cinPasseport || 'N/A'})`;
        filterPatient.appendChild(option);
    });
}