const REDWAVE_API = "https://api.redwavedayz.com";
const SESSION_STORAGE_KEY = "redwave_session";

const toast = document.getElementById("toast");
const adminContent = document.getElementById("adminContent");
const adminDenied = document.getElementById("adminDenied");
const adminName = document.getElementById("adminName");
const adminDiscordId = document.getElementById("adminDiscordId");

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

function getSessionToken() {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

async function apiFetch(path, options = {}) {
  const token = getSessionToken();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${REDWAVE_API}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
}

function money(cents, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(cents || 0) / 100);
}

function dateTime(seconds) {
  if (!seconds) return "None";
  return new Date(Number(seconds) * 1000).toLocaleString();
}

function productName(code) {
  return {
    donation: "Donation",
    "priority-1-month": "Priority 1 Month",
    "priority-3-month": "Priority 3 Months",
    "clan-tag": "Colored Clan Tag",
  }[code] || code;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function initializeAdmin() {
  if (!getSessionToken()) {
    location.href = "store.html";
    return;
  }

  try {
    const account = await apiFetch("/api/account");
    adminName.textContent = account.account.display_name;
    adminDiscordId.textContent = `Discord ID: ${account.account.discord_id}`;

    await Promise.all([
      loadDashboard(),
      loadPurchases(),
      loadUsers(),
    ]);

    adminContent.hidden = false;
  } catch (error) {
    console.error(error);
    if (error.status === 403) {
      adminDenied.hidden = false;
    } else if (error.status === 401) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      location.href = "store.html";
    } else {
      showToast(error.message);
    }
  }
}

async function loadDashboard() {
  const data = await apiFetch("/api/admin/dashboard");
  const stats = data.stats;

  document.getElementById("statRevenueToday").textContent =
    money(stats.revenue_today_cents);
  document.getElementById("statRevenueMonth").textContent =
    money(stats.revenue_month_cents);
  document.getElementById("statRevenueTotal").textContent =
    money(stats.total_revenue_cents);
  document.getElementById("statActivePriority").textContent =
    stats.active_priority;
  document.getElementById("statSubscriptions").textContent =
    stats.active_subscriptions;
  document.getElementById("statClanTags").textContent =
    stats.pending_clan_tags;
  document.getElementById("statUsers").textContent =
    stats.total_users;
}

async function loadPurchases() {
  const params = new URLSearchParams();
  const search = document.getElementById("purchaseSearch").value.trim();
  const product = document.getElementById("purchaseProduct").value;
  const status = document.getElementById("purchaseStatus").value;

  if (search) params.set("q", search);
  if (product) params.set("product", product);
  if (status) params.set("status", status);

  const data = await apiFetch(`/api/admin/purchases?${params}`);
  renderPurchases(data.purchases);
}

function renderPurchases(purchases) {
  const tbody = document.getElementById("purchaseTableBody");

  if (!purchases.length) {
    tbody.innerHTML = '<tr><td colspan="7">No purchases found.</td></tr>';
    return;
  }

  tbody.innerHTML = purchases.map((purchase) => {
    const playerName =
      purchase.discord_global_name ||
      purchase.discord_username ||
      "Unknown";
    const fulfillment = purchase.fulfillment_status || "pending";
    const clanColor = purchase.metadata?.clan_color
      ? `<span class="admin-subtext">Color: ${escapeHtml(purchase.metadata.clan_color)}</span>`
      : "";

    const isPriority = purchase.product_code.startsWith("priority-");
    const isClan = purchase.product_code === "clan-tag";

    let actions = "";
    if (isClan || isPriority) {
      actions += `<button class="admin-action-button" data-action="mark-fulfilled" data-id="${purchase.id}">Fulfilled</button>`;
      actions += `<button class="admin-action-button" data-action="mark-pending" data-id="${purchase.id}">Pending</button>`;
      actions += `<button class="admin-action-button" data-action="revoke" data-id="${purchase.id}">Revoke</button>`;
    }
    if (isPriority) {
      actions += `<button class="admin-action-button" data-action="extend-30-days" data-id="${purchase.id}">+30 Days</button>`;
    }

    return `
      <tr>
        <td>
          <div class="admin-player">
            <strong>${escapeHtml(playerName)}</strong>
            <span>${escapeHtml(purchase.steam_id || "No Steam linked")}</span>
          </div>
        </td>
        <td>
          ${escapeHtml(productName(purchase.product_code))}
          ${clanColor}
        </td>
        <td>${money(purchase.amount_cents, purchase.currency)}</td>
        <td><span class="status-pill ${escapeHtml(purchase.status)}">${escapeHtml(purchase.status)}</span></td>
        <td><span class="status-pill ${escapeHtml(fulfillment)}">${escapeHtml(fulfillment)}</span></td>
        <td>${escapeHtml(dateTime(purchase.expires_at))}</td>
        <td><div class="admin-actions">${actions || "No action"}</div></td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      runPurchaseAction(
        Number(button.dataset.id),
        button.dataset.action
      );
    });
  });
}

async function runPurchaseAction(purchaseId, action) {
  const note = prompt("Optional admin note:", "") ?? "";

  try {
    await apiFetch("/api/admin/purchase-action", {
      method: "POST",
      body: JSON.stringify({
        purchase_id: purchaseId,
        action,
        note,
      }),
    });

    showToast("Purchase updated");
    await Promise.all([loadDashboard(), loadPurchases()]);
  } catch (error) {
    console.error(error);
    showToast(error.message.replaceAll("-", " "));
  }
}

async function loadUsers() {
  const search = document.getElementById("userSearch").value.trim();
  const params = new URLSearchParams();
  if (search) params.set("q", search);

  const data = await apiFetch(`/api/admin/users?${params}`);
  const tbody = document.getElementById("userTableBody");

  if (!data.users.length) {
    tbody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = data.users.map((user) => `
    <tr>
      <td>${escapeHtml(user.discord_global_name || user.discord_username)}</td>
      <td>${escapeHtml(user.discord_id)}</td>
      <td>${escapeHtml(user.steam_id || "Not linked")}</td>
      <td>${Number(user.purchase_count || 0)}</td>
      <td>${money(user.total_spent_cents)}</td>
      <td>${escapeHtml(dateTime(user.created_at))}</td>
    </tr>
  `).join("");
}

document.getElementById("refreshAdminButton").addEventListener("click", async () => {
  await Promise.all([loadDashboard(), loadPurchases(), loadUsers()]);
  showToast("Dashboard refreshed");
});

document.getElementById("applyPurchaseFilters").addEventListener("click", loadPurchases);
document.getElementById("applyUserSearch").addEventListener("click", loadUsers);

document.getElementById("adminLogoutButton").addEventListener("click", async () => {
  try {
    await apiFetch("/api/logout", { method: "POST" });
  } catch {
    // Local logout still proceeds.
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
  location.href = "store.html";
});

initializeAdmin();
