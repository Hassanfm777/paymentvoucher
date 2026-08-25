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

function updateWords() {
    let dhs = document.getElementById('inputDhs').value || 0;
    let fils = document.getElementById('inputFils').value || 0;
    
    // English Words
    let enWords = `Only ${toWords(dhs)} AED`;
    if (parseInt(fils) > 0) {
        enWords += ` and ${toWords(fils)} Fils`;
    }
    document.getElementById('inputWordsEn').value = enWords;

    // Arabic Words (using TafqeetJS if available)
    try {
        if (typeof Tafqeet !== 'undefined') {
            let arWords = new Tafqeet(dhs, 'AED').parse();
            if (parseInt(fils) > 0) {
                // simple replace for fils
                arWords = arWords.replace('لا غير', `و ${new Tafqeet(fils, 'FILS').parse().replace('فقط', '').replace('لا غير', '')} لا غير`);
            }
            document.getElementById('inputWordsAr').value = arWords;
        }
    } catch(e) {
        console.error("Tafqeet library error", e);
    }
}

// Event Listeners for Word Updating
document.getElementById('inputDhs').addEventListener('input', updateWords);
document.getElementById('inputFils').addEventListener('input', updateWords);

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

    // Initial Serial Number display
    document.getElementById('displaySerial').innerText = getNextSerialNumber().serial;
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

    // Show print button
    document.getElementById('btnPrint').classList.remove('hidden');
});

// --- Print PDF ---
document.getElementById('btnPrint').addEventListener('click', function() {
    window.print();
});
