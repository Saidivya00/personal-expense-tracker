// ---------- State ----------
const STORAGE_KEY = "expenses";
let expenses = [];        // the list of all expenses
let editingId = null;     // id of the expense being edited (null = adding new)

// ---------- Page elements ----------
const form = document.getElementById("expenseForm");
const nameInput = document.getElementById("name");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");
const filterSelect = document.getElementById("filterCategory");
const clearAllBtn = document.getElementById("clearAllBtn");
const tableBody = document.getElementById("expenseBody");
const emptyMessage = document.getElementById("emptyMessage");

// ---------- localStorage ----------
function saveToLocalStorage() {
  // localStorage only stores text, so we convert the array to a JSON string
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) { expenses = []; return; }
  try {
    expenses = JSON.parse(saved);   // convert the text back into an array
  } catch (error) {
    expenses = [];                  // saved data was damaged, start fresh
  }
}

// ---------- Validation ----------
function showError(input, message) {
  document.getElementById(input.id + "Error").textContent = message;
  input.classList.toggle("invalid", message !== "");
}

function validateForm() {
  let valid = true;
  const checks = [
    [nameInput, nameInput.value.trim() === "", "Please enter an expense name."],
    [amountInput, !(parseFloat(amountInput.value) > 0), "Amount must be greater than 0."],
    [categoryInput, categoryInput.value === "", "Please select a category."],
    [dateInput, dateInput.value === "", "Please select a date."]
  ];
  checks.forEach(([input, failed, message]) => {
    showError(input, failed ? message : "");
    if (failed) valid = false;
  });
  return valid;
}

// ---------- Add / Edit / Delete / Clear ----------
function addExpense() {
  expenses.push({
    id: Date.now(),
    name: nameInput.value.trim(),
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  });
}

function startEdit(id) {
  const expense = expenses.find((item) => item.id === id);
  if (!expense) return;
  editingId = id;
  nameInput.value = expense.name;
  amountInput.value = expense.amount;
  categoryInput.value = expense.category;
  dateInput.value = expense.date;
  formTitle.textContent = "Edit expense";
  submitBtn.textContent = "Save changes";
  cancelBtn.hidden = false;
  nameInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateExpense() {
  const expense = expenses.find((item) => item.id === editingId);
  if (!expense) return;
  expense.name = nameInput.value.trim();
  expense.amount = parseFloat(amountInput.value);
  expense.category = categoryInput.value;
  expense.date = dateInput.value;
}

function resetForm() {
  form.reset();
  editingId = null;
  formTitle.textContent = "Add an expense";
  submitBtn.textContent = "Add expense";
  cancelBtn.hidden = true;
  [nameInput, amountInput, categoryInput, dateInput].forEach((input) => showError(input, ""));
}

function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  expenses = expenses.filter((item) => item.id !== id);
  if (editingId === id) resetForm();
  refresh();
}

function clearAllExpenses() {
  if (expenses.length === 0) return;
  if (!confirm("Delete ALL expenses? This cannot be undone.")) return;
  expenses = [];
  resetForm();
  refresh();
}

// ---------- Filtering and totals ----------
function getFilteredExpenses() {
  const selected = filterSelect.value;
  if (selected === "All") return expenses;
  return expenses.filter((item) => item.category === selected);
}

function calculateTotals() {
  // Dates look like "2026-10-05", so the first 7 characters are the year and month
  const now = new Date();
  const currentMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  let total = 0;
  let month = 0;
  expenses.forEach((item) => {
    total += item.amount;
    if (item.date.slice(0, 7) === currentMonth) month += item.amount;
  });
  return { total, count: expenses.length, month };
}

// ---------- Display ----------
function formatMoney(value) {
  return value.toFixed(2);
}

function displaySummary() {
  const totals = calculateTotals();
  document.getElementById("totalAmount").textContent = formatMoney(totals.total);
  document.getElementById("expenseCount").textContent = totals.count;
  document.getElementById("monthAmount").textContent = formatMoney(totals.month);
}

function createCell(text) {
  const td = document.createElement("td");
  td.textContent = text;   // textContent keeps user text safe (no HTML injection)
  return td;
}

function createActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn small " + className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function displayExpenses() {
  const list = getFilteredExpenses();
  tableBody.innerHTML = "";
  list.forEach((item) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(item.name));
    row.appendChild(createCell(formatMoney(item.amount)));
    row.appendChild(createCell(item.category));
    row.appendChild(createCell(item.date));
    const actions = document.createElement("td");
    actions.className = "row-actions";
    actions.appendChild(createActionButton("Edit", "", () => startEdit(item.id)));
    actions.appendChild(createActionButton("Delete", "danger", () => deleteExpense(item.id)));
    row.appendChild(actions);
    tableBody.appendChild(row);
  });
  if (list.length === 0) {
    emptyMessage.textContent = expenses.length === 0
      ? "No expenses yet. Add your first one above."
      : "No expenses in this category.";
  }
  emptyMessage.hidden = list.length > 0;
}

function refresh() {
  saveToLocalStorage();
  displaySummary();
  displayExpenses();
}

// ---------- Events ----------
form.addEventListener("submit", (event) => {
  event.preventDefault();               // stop the page from reloading
  if (!validateForm()) return;
  if (editingId === null) addExpense(); else updateExpense();
  resetForm();
  refresh();
});

cancelBtn.addEventListener("click", resetForm);
filterSelect.addEventListener("change", displayExpenses);
clearAllBtn.addEventListener("click", clearAllExpenses);

// ---------- Start ----------
loadFromLocalStorage();
displaySummary();
displayExpenses();
