
const STORAGE_KEY = "skyport_passenger_records_v1";

const queueTable = document.getElementById("queueTable");
const historyTable = document.getElementById("historyTable");
const recentHistory = document.getElementById("recentHistory");
const modal = document.getElementById("passengerModal");
const form = document.getElementById("passengerForm");
const toast = document.getElementById("toast");

let passengers = loadPassengers();
let nextId = passengers.reduce((max, p) => Math.max(max, p.id), 0) + 1;
let activeSection = "overview";
let toastTimer;

function loadPassengers() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(saved)
            ? saved.filter(p =>
                p && Number.isInteger(p.id) &&
                typeof p.name === "string" &&
                typeof p.flight === "string" &&
                typeof p.destination === "string" &&
                ["waiting", "checked"].includes(p.status)
            )
            : [];
    } catch {
        return [];
    }
}

function savePassengers() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(passengers));
    } catch {
        showToast("Unable to save data. Check your browser storage.");
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function passengerId(id) {
    return "P-" + String(id).padStart(3, "0");
}

function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2)
        .map(word => word.charAt(0).toUpperCase()).join("");
}

function formatDate(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatTime(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// QUEUE: FIFO - First In, First Out
function getWaitingQueue() {
    return passengers
        .filter(p => p.status === "waiting")
        .sort((a, b) => a.id - b.id);
}

// STACK: LIFO - Last In, First Out
function getCheckInHistory() {
    return passengers
        .filter(p => p.status === "checked")
        .sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));
}

function updateDashboard() {
    const queue = getWaitingQueue();
    const history = getCheckInHistory();

    document.getElementById("totalPassengers").textContent =
        passengers.length;

    document.getElementById("waitingCount").textContent =
        queue.length;

    document.getElementById("checkedInCount").textContent =
        history.length;

    document.getElementById("nextPassenger").textContent =
        queue.length ? passengerId(queue[0].id) : "—";

    document.getElementById("navQueueCount").textContent =
        queue.length;

    document.getElementById("queuePill").textContent =
        `${queue.length} waiting`;

    document.getElementById("queueFooter").textContent =
        `Showing ${queue.length} passenger${queue.length === 1 ? "" : "s"}`;

    renderQueue();
    renderRecentHistory();
    renderFullHistory();
}

function renderQueue() {
    const queue = getWaitingQueue();
    const search = document.getElementById("queueSearch")
        .value.trim().toLowerCase();

    const filtered = queue.filter(p =>
        [p.name, p.flight, p.destination, passengerId(p.id)]
            .some(value => value.toLowerCase().includes(search))
    );

    queueTable.innerHTML = filtered.map(p => `
        <tr>
            <td>
                <div class="passenger-cell">
                    <div class="passenger-avatar">${escapeHTML(initials(p.name))}</div>
                    <div>
                        <span class="passenger-name">${escapeHTML(p.name)}</span>
                        <span class="passenger-id">${passengerId(p.id)}</span>
                    </div>
                </div>
            </td>
            <td><span class="flight-badge">${escapeHTML(p.flight)}</span></td>
            <td>${escapeHTML(p.destination)}</td>
            <td><span class="status-badge status-waiting">Waiting</span></td>
            <td>
                <button class="action-btn" data-checkin="${p.id}">
                    <i class="fa-solid fa-check"></i> Check in
                </button>
            </td>
        </tr>
    `).join("");

    document.getElementById("queueEmpty").hidden = filtered.length > 0;
}

function renderRecentHistory() {
    const history = getCheckInHistory().slice(0, 5);

    recentHistory.innerHTML = history.map(p => `
        <div class="history-item">
            <div class="passenger-avatar">${escapeHTML(initials(p.name))}</div>
            <div class="history-details">
                <strong>${escapeHTML(p.name)}</strong>
                <small>${passengerId(p.id)} · ${escapeHTML(p.flight)}</small>
            </div>
            <div class="history-time">
                <strong>${formatTime(p.checkedAt)}</strong>
                <small>${escapeHTML(p.destination)}</small>
            </div>
        </div>
    `).join("");

    document.getElementById("historyEmpty").hidden = history.length > 0;
}

function renderFullHistory() {
    const history = getCheckInHistory();
    const search = document.getElementById("historySearch")
        .value.trim().toLowerCase();

    const filtered = history.filter(p =>
        [p.name, p.flight, p.destination, passengerId(p.id)]
            .some(value => value.toLowerCase().includes(search))
    );

    historyTable.innerHTML = filtered.map(p => `
        <tr>
            <td>${passengerId(p.id)}</td>
            <td>
                <div class="passenger-cell">
                    <div class="passenger-avatar">${escapeHTML(initials(p.name))}</div>
                    <span class="passenger-name">${escapeHTML(p.name)}</span>
                </div>
            </td>
            <td><span class="flight-badge">${escapeHTML(p.flight)}</span></td>
            <td>${escapeHTML(p.destination)}</td>
            <td>${formatDate(p.checkedAt)}</td>
            <td><span class="status-badge status-checked">Checked in</span></td>
        </tr>
    `).join("");

    document.getElementById("allHistoryEmpty").hidden =
        filtered.length > 0;
}

