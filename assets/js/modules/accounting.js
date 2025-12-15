// Gestion comptable et facturation

// Variables globales
let accountingData = {};

// Initialiser la gestion comptable
function initAccounting(storageInstance) {
    window.storage = storageInstance;
    loadAccountingData();
}

// Charger les données comptables depuis le stockage
function loadAccountingData() {
    const savedData = localStorage.getItem('dental_clinic_accounting');
    if (savedData) {
        accountingData = JSON.parse(savedData);
    } else {
        accountingData = {
            invoices: {},
            nextInvoiceNumber: {}
        };
        saveAccountingData();
    }
}

// Sauvegarder les données comptables
function saveAccountingData() {
    localStorage.setItem('dental_clinic_accounting', JSON.stringify(accountingData));
}

// Générer un numéro de facture
function generateInvoiceNumber(year = null) {
    if (!year) {
        year = new Date().getFullYear().toString();
    }
    
    if (!accountingData.nextInvoiceNumber[year]) {
        accountingData.nextInvoiceNumber[year] = 1;
    }
    
    const invoiceNumber = accountingData.nextInvoiceNumber[year];
    const formattedNumber = invoiceNumber.toString().padStart(2, '0');
    accountingData.nextInvoiceNumber[year]++;
    saveAccountingData();
    
    return `FA-${formattedNumber}/${year}`;
}

