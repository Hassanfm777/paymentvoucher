// --- English Number to Words Logic ---
const th = ['','Thousand','Million', 'Billion','Trillion'];
const dg = ['Zero','One','Two','Three','Four', 'Five','Six','Seven','Eight','Nine'];
const tn = ['Ten','Eleven','Twelve','Thirteen', 'Fourteen','Fifteen','Sixteen', 'Seventeen','Eighteen','Nineteen'];
const tw = ['Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

function toWords(s) {
    s = s.toString().replace(/[\, ]/g,'');
    if (s != parseFloat(s)) return '';
    var x = s.indexOf('.');
    if (x == -1) x = s.length;
    if (x > 15) return 'Too big';
    var n = s.split('');
    var str = '';
    var sk = 0;
    for (var i=0; i < x; i++) {
        if ((x-i)%3==2) {
            if (n[i] == '1') {
                str += tn[Number(n[i+1])] + ' ';
                i++;
                sk=1;
            } else if (n[i]!=0) {
                str += tw[n[i]-2] + ' ';
                sk=1;
            }
        } else if (n[i]!=0) {
            str += dg[n[i]] +' ';
            if ((x-i)%3==0) str += 'Hundred ';
            sk=1;
        }
        if ((x-i)%3==1) {
            if (sk) str += th[(x-i-1)/3] + ' ';
            sk=0;
        }
    }
    return str.replace(/\s+/g,' ').trim();
}

// --- Currency Definitions ---
const currencies = {
    'AED': { majorEn: 'AED', majorAr: 'درهم', minorEn: 'Fils', minorAr: 'فلس' },
    'USD': { majorEn: 'USD', majorAr: 'دولار', minorEn: 'Cents', minorAr: 'سنت' },
    'EUR': { majorEn: 'EUR', majorAr: 'يورو', minorEn: 'Cents', minorAr: 'سنت' }
};

function updateCurrencyLabels() {
    let curr = document.getElementById('inputCurrency').value;
    let data = currencies[curr];
    
    document.getElementById('lblInputMajor').innerText = `Amount (${data.majorEn})`;
    document.getElementById('lblInputMinor').innerText = data.minorEn;
    
    document.getElementById('lblCurrencyMajor').innerText = `${data.majorEn}. ${data.majorAr}`;
    document.getElementById('lblCurrencyMinor').innerText = `${data.minorEn} ${data.minorAr}`;
    
    document.getElementById('labelWordsAr').innerText = `مبلغ و قدره ${data.majorAr}`;
    
    updateWords();
}

function updateWords() {
    let dhs = document.getElementById('inputDhs').value || 0;
    let fils = document.getElementById('inputFils').value || 0;
    let curr = document.getElementById('inputCurrency').value;
    let data = currencies[curr];
    
    // English Words
    let enWords = `Only ${toWords(dhs)} ${data.majorEn}`;
    if (parseInt(fils) > 0) {
        enWords += ` and ${toWords(fils)} ${data.minorEn}`;
    }
    document.getElementById('inputWordsEn').value = enWords;

    // Arabic Words (using TafqeetJS if available)
    try {
        if (typeof Tafqeet !== 'undefined') {
            let arWords = new Tafqeet(dhs, 'AED').parse();
            
            // Hack to replace currency if not AED
            if (curr === 'USD') arWords = arWords.replace('درهم إماراتي', 'دولار');
            if (curr === 'EUR') arWords = arWords.replace('درهم إماراتي', 'يورو');

            if (parseInt(fils) > 0) {
                let filsWords = new Tafqeet(fils, 'AED').parse()
                                    .replace('فقط', '')
                                    .replace('لا غير', '')
                                    .replace('درهم إماراتي', data.minorAr)
                                    .trim();
                arWords = arWords.replace('لا غير', `و ${filsWords} لا غير`);
            }
            document.getElementById('inputWordsAr').value = arWords;
        }
    } catch(e) {
        console.error("Tafqeet library error", e);
    }
}

// Event Listeners for Updates
document.getElementById('inputDhs').addEventListener('input', updateWords);
document.getElementById('inputFils').addEventListener('input', updateWords);
document.getElementById('inputCurrency').addEventListener('change', updateCurrencyLabels);

// --- Serial Number Logic ---
function getNextSerialNumber() {
    let dateStr = document.getElementById('inputDate').value;
    let dateObj = dateStr ? new Date(dateStr) : new Date();
    let mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    let dd = String(dateObj.getDate()).padStart(2, '0');
    
    let method = document.getElementById('inputMethod').value.toUpperCase(); // CASH or CHEQUE
    
    let key = `serial_${method}_${mm}_${dd}`;
    let counter = localStorage.getItem(key) || 0;
    counter = parseInt(counter) + 1;
    
    return {
        serial: `${method}/${mm}/${dd}/${String(counter).padStart(3, '0')}`,
        key: key,
        counter: counter
    };
}

// Toggle Cheque Input
document.getElementById('inputMethod').addEventListener('change', function() {
    if (this.value === 'Cheque') {
        document.getElementById('chequeInputDiv').classList.remove('hidden');
    } else {
        document.getElementById('chequeInputDiv').classList.add('hidden');
    }
    document.getElementById('displaySerial').innerText = getNextSerialNumber().serial;
});

document.getElementById('inputDate').addEventListener('change', function() {
    document.getElementById('displaySerial').innerText = getNextSerialNumber().serial;
});

// --- Initialization ---
window.onload = function() {
    // Set today's date
    document.getElementById('inputDate').valueAsDate = new Date();
    
    // Load Payees from Local Storage
    let payees = JSON.parse(localStorage.getItem('payees') || '[]');
    let datalist = document.getElementById('payeeList');
    payees.forEach(p => {
        let opt = document.createElement('option');
        opt.value = p;
        datalist.appendChild(opt);
    });

    // Initial setups
    document.getElementById('displaySerial').innerText = getNextSerialNumber().serial;
    updateCurrencyLabels();
};

// --- Generate Voucher ---
document.getElementById('btnGenerate').addEventListener('click', function() {
    // 1. Populate visual fields
    document.getElementById('displayDhs').innerText = document.getElementById('inputDhs').value || '0';
    document.getElementById('displayFils').innerText = document.getElementById('inputFils').value || '0';
    document.getElementById('displayDate').innerText = document.getElementById('inputDate').value;
    document.getElementById('displayPayee').innerText = document.getElementById('inputPayee').value;
    document.getElementById('displayWordsEn').innerText = document.getElementById('inputWordsEn').value;
    document.getElementById('displayWordsAr').innerText = document.getElementById('inputWordsAr').value;
    document.getElementById('displayReason').innerText = document.getElementById('inputReason').value;

    let method = document.getElementById('inputMethod').value;
    if (method === 'Cash') {
        document.getElementById('displayMethodData').innerText = 'Cash / نقداً';
    } else {
        document.getElementById('displayMethodData').innerText = 'Cheque / شيك: ' + document.getElementById('inputChequeNo').value;
    }

    // 2. Increment Serial Number counter in Storage
    let nextSerialData = getNextSerialNumber();
    localStorage.setItem(nextSerialData.key, nextSerialData.counter);
    document.getElementById('displaySerial').innerText = nextSerialData.serial;

    // 3. Save new Payee to list if not exists
    let payee = document.getElementById('inputPayee').value.trim();
    if (payee) {
        let payees = JSON.parse(localStorage.getItem('payees') || '[]');
        if (!payees.includes(payee)) {
            payees.push(payee);
            localStorage.setItem('payees', JSON.stringify(payees));
            let opt = document.createElement('option');
            opt.value = payee;
            document.getElementById('payeeList').appendChild(opt);
        }
    }

    // 4. Save to Transaction History
    let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push({
        date: document.getElementById('inputDate').value,
        serial: nextSerialData.serial, // save the one we just generated
        payee: payee || 'Unknown',
        amount: `${document.getElementById('inputDhs').value || '0'}.${String(document.getElementById('inputFils').value || '0').padStart(2, '0')}`,
        currency: document.getElementById('inputCurrency').value,
        method: method === 'Cash' ? 'Cash' : `Cheque: ${document.getElementById('inputChequeNo').value}`,
        reason: document.getElementById('inputReason').value
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Show print button
    document.getElementById('btnPrint').classList.remove('hidden');
});

// --- Print Voucher ---
document.getElementById('btnPrint').addEventListener('click', function() {
    document.body.classList.remove('printing-report');
    document.body.classList.add('printing-voucher');
    window.print();
    document.body.classList.remove('printing-voucher');
});

// --- Reports Logic ---
document.getElementById('btnViewReports').addEventListener('click', function() {
    document.getElementById('printableVoucher').classList.add('hidden');
    document.getElementById('reportSection').classList.remove('hidden');
    renderReport();
});

document.getElementById('btnCloseReports').addEventListener('click', function() {
    document.getElementById('reportSection').classList.add('hidden');
    document.getElementById('printableVoucher').classList.remove('hidden');
});

document.getElementById('btnPrintReport').addEventListener('click', function() {
    document.body.classList.remove('printing-voucher');
    document.body.classList.add('printing-report');
    window.print();
    document.body.classList.remove('printing-report');
});

function renderReport() {
    let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    let tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    
    // Show newest first
    transactions.slice().reverse().forEach(tx => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border p-2">${tx.date}</td>
            <td class="border p-2">${tx.serial}</td>
            <td class="border p-2">${tx.payee}</td>
            <td class="border p-2 text-right">${tx.amount} ${tx.currency}</td>
            <td class="border p-2">${tx.method}</td>
            <td class="border p-2">${tx.reason}</td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('reportDate').innerText = `Generated on: ${new Date().toLocaleString()}`;
}
