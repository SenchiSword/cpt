// Fonctions utilitaires

// Formater une date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Formater une date courte
function formatShortDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

// Formater l'heure
function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

// Formater la date et l'heure
function formatDateTime(dateString, timeString) {
    return `${formatShortDate(dateString)} ${formatTime(timeString)}`;
}

// Fonction pour calculer l'âge à partir de la date de naissance
function calculateAge(birthDateString) {
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

// Obtenir le prochain ID patient selon le nouveau format
function getNextPatientId(storage) {
    const patients = storage.getPatients();
    const currentYear = new Date().getFullYear().toString();
    
    // Obtenir le dernier ID de l'année en cours
    const lastPatientCurrentYear = patients
        .filter(patient => {
            // Extraire l'année de l'ID existant
            const idParts = patient.id ? patient.id.toString().split('/') : [];
            return idParts.length === 2 && idParts[1] === currentYear;
        })
        .sort((a, b) => {
            // Trier par numéro séquentiel
            const numA = parseInt(a.id.toString().split('/')[0]) || 0;
            const numB = parseInt(b.id.toString().split('/')[0]) || 0;
            return numB - numA;
        })[0];
    
    if (lastPatientCurrentYear && lastPatientCurrentYear.id) {
        // Extraire le numéro séquentiel et l'incrémenter
        const lastIdParts = lastPatientCurrentYear.id.toString().split('/');
        const lastNumber = parseInt(lastIdParts[0]) || 0;
        const nextNumber = (lastNumber + 1).toString().padStart(2, '0');
        return `${nextNumber}/${currentYear}`;
    } else {
        // Premier patient de l'année
        return `01/${currentYear}`;
    }
}

// Formater l'affichage de l'ID patient
function formatPatientIdForDisplay(patientId) {
    if (!patientId) return 'N/A';
    const idParts = patientId.toString().split('/');
    
    if (idParts.length === 2) {
        return `PA-${idParts[0]}/${idParts[1]}`;
    }
    return `PA-${patientId}`;
}

// Obtenir la classe CSS selon le statut du rendez-vous
function getAppointmentStatusClass(status) {
    switch(status) {
        case 'Annulé': return 'cancelled';
        case 'Absent': return 'absent';
        case 'Terminé': return 'completed';
        default: return '';
    }
}

// Générer les créneaux horaires
function generateTimeSlots() {
    const timeSlots = [];
    for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeSlots.push(time);
        }
    }
    return timeSlots;
}