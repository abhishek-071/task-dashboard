// ================= CONFIG =================
const API_BASE = "https://task-dashboard-vef8.onrender.com";

// ================= TOKEN CHECK =================
const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

// ================= AUTO LOGOUT =================
function checkTokenExpiry() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiry = payload.exp * 1000;
  const now = Date.now();
  const timeLeft = expiry - now;

  if (timeLeft <= 0) logout();
  else setTimeout(() => {
    alert("Session expired. Please login again.");
    logout();
  }, timeLeft);
}
checkTokenExpiry();

// ================= GLOBAL STATE =================
let allTasks = [];
let currentFilter = "all";

// ================= SAFE FETCH =================
async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    alert("Session expired. Please login again.");
    logout();
    return null;
  }
  return res;
}

// ================= AUTH HEADERS =================
function authHeaders(extra = {}) {
  return { "Authorization": "Bearer " + token, ...extra };
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  if (localStorage.getItem("darkMode") === "true")
    document.body.classList.add("dark");
});

// ================= ADD TASK =================
async function addTask() {
  const input = document.getElementById("taskInput");
  const title = input.value.trim();
  if (!title) return alert("Enter a task!");

  const res = await safeFetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title })
  });

  if (!res) return;
  input.value = "";
  loadTasks();
}

// ================= LOAD TASKS =================
async function loadTasks() {
  const res = await safeFetch(`${API_BASE}/tasks`, {
    headers: authHeaders()
  });
  if (!res) return;

  allTasks = await res.json();
  renderTasks();
}

// ================= RENDER =================
function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  let filtered = allTasks;
  if (currentFilter === "active") filtered = allTasks.filter(t => !t.completed);
  if (currentFilter === "completed") filtered = allTasks.filter(t => t.completed);

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="${task.completed ? "completed" : ""}">
        ${task.title}
      </span>
      <div class="actions">
        <button onclick="toggleTask('${task._id}')">✔</button>
        <button onclick="editTask('${task._id}', \`${task.title}\`)">✏</button>
        <button onclick="deleteTask('${task._id}')">✖</button>
      </div>
    `;
    list.appendChild(li);
  });

  document.getElementById("taskCount").innerText = filtered.length + " Tasks";
}

// ================= FILTER =================
function setFilter(type) {
  currentFilter = type;
  renderTasks();
}

// ================= DELETE =================
async function deleteTask(id) {
  await safeFetch(`${API_BASE}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  loadTasks();
}

// ================= TOGGLE =================
async function toggleTask(id) {
  await safeFetch(`${API_BASE}/tasks/${id}/toggle`, {
    method: "PUT",
    headers: authHeaders()
  });
  loadTasks();
}

// ================= EDIT =================
async function editTask(id, oldTitle) {
  const newTitle = prompt("Edit task:", oldTitle);
  if (!newTitle) return;

  await safeFetch(`${API_BASE}/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title: newTitle })
  });
  loadTasks();
}

// ================= CLEAR ALL =================
async function clearAllTasks() {
  if (!confirm("Delete all tasks?")) return;
  await safeFetch(`${API_BASE}/tasks`, {
    method: "DELETE",
    headers: authHeaders()
  });
  loadTasks();
}

// ================= SETTINGS =================
function openSettings() {
  document.getElementById("settingsModal").style.display = "flex";
}
function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode",
    document.body.classList.contains("dark"));
}
