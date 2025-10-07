import { initializeAI } from './ai.js';

document.addEventListener('DOMContentLoaded', () => {
    const allStates = ['AK','AL','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
    let senatorsData = {};
    let billsData = [];

    async function loadDataAndRender() {
        try {
            const [senatorsRes, billsRes] = await Promise.all([
                fetch('assets/data/senators.json'),
                fetch('assets/data/bills.json')
            ]);
            senatorsData = await senatorsRes.json();
            billsData = await billsRes.json();
            
            renderBills(billsData);
            setupBillFilter(billsData);

        } catch (error) {
            console.error("Failed to load initial data:", error);
            document.getElementById('bill-container').innerHTML = `<p style="color: red; text-align: center;">Failed to load bill information.</p>`;
        }
    }

    function renderBills(bills) {
        const container = document.getElementById('bill-container');
        if (!container) return;
        
        container.innerHTML = bills.map(bill => createBillCardHTML(bill)).join('');
        
        document.querySelectorAll('.bill-card').forEach(card => setupCardInteractivity(card));
        
        initializeAI(); 
    }

    function createBillCardHTML(bill) {
        const createListItems = (items) => items.map(item => `<li>${item}</li>`).join('');
        return `
        <section class="bill-card" data-bill-id="${bill.id}">
            <img src="${bill.imageSrc}" alt="${bill.title} Thumbnail" class="bill-thumbnail">
            <h1>${bill.title}</h1>
            <p class="summary">${bill.summary}</p>
            <p><strong>Status:</strong> ${bill.status}</p>
            <p><strong>Sponsor:</strong> ${bill.sponsor}</p>
            <div class="state-select">
                <label>Select Your State:</label>
                <select class="state-dropdown"></select>
            </div>
            <p class="recipient-message hidden"></p>
            <div class="action-buttons">
                <button class="support-btn">Support</button>
                <button class="oppose-btn">Oppose</button>
            </div>
            <div class="smart-compose">
                <button class="ai-toggle-btn">Smart Compose Message with AI</button>
                <div class="ai-input-container hidden">
                    <label for="ai-reasons-${bill.id}">Why do you care about this bill?</label>
                    <textarea class="ai-reasons" id="ai-reasons-${bill.id}" rows="4" placeholder="• It affects my hometown&#10;• I’m a student impacted by this policy"></textarea>
                    <button class="ai-generate-btn">Generate Message</button>
                </div>
                <div class="ai-result-container hidden">
                    <h4>Your Message Preview:</h4>
                    <div class="ai-message-preview"></div>
                    <button class="copy-message-btn">Copy to Clipboard</button>
                    <a href="#" class="mailto-link" target="_blank">Send via Email</a>
                </div>
            </div>
            <button class="details-toggle">Read More</button>
            <div class="details hidden">
                <p>${bill.details}</p>
                <div class="bill-perspectives">
                    <h3>Support & Opposition</h3>
                    <div class="pros"><h4>✅ Supporters argue this bill will:</h4><ul>${createListItems(bill.pros)}</ul></div>
                    <div class="cons"><h4>❌ Opponents argue this bill could:</h4><ul>${createListItems(bill.cons)}</ul></div>
                </div>
            </div>
            <div class="bill-divider"></div>
        </section>`;
    }

    function setupCardInteractivity(card) {
        const stateDropdown = card.querySelector('.state-dropdown');
        const recipientMessage = card.querySelector('.recipient-message');
        const supportBtn = card.querySelector('.support-btn');
        const opposeBtn = card.querySelector('.oppose-btn');
        const detailsToggle = card.querySelector('.details-toggle');
        const detailsContent = card.querySelector('.details');

        stateDropdown.innerHTML = '<option value="">-- Select State --</option>';
        allStates.forEach(state => {
            stateDropdown.innerHTML += `<option value="${state}">${state}</option>`;
        });
        
        stateDropdown.addEventListener('change', (e) => {
            const state = e.target.value;
            card.dataset.selectedState = state;
            if (senatorsData[state]) {
                const names = senatorsData[state].map(s => `<strong><u>Senator ${s.name}</u></strong>`).join(' and ');
                recipientMessage.innerHTML = `Your message will be sent to ${names}.`;
                recipientMessage.classList.remove('hidden');
            } else {
                recipientMessage.classList.add('hidden');
            }
        });

        detailsToggle.addEventListener('click', () => {
            const isHidden = detailsContent.classList.toggle('hidden');
            detailsToggle.textContent = isHidden ? 'Read More' : 'Hide Details';
        });

        supportBtn.addEventListener('click', () => sendMail(card, 'support'));
        opposeBtn.addEventListener('click', () => sendMail(card, 'opposition'));
    }

    function setupBillFilter(bills) {
        const billDropdown = document.getElementById('bill-filter-dropdown');
        billDropdown.innerHTML = '<option value="">Show All Bills</option>';
        bills.forEach(bill => {
            billDropdown.innerHTML += `<option value="${bill.id}">${bill.title}</option>`;
        });

        billDropdown.addEventListener('change', () => {
            const selectedId = billDropdown.value;
            document.querySelectorAll('.bill-card').forEach(card => {
                card.style.display = (!selectedId || card.dataset.billId === selectedId) ? 'block' : 'none';
            });
        });
    }
    
    function sendMail(card, action) {
        const state = card.dataset.selectedState;
        if (!state || !senatorsData[state]) {
            alert('Please select your state first.');
            return;
        }

        const billTitle = card.querySelector('h1').textContent;
        const emails = senatorsData[state].flatMap(s => s.emails).join(';');
        const subject = `Constituent Feedback on ${billTitle}`;
        const bodyText = `Dear Senator's Staff,\n\nAs a constituent from ${state}, I am writing to express my ${action} for the bill, "${billTitle}".\n\nI urge the Senator to consider this position.\n\nSincerely,\nA Constituent`;
        const body = encodeURIComponent(bodyText);

        window.currentEmailData = { emails, subject, body, bodyText };
        document.getElementById('email-modal').classList.remove('hidden');
    }

    function setupModal() {
        const modal = document.getElementById('email-modal');
        if (!modal) return;
        
        modal.querySelector('#cancel-modal').onclick = () => modal.classList.add('hidden');
        modal.querySelector('#mail-app-btn').onclick = () => {
            const { emails, subject, body } = window.currentEmailData;
            window.location.href = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${body}`;
            modal.classList.add('hidden');
        };
        modal.querySelector('#gmail-btn').onclick = () => {
            const { emails, subject, body } = window.currentEmailData;
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${emails}&su=${encodeURIComponent(subject)}&body=${body}`, '_blank');
            modal.classList.add('hidden');
        };
        modal.querySelector('#yahoo-btn').onclick = () => {
            const { emails, subject, body } = window.currentEmailData;
            window.open(`https://compose.mail.yahoo.com/?to=${emails}&subject=${encodeURIComponent(subject)}&body=${body}`, '_blank');
            modal.classList.add('hidden');
        };
        modal.querySelector('#copy-btn').onclick = () => {
            const { emails, subject, bodyText } = window.currentEmailData;
            const fullMessage = `To: ${emails}\nSubject: ${subject}\n\n${bodyText}`;
            navigator.clipboard.writeText(fullMessage).then(() => {
                const btn = modal.querySelector('#copy-btn');
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = 'Copy Message to Clipboard'; }, 2500);
            });
        };
    }

    function setupMobileNav() {
        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    }

    // --- INITIALIZE ---
    loadDataAndRender();
    setupModal();
    setupMobileNav();
});