// Afficher le tableau comptable
function displayAccountingTable(searchQuery = '', invoiceFilter = '', patientFilter = '') {
    if (!window.storage) return;
    
    const container = document.getElementById('accountingTableBody');
    const actsData = loadAllActsData();
    
    // Récupérer tous les actes payés en totalité
    let paidActs = [];
    
    // Parcourir tous les patients et leurs actes
    for (const patientId in actsData) {
        if (actsData[patientId] && actsData[patientId].acts) {
            const patient = window.storage.getPatientById(patientId);
            if (!patient) continue;
            
            actsData[patientId].acts.forEach((act, actIndex) => {
                // Calculer le total payé pour cet acte
                const actPaid = act.payments ? act.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                
                // Vérifier si l'acte est totalement payé
                if (actPaid >= act.price) {
                    // Récupérer la facture associée si elle existe
                    const invoiceNumber = accountingData.invoices[`${patientId}-${actIndex}`] || '';
                    
                    paidActs.push({
                        patientId: patientId,
                        patientName: `${patient.prenom} ${patient.nom}`,
                        actIndex: actIndex,
                        type: act.type,
                        tooth: act.tooth,
                        price: act.price,
                        date: act.date,
                        paidAmount: actPaid,
                        invoiceNumber: invoiceNumber,
                        createdAt: act.createdAt
                    });
                }
            });
        }
    }
    
    // Appliquer les filtres
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        paidActs = paidActs.filter(act => 
            act.patientName.toLowerCase().includes(query) ||
            act.type.toLowerCase().includes(query) ||
            act.invoiceNumber.toLowerCase().includes(query)
        );
    }
    
    if (invoiceFilter === 'non-facture') {
        paidActs = paidActs.filter(act => !act.invoiceNumber);
    } else if (invoiceFilter === 'facture') {
        paidActs = paidActs.filter(act => act.invoiceNumber);
    }
    
    if (patientFilter) {
        paidActs = paidActs.filter(act => act.patientId.toString() === patientFilter.toString());
    }
    
    // Trier par date (du plus récent au plus ancien)
    paidActs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (paidActs.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <i class="fas fa-file-invoice-dollar"></i>
                        <h3>Aucun acte payé trouvé</h3>
                        <p>Les actes totalement payés apparaîtront ici pour facturation.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    paidActs.forEach(act => {
        html += `
            <tr>
                <td>${formatShortDate(act.date)}</td>
                <td>
                    <div style="font-weight: 600;">${act.type}</div>
                </td>
                <td>
                    <div class="patient-name">${act.patientName}</div>
                    <div class="patient-id">ID: ${formatPatientIdForDisplay(act.patientId)}</div>
                </td>
                <td>${act.tooth}</td>
                <td>
                    <div style="font-weight: 600; color: #00a86b;">${act.price.toFixed(2)} DH</div>
                    <div style="font-size: 12px; color: #666;">Payé: ${act.paidAmount.toFixed(2)} DH</div>
                </td>
                <td id="invoiceCell-${act.patientId}-${act.actIndex}">
                    ${act.invoiceNumber ? 
                        `<span class="status-badge status-active">${act.invoiceNumber}</span>` : 
                        `<span class="status-badge status-pending">Non facturé</span>`
                    }
                </td>
                <td class="actions-cell">
                    ${!act.invoiceNumber ? `
                        <button class="btn btn-small btn-success generate-invoice-btn" 
                                data-patient-id="${act.patientId}" 
                                data-act-index="${act.actIndex}">
                            <i class="fas fa-file-invoice"></i> Générer
                        </button>
                    ` : `
                        <button class="btn btn-small btn-print" onclick="printInvoice('${act.patientId}', ${act.actIndex})">
                            <i class="fas fa-print"></i> Imprimer
                        </button>
                    `}
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
    
    // Ajouter les événements pour générer les factures
    container.querySelectorAll('.generate-invoice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const patientId = this.getAttribute('data-patient-id');
            const actIndex = parseInt(this.getAttribute('data-act-index'));
            generateInvoice(patientId, actIndex);
        });
    });
}

// Générer une facture
function generateInvoice(patientId, actIndex) {
    if (!confirm('Voulez-vous générer une facture pour cet acte ?')) {
        return;
    }
    
    // Récupérer l'acte
    const actsData = loadAllActsData();
    if (!actsData[patientId] || !actsData[patientId].acts[actIndex]) {
        alert('Erreur: Acte non trouvé.');
        return;
    }
    
    // Récupérer le patient
    const patient = window.storage.getPatientById(patientId);
    if (!patient) {
        alert('Erreur: Patient non trouvé.');
        return;
    }
    
    // Récupérer l'acte
    const act = actsData[patientId].acts[actIndex];
    
    // Vérifier que l'acte est totalement payé
    const actPaid = act.payments ? act.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    if (actPaid < act.price) {
        alert('Erreur: Cet acte n\'est pas encore totalement payé.');
        return;
    }
    
    // Vérifier si une facture existe déjà
    if (accountingData.invoices[`${patientId}-${actIndex}`]) {
        alert('Une facture existe déjà pour cet acte.');
        return;
    }
    
    // Générer le numéro de facture
    const currentYear = new Date().getFullYear().toString();
    const invoiceNumber = generateInvoiceNumber(currentYear);
    
    // Enregistrer la facture
    accountingData.invoices[`${patientId}-${actIndex}`] = invoiceNumber;
    saveAccountingData();
    
    // Mettre à jour l'affichage
    const invoiceCell = document.getElementById(`invoiceCell-${patientId}-${actIndex}`);
    if (invoiceCell) {
        invoiceCell.innerHTML = `<span class="status-badge status-active">${invoiceNumber}</span>`;
    }
    
    // Mettre à jour les boutons
    const row = invoiceCell.closest('tr');
    const actionsCell = row.querySelector('.actions-cell');
    if (actionsCell) {
        actionsCell.innerHTML = `
            <button class="btn btn-small btn-print" onclick="printInvoice('${patientId}', ${actIndex})">
                <i class="fas fa-print"></i> Imprimer
            </button>
        `;
    }
    
    // Envoyer une alerte
    alert(`Facture ${invoiceNumber} générée avec succès pour ${patient.prenom} ${patient.nom}`);
    
    // Mettre à jour le dashboard
    if (typeof updateDashboard === 'function') updateDashboard();
}

// Imprimer une facture
function printInvoice(patientId, actIndex) {
    const actsData = loadAllActsData();
    const patient = window.storage.getPatientById(patientId);
    
    if (!actsData[patientId] || !actsData[patientId].acts[actIndex] || !patient) {
        alert('Erreur: Impossible de trouver les informations de la facture.');
        return;
    }
    
    const act = actsData[patientId].acts[actIndex];
    const invoiceNumber = accountingData.invoices[`${patientId}-${actIndex}`] || 'Non facturé';
    
    // Créer le contenu de la facture
    const invoiceContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a6dbb;">Cabinet Dentaire Ahhdaoui</h1>
                <p>123 Avenue Dentaire, Ville, Maroc</p>
                <p>Tél: +212 5 XX XX XX XX | Email: contact@ahhdaoui.ma</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div>
                    <h3>Facture à:</h3>
                    <p><strong>${patient.prenom} ${patient.nom}</strong></p>
                    <p>${patient.adresse || 'Adresse non renseignée'}</p>
                    <p>Tél: ${patient.telephone}</p>
                    <p>CIN/Passeport: ${patient.cinPasseport || 'Non renseigné'}</p>
                </div>
                <div style="text-align: right;">
                    <h3>Facture N°: ${invoiceNumber}</h3>
                    <p>Date: ${formatShortDate(new Date().toISOString().split('T')[0])}</p>
                    <p>ID Patient: ${formatPatientIdForDisplay(patientId)}</p>
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #f5f9ff;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dent</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Montant (MAD)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${act.type}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${formatShortDate(act.date)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${act.tooth}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${act.price.toFixed(2)} DH</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style="background-color: #f9fbff;">
                        <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Total:</td>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${act.price.toFixed(2)} DH</td>
                    </tr>
                    <tr style="background-color: #f0f7ef;">
                        <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Statut:</td>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #00a86b;">PAYÉ</td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #1a6dbb;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <p><strong>Signature du patient:</strong></p>
                        <p style="margin-top: 40px;">_________________________</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Signature et cachet:</strong></p>
                        <p style="margin-top: 40px;">_________________________</p>
                        <p>Dr. Ahhdaoui</p>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 50px; font-size: 12px; color: #666; text-align: center;">
                <p>Cette facture est établie par le Cabinet Dentaire Ahhdaoui. Toute reproduction est interdite.</p>
                <p>Merci pour votre confiance.</p>
            </div>
        </div>
    `;
    
    // Ouvrir une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Facture ${invoiceNumber}</title>
            <style>
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none; }
                }
                @page { margin: 20mm; }
            </style>
        </head>
        <body>
            ${invoiceContent}
            <div style="text-align: center; margin-top: 20px;" class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #1a6dbb; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-print"></i> Imprimer la facture
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background-color: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                    Fermer
                </button>
            </div>
            <script>
                // Charger FontAwesome pour l'icône d'impression
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
                document.head.appendChild(link);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Exporter les données comptables en Excel - VERSION FONCTIONNELLE
function exportAccountingToExcel() {
    if (!window.storage) return;
    
    const actsData = loadAllActsData();
    let accountingDataList = [];
    
    // Parcourir tous les patients et leurs actes
    for (const patientId in actsData) {
        if (actsData[patientId] && actsData[patientId].acts) {
            const patient = window.storage.getPatientById(patientId);
            if (!patient) continue;
            
            actsData[patientId].acts.forEach((act, actIndex) => {
                // Récupérer les paiements
                const payments = act.payments || [];
                const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
                
                // Vérifier si l'acte est facturé
                const invoiceNumber = accountingData.invoices[`${patientId}-${actIndex}`] || 'Non facturé';
                
                // Créer une ligne pour chaque paiement ou pour l'acte global
                if (payments.length > 0) {
                    payments.forEach((payment, paymentIndex) => {
                        accountingDataList.push({
                            'Date': formatShortDate(act.date),
                            'Patient': `${patient.prenom} ${patient.nom}`,
                            'ID Patient': formatPatientIdForDisplay(patientId),
                            'Type d\'acte': act.type,
                            'Dent': act.tooth,
                            'Montant total': act.price.toFixed(2) + ' DH',
                            'Montant payé': payment.amount.toFixed(2) + ' DH',
                            'Mode de paiement': payment.method,
                            'Date paiement': formatShortDate(payment.date),
                            'Numéro facture': invoiceNumber,
                            'Statut paiement': totalPaid >= act.price ? 'Payé intégralement' : 'Paiement partiel',
                            'Reste à payer': (act.price - totalPaid).toFixed(2) + ' DH'
                        });
                    });
                } else {
                    accountingDataList.push({
                        'Date': formatShortDate(act.date),
                        'Patient': `${patient.prenom} ${patient.nom}`,
                        'ID Patient': formatPatientIdForDisplay(patientId),
                        'Type d\'acte': act.type,
                        'Dent': act.tooth,
                        'Montant total': act.price.toFixed(2) + ' DH',
                        'Montant payé': '0.00 DH',
                        'Mode de paiement': 'N/A',
                        'Date paiement': 'N/A',
                        'Numéro facture': invoiceNumber,
                        'Statut paiement': 'Non payé',
                        'Reste à payer': act.price.toFixed(2) + ' DH'
                    });
                }
            });
        }
    }
    
    if (accountingDataList.length === 0) {
        alert('Aucune donnée comptable à exporter.');
        return;
    }
    
    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    
    // Créer une feuille pour les transactions
    const wsTransactions = XLSX.utils.json_to_sheet(accountingDataList);
    
    // Définir la largeur des colonnes
    const colWidths = [
        { wch: 12 }, // Date
        { wch: 25 }, // Patient
        { wch: 12 }, // ID Patient
        { wch: 25 }, // Type d'acte
        { wch: 10 }, // Dent
        { wch: 15 }, // Montant total
        { wch: 15 }, // Montant payé
        { wch: 15 }, // Mode paiement
        { wch: 12 }, // Date paiement
        { wch: 20 }, // Numéro facture
        { wch: 20 }, // Statut paiement
        { wch: 15 }  // Reste à payer
    ];
    wsTransactions['!cols'] = colWidths;
    
    // Ajouter un résumé des statistiques
    const statsData = [
        ['STATISTIQUES COMPTABLES'],
        ['Date d\'export:', new Date().toLocaleDateString('fr-FR')],
        [''],
        ['Total patients:', Object.keys(actsData).length],
        ['Total actes:', accountingDataList.filter((item, index, self) => 
            self.findIndex(t => t['ID Patient'] === item['ID Patient'] && t['Type d\'acte'] === item['Type d\'acte']) === index
        ).length],
        ['Total transactions:', accountingDataList.length],
        [''],
        ['RÉCAPITULATIF FINANCIER'],
        ['Total facturé:', accountingDataList.reduce((sum, item) => {
            const amount = parseFloat(item['Montant total'].replace(' DH', ''));
            return sum + amount;
        }, 0).toFixed(2) + ' DH'],
        ['Total perçu:', accountingDataList.reduce((sum, item) => {
            const amount = parseFloat(item['Montant payé'].replace(' DH', ''));
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0).toFixed(2) + ' DH'],
        ['Total en attente:', accountingDataList.reduce((sum, item) => {
            const amount = parseFloat(item['Reste à payer'].replace(' DH', ''));
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0).toFixed(2) + ' DH']
    ];
    
    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    
    // Ajouter les feuilles au classeur
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');
    
    // Générer la date pour le nom du fichier
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Exporter le fichier
    XLSX.writeFile(wb, `comptabilite_${dateStr}.xlsx`);
    
    // Afficher une confirmation
    alert(`Export réussi !\n${accountingDataList.length} transactions exportées vers "comptabilite_${dateStr}.xlsx"`);
}

// Remplir le filtre des patients pour la page comptable
function populatePatientFilterForAccounting() {
    if (!window.storage) return;
    
    const patients = window.storage.getPatients();
    const filterPatient = document.getElementById('filterAccountingPatient');
    
    if (!filterPatient) return;
    
    filterPatient.innerHTML = '<option value="">Tous les patients</option>';
    
    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.prenom} ${patient.nom} (${patient.cinPasseport || 'N/A'})`;
        filterPatient.appendChild(option);
    });
}

// Fonction utilitaire pour charger toutes les données des actes
function loadAllActsData() {
    const savedData = localStorage.getItem('dental_clinic_acts');
    return savedData ? JSON.parse(savedData) : {};
}

// Exporter les fonctions nécessaires
window.generateInvoice = generateInvoice;
window.printInvoice = printInvoice;
window.exportAccountingToExcel = exportAccountingToExcel;