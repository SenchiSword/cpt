// Système de stockage local avec fichiers
class LocalFileStorage {
    constructor() {
        this.dataDir = 'dental_clinic_data';
        this.sessionKey = 'dental_clinic_session';
        this.initStorage();
    }
    
    initStorage() {
        if (!localStorage.getItem(this.dataDir)) {
            const initialStructure = {
                patients: [],
                appointments: [],
                users: [],
                labWorks: [],
                settings: {},
                lastBackup: null
            };
            localStorage.setItem(this.dataDir, JSON.stringify(initialStructure));
            this.createDefaultUsers();
        }
    }
    
    createDefaultUsers() {
        const data = this.getData();
        if (data.users.length === 0) {
            const adminUser = {
                id: 1,
                username: 'admin',
                password: this.hashPassword('admin123'),
                fullName: 'Administrateur',
                role: 'admin',
                email: 'admin@cabinetdentaire.local',
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            
            const user = {
                id: 2,
                username: 'user',
                password: this.hashPassword('user123'),
                fullName: 'Utilisateur Standard',
                role: 'user',
                email: 'user@cabinetdentaire.local',
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            
            data.users = [adminUser, user];
            this.saveData(data);
        }
    }
    
    getData() {
        const data = localStorage.getItem(this.dataDir);
        return JSON.parse(data || '{}');
    }
    
    saveData(data) {
        localStorage.setItem(this.dataDir, JSON.stringify(data));
    }
    
    // Gestion de la session
    saveSession(user) {
        localStorage.setItem(this.sessionKey, JSON.stringify(user));
    }
    
    getSession() {
        const session = localStorage.getItem(this.sessionKey);
        return session ? JSON.parse(session) : null;
    }
    
    clearSession() {
        localStorage.removeItem(this.sessionKey);
    }
    
    hashPassword(password) {
        // Utilisation de CryptoJS pour le hachage
        if (typeof CryptoJS !== 'undefined') {
            return CryptoJS.SHA256(password).toString();
        }
        // Fallback simple si CryptoJS n'est pas disponible
        return btoa(password);
    }
    
    verifyPassword(inputPassword, storedHash) {
        return this.hashPassword(inputPassword) === storedHash;
    }
    
    // Gestion des patients
    getPatients() {
        const data = this.getData();
        return data.patients || [];
    }
    
    savePatients(patients) {
        const data = this.getData();
        data.patients = patients;
        this.saveData(data);
    }
    
    addPatient(patient) {
        const patients = this.getPatients();
        patients.push(patient);
        this.savePatients(patients);
    }
    
    updatePatient(updatedPatient) {
        const patients = this.getPatients();
        const index = patients.findIndex(p => p.id.toString() === updatedPatient.id.toString());
        if (index !== -1) {
            patients[index] = updatedPatient;
            this.savePatients(patients);
            return true;
        }
        return false;
    }
    
    deletePatient(patientId) {
        const patients = this.getPatients();
        const filteredPatients = patients.filter(p => p.id.toString() !== patientId.toString());
        this.savePatients(filteredPatients);
        return filteredPatients.length !== patients.length;
    }
    
    getPatientById(patientId) {
        const patients = this.getPatients();
        return patients.find(p => p.id.toString() === patientId.toString());
    }
    
    searchPatients(query) {
        const patients = this.getPatients();
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) return patients;
        
        return patients.filter(patient => {
            const fullName = `${patient.prenom} ${patient.nom}`.toLowerCase();
            const cin = patient.cinPasseport ? patient.cinPasseport.toLowerCase() : '';
            const id = patient.id.toString().toLowerCase();
            
            return fullName.includes(searchTerm) || 
                   cin.includes(searchTerm) || 
                   id.includes(searchTerm) ||
                   patient.prenom.toLowerCase().includes(searchTerm) ||
                   patient.nom.toLowerCase().includes(searchTerm);
        });
    }
    
    // Gestion des rendez-vous
    getAppointments() {
        const data = this.getData();
        return data.appointments || [];
    }
    
    saveAppointments(appointments) {
        const data = this.getData();
        data.appointments = appointments;
        this.saveData(data);
    }
    
    addAppointment(appointment) {
        const appointments = this.getAppointments();
        appointments.push(appointment);
        this.saveAppointments(appointments);
    }
    
    updateAppointment(updatedAppointment) {
        const appointments = this.getAppointments();
        const index = appointments.findIndex(a => a.id === updatedAppointment.id);
        if (index !== -1) {
            appointments[index] = updatedAppointment;
            this.saveAppointments(appointments);
            return true;
        }
        return false;
    }
    
    deleteAppointment(appointmentId) {
        const appointments = this.getAppointments();
        const filteredAppointments = appointments.filter(a => a.id !== appointmentId);
        this.saveAppointments(filteredAppointments);
        return filteredAppointments.length !== appointments.length;
    }
    
    updateAppointmentStatus(appointmentId, status, reason = '') {
        const appointments = this.getAppointments();
        const index = appointments.findIndex(a => a.id === appointmentId);
        if (index !== -1) {
            appointments[index].status = status;
            if (reason) {
                appointments[index].statusReason = reason;
            }
            this.saveAppointments(appointments);
            return true;
        }
        return false;
    }
    
    getAppointmentsByDateAndRoom(date, room) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.date === date && a.room === room && a.status !== 'Annulé');
    }
    
    getAppointmentsByPatient(patientId) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.patientId.toString() === patientId.toString());
    }
    
    getAppointmentsByDate(date) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.date === date);
    }
    
    // Gestion des utilisateurs
    getUsers() {
        const data = this.getData();
        return data.users || [];
    }
    
    saveUsers(users) {
        const data = this.getData();
        data.users = users;
        this.saveData(data);
    }
    
    authenticate(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);
        
        if (user && this.verifyPassword(password, user.password)) {
            user.lastLogin = new Date().toISOString();
            const users = this.getUsers();
            const index = users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                users[index] = user;
                this.saveUsers(users);
            }
            
            const sessionUser = {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                email: user.email
            };
            
            this.saveSession(sessionUser);
            return sessionUser;
        }
        return null;
    }
    
    addUser(userData) {
        const users = this.getUsers();
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        
        const newUser = {
            id: newId,
            username: userData.username,
            password: this.hashPassword(userData.password),
            fullName: userData.fullName,
            role: userData.role,
            email: userData.email,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }
    
    deleteUser(userId) {
        const users = this.getUsers();
        const filteredUsers = users.filter(u => u.id !== userId);
        this.saveUsers(filteredUsers);
        return filteredUsers.length !== users.length;
    }
    
    // Gestion des Lab Works
    getLabWorks() {
        const data = this.getData();
        return data.labWorks || [];
    }

    saveLabWorks(labWorks) {
        const data = this.getData();
        data.labWorks = labWorks;
        this.saveData(data);
    }

    addLabWork(labWork) {
        const labWorks = this.getLabWorks();
        labWorks.push(labWork);
        this.saveLabWorks(labWorks);
    }

    updateLabWork(updatedLabWork) {
        const labWorks = this.getLabWorks();
        const index = labWorks.findIndex(l => l.id === updatedLabWork.id);
        if (index !== -1) {
            labWorks[index] = updatedLabWork;
            this.saveLabWorks(labWorks);
            return true;
        }
        return false;
    }

    deleteLabWork(labWorkId) {
        const labWorks = this.getLabWorks();
        const filteredLabWorks = labWorks.filter(l => l.id !== labWorkId);
        this.saveLabWorks(filteredLabWorks);
        return filteredLabWorks.length !== labWorks.length;
    }

    getLabWorkById(labWorkId) {
        const labWorks = this.getLabWorks();
        return labWorks.find(l => l.id === labWorkId);
    }

    searchLabWorks(query, statusFilter = '') {
        const labWorks = this.getLabWorks();
        const searchTerm = query.toLowerCase().trim();
        
        return labWorks.filter(labWork => {
            const matchesSearch = !searchTerm || 
                (labWork.labName && labWork.labName.toLowerCase().includes(searchTerm)) ||
                (labWork.patientName && labWork.patientName.toLowerCase().includes(searchTerm)) ||
                (labWork.typeWork && labWork.typeWork.toLowerCase().includes(searchTerm));
            
            const matchesStatus = !statusFilter || labWork.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }

    generateLabWorkId() {
        const labWorks = this.getLabWorks();
        return labWorks.length > 0 ? Math.max(...labWorks.map(l => l.id)) + 1 : 1;
    }
    
    // Export/Import
    exportData() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sauvegarde_cabinet_dentaire_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        data.lastBackup = new Date().toISOString();
        this.saveData(data);
    }
    
    importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.saveData(importedData);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
            return false;
        }
    }
    
    clearAllData() {
        localStorage.removeItem(this.dataDir);
        localStorage.removeItem(this.sessionKey);
        this.initStorage();
    }
    
    // Générer un ID unique pour les rendez-vous
    generateAppointmentId() {
        const appointments = this.getAppointments();
        return appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1;
    }
}