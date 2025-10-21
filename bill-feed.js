document.addEventListener('DOMContentLoaded', () => {
  // --- LEGISCAN API & FIREBASE SETUP ---
  const API_KEY = "0cb8ccb82b8cfd2125429bbb610d0dfa";
  const MAX_INITIAL_BILLS = 50; // Start with 50
  const MAX_CONCURRENT_REQUESTS = 5;
  const votesRef = firebase.database().ref("votes");
  let allBills = []; // To store all fetched bills

  const statusMap = {
    1: "Introduced", 2: "Passed One Chamber", 3: "Passed Both Chambers",
    4: "Signed into Law", 5: "Vetoed", 6: "Failed",
    7: "Enacted", 8: "Withdrawn", 9: "Dead"
  };

  // --- CORE FUNCTIONS ---

  async function fetchBills(limit = MAX_INITIAL_BILLS) {
    try {
      const response = await fetch(`https://api.legiscan.com/?key=${API_KEY}&op=getMasterList&state=US`);
      const data = await response.json();
      if (!data || !data.masterlist) return console.error("Invalid API response", data);

      const bills = Object.values(data.masterlist)
        .filter(item => typeof item === "object" && item.number?.startsWith("SB") && item.status >= 1)
        .slice(0, limit);

      const container = document.getElementById("bills-list");
      if (!container) return;
      container.innerHTML = "Loading bill details...";

      const snapshot = await votesRef.once("value");
      const voteData = snapshot.val() || {};
      const committeeMap = {};

      const detailedBills = await throttledFetchBillDetails(bills);
      allBills = []; // Clear previous bills

      detailedBills.forEach(result => {
        if (result.status !== "fulfilled") return;
        const { bill, committee } = result.value;
        const voteCount = voteData[bill.number] || 0;
        const readableStatus = statusMap[bill.status] || "Unknown";

        if (!committeeMap[committee]) committeeMap[committee] = 0;
        committeeMap[committee]++;

        const billData = {
          ...bill,
          committee,
          voteCount,
          readableStatus
        };
        allBills.push(billData);
      });
      
      sortByVotes(); // Initial sort
      buildCommitteeDropdown(committeeMap);
      buildStatusDropdown();
      
    } catch (error) {
      console.error("Error fetching bills:", error);
      document.getElementById("bills-list").innerHTML = "<p style='color:red; text-align:center;'>Error loading bills. Please check the API key.</p>";
    }
  }

  async function throttledFetchBillDetails(bills) {
    const results = [];
    let index = 0;
    async function processNextBatch() {
      const batch = bills.slice(index, index + MAX_CONCURRENT_REQUESTS);
      const batchResults = await Promise.allSettled(batch.map(bill =>
        fetch(`https://api.legiscan.com/?key=${API_KEY}&op=getBill&id=${bill.bill_id}`)
          .then(res => res.json())
          .then(detail => ({ bill, committee: detail?.bill?.committee?.name || "Unknown" }))
          .catch(() => ({ bill, committee: "Unknown" }))
      ));
      results.push(...batchResults);
      index += MAX_CONCURRENT_REQUESTS;
      if (index < bills.length) {
        return processNextBatch();
      }
    }
    await processNextBatch();
    return results;
  }

  function renderBillList(billsToRender) {
    const container = document.getElementById("bills-list");
    container.innerHTML = ""; // Clear list
    
    billsToRender.forEach(bill => {
      const card = document.createElement("div");
      card.classList.add("bill-card"); // Use the same class as homepage
      card.setAttribute("data-votes", bill.voteCount);
      card.setAttribute("data-status", bill.status);
      card.setAttribute("data-committee", bill.committee);

      card.innerHTML = `
        <h3><a href="${bill.url}" target="_blank">${bill.number}</a>: ${bill.title}</h3>
        <p><strong>Status:</strong> ${bill.readableStatus}</p>
        <p><strong>Committee:</strong> ${bill.committee}</p>
        <p><strong>Last Action:</strong> ${bill.last_action}</p>
        <button class="upvote-btn" data-bill="${bill.number}">👍 Upvote</button>
        <span class="vote-count">${bill.voteCount}</span> votes
      `;
      container.appendChild(card);
    });
    
    attachVoteHandlers();
  }

  function sortByVotes() {
    allBills.sort((a, b) => b.voteCount - a.voteCount);
    applyFilters(); // Re-apply filters after sorting
  }

  function attachVoteHandlers() {
    const buttons = document.querySelectorAll(".upvote-btn");
    buttons.forEach(button => {
      button.addEventListener("click", async function () {
        const billNumber = this.getAttribute("data-bill");
        const votedBills = JSON.parse(localStorage.getItem("votedBills")) || [];
        
        if (votedBills.includes(billNumber)) {
          alert("You have already voted for this bill.");
          return;
        }

        const countSpan = this.nextElementSibling;
        let currentVotes = parseInt(countSpan.textContent);
        currentVotes += 1;
        
        // Update Firebase
        await votesRef.child(billNumber).set(currentVotes);
        
        // Update local storage
        votedBills.push(billNumber);
        localStorage.setItem("votedBills", JSON.stringify(votedBills));
        
        // Update local data and re-sort
        const billToUpdate = allBills.find(b => b.number === billNumber);
        if (billToUpdate) billToUpdate.voteCount = currentVotes;
        
        sortByVotes();
      });
    });
  }

  function buildCommitteeDropdown(committeeMap) {
    const dropdown = document.getElementById("committee-filter");
    if (!dropdown) return;
    dropdown.innerHTML = `<option value="">All Committees</option>`;
    Object.entries(committeeMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([name, count]) => {
        dropdown.innerHTML += `<option value="${name}">${name} (${count})</option>`;
      });
    dropdown.addEventListener("change", applyFilters);
  }

  function buildStatusDropdown() {
    const dropdown = document.getElementById("status-filter");
    if (!dropdown) return;
    dropdown.innerHTML = `<option value="">All Statuses</option>`;
    Object.entries(statusMap)
      .sort((a, b) => a[0] - b[0])
      .forEach(([status, label]) => {
        dropdown.innerHTML += `<option value="${status}">${label}</option>`;
      });
    dropdown.addEventListener("change", applyFilters);
  }

  function applyFilters() {
    const selectedCommittee = document.getElementById("committee-filter").value;
    const selectedStatus = document.getElementById("status-filter").value;

    const filteredBills = allBills.filter(bill => {
      const matchesCommittee = !selectedCommittee || bill.committee === selectedCommittee;
      const matchesStatus = !selectedStatus || bill.status.toString() === selectedStatus;
      return matchesCommittee && matchesStatus;
    });
    
    renderBillList(filteredBills);
  }

  function setupMobileNav() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }
  }

  // --- INITIALIZE THE PAGE ---
  fetchBills();
  setupMobileNav();
});

// This function needs to be global or attached to window
function clearVotes() {
  if (confirm("Are you sure you want to delete all votes?")) {
    firebase.database().ref("votes").remove().then(() => {
      alert("All votes cleared. Refresh the page.");
      localStorage.removeItem("votedBills");
      window.location.reload();
    });
  }
}