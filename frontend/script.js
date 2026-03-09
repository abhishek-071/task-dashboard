// ================= TOKEN CHECK =================
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

//================== Auto logout Section ================
function checkTokenExpiry() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiry = payload.exp * 1000;
  const now = Date.now();

  const timeLeft = expiry - now;

  if (timeLeft <= 0) {
    logout();
  } else {
    setTimeout(() => {
      alert("Session expired. Please login again.");
      logout();
    }, timeLeft);
  }
}

checkTokenExpiry();

// ================= GLOBAL STATE =================
let allTasks = [];
let currentFilter = "all";

// ================= SAFE FETCH (GLOBAL 401 HANDLER) =================
async function safeFetch(url, options = {}) {
  const response = await fetch(url, options);

  if (response.status === 401) {
    alert("Session expired. Please login again.");
    logout();
    return null;
  }

  return response;
}

// ================= COMMON AUTH HEADERS =================
function authHeaders(extra = {}) {
  return {
    "Authorization": "Bearer " + token,
    ...extra
  };
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", function () {
  loadTasks();

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
});

// ================= ADD TASK =================
async function addTask() {
  const input = document.getElementById("taskInput");
  const title = input.value.trim();

  if (!title) {
    alert("Please enter a task!");
    return;
  }

  const res = await safeFetch("http://localhost:5000/tasks", {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({ title })
  });

  if (!res) return;

  input.value = "";
  await loadTasks();
}

// ================= LOAD TASKS =================
async function loadTasks() {
  const response = await safeFetch("http://localhost:5000/tasks", {
    headers: authHeaders()
  });

  if (!response) return;

  allTasks = await response.json();
  renderTasks();
}

// ================= RENDER =================
function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  let filtered = allTasks;

  if (currentFilter === "active") {
    filtered = allTasks.filter(task => !task.completed);
  }

  if (currentFilter === "completed") {
    filtered = allTasks.filter(task => task.completed);
  }

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

    taskList.appendChild(li);
  });

  document.getElementById("taskCount").innerText =
    filtered.length + " Tasks";
}

// ================= FILTER =================
function setFilter(type) {
  currentFilter = type;
  renderTasks();
}

// ================= DELETE =================
async function deleteTask(id) {
  const res = await safeFetch(`http://localhost:5000/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  if (!res) return;
  loadTasks();
}

// ================= TOGGLE =================
async function toggleTask(id) {
  const res = await safeFetch(`http://localhost:5000/tasks/${id}/toggle`, {
    method: "PUT",
    headers: authHeaders()
  });

  if (!res) return;
  loadTasks();
}

// ================= EDIT =================
async function editTask(id, oldTitle) {
  const newTitle = prompt("Edit task:", oldTitle);

  if (!newTitle || newTitle.trim() === "") return;

  const res = await safeFetch(`http://localhost:5000/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({ title: newTitle })
  });

  if (!res) return;
  loadTasks();
}

// ================= CLEAR ALL =================
async function clearAllTasks() {
  const confirmDelete = confirm("Are you sure you want to delete all tasks?");
  if (!confirmDelete) return;

  const res = await safeFetch("http://localhost:5000/tasks", {
    method: "DELETE",
    headers: authHeaders()
  });

  if (!res) return;
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
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
}

// ================= SIDEBAR =================
function goToTasks(element) {
  setActive(element);

  const dashboard = document.getElementById("dashboardSection");
  const task = document.getElementById("taskSection");

  if (dashboard) dashboard.style.display = "none";
  if (task) task.style.display = "block";
}

function showDashboard(element) {
  setActive(element);

  const dashboard = document.getElementById("dashboardSection");
  const task = document.getElementById("taskSection");

  if (dashboard) dashboard.style.display = "block";
  if (task) task.style.display = "none";
}

function setActive(element) {
  document.querySelectorAll(".sidebar li").forEach(li => {
    li.classList.remove("active");
  });
  element.classList.add("active");
}