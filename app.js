/* ===================================================================
   Ledger — Task Manager
   Vanilla JS. Tasks ("entries") are persisted to localStorage so
   nothing is lost on refresh. No build step, no dependencies.
   =================================================================== */

(() => {
  "use strict";

  const STORAGE_KEY = "ledger.tasks.v1";

  /** @typedef {{id:string, title:string, notes:string, priority:'high'|'medium'|'low', due:string|null, completed:boolean, createdAt:number}} Task */

  /** @type {Task[]} */
  let tasks = loadTasks();
  let activeFilter = "all";
  let activeSort = "created";
  let editingId = null;

  // ---------- Elements ----------
  const entriesEl = document.getElementById("entries");
  const emptyStateEl = document.getElementById("emptyState");
  const sheetTitleEl = document.getElementById("sheetTitle");
  const sheetSubEl = document.getElementById("sheetSub");
  const tabsEl = document.querySelector(".ledger-tabs");
  const sortSelect = document.getElementById("sortSelect");
  const entryTemplate = document.getElementById("entryTemplate");

  const scrim = document.getElementById("scrim");
  const panel = document.getElementById("panel");
  const panelTitle = document.getElementById("panelTitle");
  const entryForm = document.getElementById("entryForm");
  const entryIdInput = document.getElementById("entryId");
  const entryTitleInput = document.getElementById("entryTitle");
  const entryNotesInput = document.getElementById("entryNotes");
  const entryDueInput = document.getElementById("entryDue");
  const titleError = document.getElementById("titleError");
  const deleteBtn = document.getElementById("deleteBtn");
  const toastEl = document.getElementById("toast");

  const FILTER_LABELS = {
    all: "All entries",
    high: "High priority",
    medium: "Medium priority",
    low: "Low priority",
    completed: "Completed",
  };

  // ---------- Storage ----------

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Ledger: couldn't read saved tasks", err);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error("Ledger: couldn't save tasks", err);
      showToast("Couldn't save — your browser storage may be full.");
    }
  }

  // ---------- Rendering ----------

  function render() {
    const filtered = getFilteredSortedTasks();

    entriesEl.innerHTML = "";
    emptyStateEl.hidden = filtered.length !== 0;

    for (const task of filtered) {
      entriesEl.appendChild(buildRow(task));
    }

    sheetTitleEl.textContent = FILTER_LABELS[activeFilter];
    sheetSubEl.textContent = `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`;

    updateCounts();
  }

  function getFilteredSortedTasks() {
    let list = tasks.slice();

    if (activeFilter === "completed") {
      list = list.filter((t) => t.completed);
    } else if (activeFilter !== "all") {
      list = list.filter((t) => t.priority === activeFilter && !t.completed);
    } else {
      // "All" shows open items first, completed at the bottom
    }

    const priorityRank = { high: 0, medium: 1, low: 2 };

    list.sort((a, b) => {
      if (activeFilter === "all" && a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      switch (activeSort) {
        case "priority":
          return priorityRank[a.priority] - priorityRank[b.priority];
        case "due":
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due.localeCompare(b.due);
        case "alpha":
          return a.title.localeCompare(b.title);
        case "created":
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return list;
  }

  function updateCounts() {
    const open = tasks.filter((t) => !t.completed);
    document.getElementById("count-all").textContent = tasks.length;
    document.getElementById("count-high").textContent = open.filter((t) => t.priority === "high").length;
    document.getElementById("count-medium").textContent = open.filter((t) => t.priority === "medium").length;
    document.getElementById("count-low").textContent = open.filter((t) => t.priority === "low").length;
    document.getElementById("count-completed").textContent = tasks.filter((t) => t.completed).length;
  }

  function buildRow(task) {
    const node = entryTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = task.id;
    node.dataset.priority = task.priority;
    node.classList.toggle("is-complete", task.completed);

    const check = node.querySelector(".check");
    check.setAttribute("aria-pressed", String(task.completed));
    check.setAttribute("aria-label", task.completed ? "Mark incomplete" : "Mark complete");

    node.querySelector(".entry-title").textContent = task.title;

    const notesEl = node.querySelector(".entry-notes");
    if (task.notes) {
      notesEl.textContent = task.notes;
    } else {
      notesEl.remove();
    }

    node.querySelector(".entry-priority").textContent =
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    const dueEl = node.querySelector(".entry-due");
    if (task.due) {
      dueEl.textContent = formatDue(task.due);
      if (!task.completed && isOverdue(task.due)) {
        dueEl.classList.add("is-overdue");
      }
    } else {
      dueEl.remove();
    }

    return node;
  }

  function formatDue(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function isOverdue(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  // ---------- CRUD ----------

  function createTask({ title, notes, priority, due }) {
    tasks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      title,
      notes,
      priority,
      due: due || null,
      completed: false,
      createdAt: Date.now(),
    });
    saveTasks();
    render();
    showToast("Entry added.");
  }

  function updateTask(id, changes) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    Object.assign(task, changes);
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
    showToast("Entry deleted.");
  }

  function toggleComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    render();
  }

  // ---------- Panel (add / edit) ----------

  function openPanel(task) {
    editingId = task ? task.id : null;
    panelTitle.textContent = task ? "Edit entry" : "New entry";
    deleteBtn.hidden = !task;
    titleError.hidden = true;
    entryTitleInput.classList.remove("has-error");

    entryIdInput.value = task ? task.id : "";
    entryTitleInput.value = task ? task.title : "";
    entryNotesInput.value = task ? task.notes || "" : "";
    entryDueInput.value = task ? task.due || "" : "";

    const priority = task ? task.priority : "medium";
    const radio = entryForm.querySelector(`input[name="priority"][value="${priority}"]`);
    if (radio) radio.checked = true;

    scrim.hidden = false;
    panel.hidden = false;
    document.body.style.overflow = "hidden";
    entryTitleInput.focus();
  }

  function closePanel() {
    scrim.hidden = true;
    panel.hidden = true;
    document.body.style.overflow = "";
    editingId = null;
    entryForm.reset();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const title = entryTitleInput.value.trim();

    if (!title) {
      titleError.hidden = false;
      entryTitleInput.focus();
      return;
    }

    const priority = entryForm.querySelector('input[name="priority"]:checked').value;
    const notes = entryNotesInput.value.trim();
    const due = entryDueInput.value || null;

    if (editingId) {
      updateTask(editingId, { title, notes, priority, due });
      showToast("Entry updated.");
    } else {
      createTask({ title, notes, priority, due });
    }

    closePanel();
  }

  // ---------- Toast ----------

  let toastTimer = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2400);
  }

  // ---------- Event wiring ----------

  document.getElementById("openAddBtn").addEventListener("click", () => openPanel(null));
  document.getElementById("closePanelBtn").addEventListener("click", closePanel);
  document.getElementById("cancelBtn").addEventListener("click", closePanel);
  scrim.addEventListener("click", closePanel);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) closePanel();
  });

  entryForm.addEventListener("submit", handleSubmit);

  deleteBtn.addEventListener("click", () => {
    if (!editingId) return;
    if (confirm("Delete this entry? This can't be undone.")) {
      deleteTask(editingId);
      closePanel();
    }
  });

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    tabsEl.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t === btn));
    activeFilter = btn.dataset.filter;
    render();
  });

  sortSelect.addEventListener("change", () => {
    activeSort = sortSelect.value;
    render();
  });

  entriesEl.addEventListener("click", (e) => {
    const row = e.target.closest(".entry");
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.closest(".check")) {
      toggleComplete(id);
    } else if (e.target.closest(".edit-btn")) {
      const task = tasks.find((t) => t.id === id);
      if (task) openPanel(task);
    } else if (e.target.closest(".delete-btn")) {
      if (confirm("Delete this entry? This can't be undone.")) {
        deleteTask(id);
      }
    }
  });

  // ---------- Init ----------
  render();
})();