// Register a passenger at the rear of the queue
function addPassenger(name, flight, destination) {
    const passenger = {
        id: nextId++,
        name,
        flight,
        destination,
        status: "waiting",
        registeredAt: new Date().toISOString(),
        checkedAt: null
    };

    passengers.push(passenger);
    savePassengers();
    updateDashboard();

    showToast(`${name} added to the waiting queue.`);
}

// Process the passenger at the front of the queue
function checkInPassenger(id) {
    const queue = getWaitingQueue();
    const firstPassenger = queue[0];

    if (!firstPassenger) {
        showToast("There are no passengers waiting.");
        return;
    }

    // FIFO rule: only the first waiting passenger can be checked in.
    if (firstPassenger.id !== Number(id)) {
        showToast("Please check in the passenger at the front of the queue first.");
        return;
    }

    const passenger = passengers.find(p => p.id === firstPassenger.id);

    passenger.status = "checked";
    passenger.checkedAt = new Date().toISOString();

    savePassengers();
    updateDashboard();

    showToast(`${passenger.name} checked in successfully.`);
}

// Open and close the registration modal
function openModal() {
    modal.hidden = false;
    document.getElementById("passengerName").focus();
}

function closeModal() {
    modal.hidden = true;
    form.reset();
}

document.getElementById("openForm").addEventListener("click", openModal);
document.getElementById("closeForm").addEventListener("click", closeModal);
document.getElementById("cancelForm").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
});

form.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("passengerName")
        .value.trim();

    const flight = document.getElementById("flightNumber")
        .value.trim().toUpperCase();

    const destination = document.getElementById("destination")
        .value.trim();

    if (!name || !flight || !destination) {
        showToast("Please fill in all passenger details.");
        return;
    }

    addPassenger(name, flight, destination);
    closeModal();
});

// Queue and history search
document.getElementById("queueSearch")
    .addEventListener("input", renderQueue);

document.getElementById("historySearch")
    .addEventListener("input", renderFullHistory);

document.getElementById("refreshQueue")
    .addEventListener("click", () => {
        updateDashboard();
        showToast("Passenger records refreshed.");
    });

// Handle check-in buttons using event delegation
queueTable.addEventListener("click", event => {
    const button = event.target.closest("[data-checkin]");

    if (button) {
        checkInPassenger(button.dataset.checkin);
    }
});

// Navigation between dashboard sections
function showSection(section) {
    activeSection = section;

    const isHistory = section === "history";
    const isQueue = section === "queue";

    document.getElementById("pageTitle").textContent =
        isHistory ? "Passenger History" :
        isQueue ? "Waiting Queue" : "Passenger Overview";

    document.getElementById("pageSubtitle").textContent =
        isHistory ? "Review completed check-ins and export passenger records." :
        isQueue ? "Manage the passenger line and process check-ins in order." :
        "Manage passenger flow and check-in records from one place.";

    document.getElementById("breadcrumb").textContent =
        isHistory ? "Check-in History" :
        isQueue ? "Waiting Queue" : "Overview";

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === section
        );
    });

    document.getElementById("allHistoryPanel").hidden = !isHistory;
    document.getElementById("queuePanel").hidden = isHistory;
    document.getElementById("historyPanel").hidden = isHistory || isQueue;

    if (isHistory) renderFullHistory();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.goto);
    });
});

// Export checked-in records as CSV
document.getElementById("exportCsv").addEventListener("click", () => {
    const history = getCheckInHistory();

    if (history.length === 0) {
        showToast("No check-in records available to export.");
        return;
    }

    const columns = [
        "Passenger ID",
        "Name",
        "Flight",
        "Destination",
        "Status",
        "Registration Time",
        "Check-in Time"
    ];

    function csvCell(value) {
        // Prevent spreadsheet formula injection from text fields.
        let text = String(value ?? "");
        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }
        return '"' + text.replace(/"/g, '""') + '"';
    }

    const rows = history.map(p => [
        passengerId(p.id),
        p.name,
        p.flight,
        p.destination,
        "Checked in",
        formatDate(p.registeredAt),
        formatDate(p.checkedAt)
    ]);

    const csv = [columns, ...rows]
        .map(row => row.map(csvCell).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "skyport-checkin-history.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast("Check-in history exported successfully.");
});

// Initial dashboard render
updateDashboard();
