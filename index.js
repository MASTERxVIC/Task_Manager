window.onload = function() {
  // Load tasks from localStorage
  let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  tasks.forEach(addTaskToTable);

  // Load checked tasks and apply CSS classes
  loadCheckedTasks();
};

// Submit form listener
document.querySelector("form").addEventListener("submit", function (event) {
  event.preventDefault();

  var task = document.getElementById("task").value.trim();
  var des = document.getElementById("des").value.trim();
  var deadline = document.getElementById("date").value.trim();

  if (task === "" || des === "" || deadline === "") {
    alert("Please fill all the fields");
    return;
  }

  let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

  // Check if task already exists
  if (tasks.some((t) => t.task === task && t.des === des && t.deadline === deadline)) {
    return alert("Task already exists");
  }

  // Add new task to localStorage and table
  let newTask = { task, des, deadline, completed: false };
  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  addTaskToTable(newTask);
  resetForm();
});

// Add task to table
function addTaskToTable(task) {
  let row = document.createElement("tr");
  row.innerHTML = `
    <td> ${task.task} </td> 
    <td> ${task.des} </td>
    <td> ${task.deadline} </td>
    <td class="toggle-container">
      <label class="switch">
        <input type="checkbox" class="task-toggle" ${task.completed ? "checked" : ""} onchange="toggleTask(this)">
        <span class="slideRound"></span>
      </label>
      <button onclick="deleteTask(this)">Delete</button>
    </td>`;

  document.getElementById("taskTableBody").appendChild(row);
}

// Delete task from table
function deleteTask(button) {
  let row = button.closest("tr");
  let [task, des, deadline] = [...row.children].map((td) => td.innerText);
  let tasks = JSON.parse(localStorage.getItem("tasks")).filter((t) => t.task !== task || t.des !== des || t.deadline !== deadline);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  row.remove();
}

// Toggle task completion
function toggleTask(checkbox) {
  let row = checkbox.closest("tr"),
      [task, des, deadline] = [...row.children].map((td) => td.innerText);
  let tasks = JSON.parse(localStorage.getItem("tasks"));

  tasks.forEach((t) => {
    if (t.task === task && t.des === des && t.deadline === deadline) {
      t.completed = checkbox.checked;
    }
  });

  if (checkbox.checked) {
    row.classList.add("checked");
  } else {
    row.classList.remove("checked");
  }

  localStorage.setItem("tasks", JSON.stringify(tasks));
  saveCheckedTasks();
}

// Save checked tasks to localStorage
function saveCheckedTasks() {
  let checkedTasks = [];
  document.querySelectorAll("#taskTableBody tr.checked").forEach((row) => {
    let [task, des, deadline] = [...row.children].map((td) => td.innerText);
    checkedTasks.push({ task, des, deadline });
  });
  localStorage.setItem("checkedTasks", JSON.stringify(checkedTasks));
}

// Load checked tasks and apply CSS classes
function loadCheckedTasks() {
  let checkedTasks = JSON.parse(localStorage.getItem("checkedTasks") || "[]");
  document.querySelectorAll("#taskTableBody tr").forEach((row) => {
    let [task, des, deadline] = [...row.children].map((td) => td.innerText);
    if (checkedTasks.some((t) => t.task === task && t.des === des && t.deadline === deadline)) {
      row.classList.add("checked");
      row.querySelector(".task-toggle").checked = true;
    }
  });
}

// Reset form after submission
function resetForm() {
  document.querySelector("form").reset();
}

// Clear all tasks from localStorage
function clearAll() {
  if (confirm("Are you sure you want to clear all stored tasks?")) {
    localStorage.clear();
    alert("All data has been cleared.");
    location.reload();
  }
}

// Filter functions (same as before)
function handleFilterChange() {
  const filterType = document.getElementById("filterType").value;

  document.getElementById("completionOption").style.display = "none";
  document.getElementById("deadlineOption").style.display = "none";

  if (filterType === "completion") {
    document.getElementById("completionOption").style.display = "block";
  } else if (filterType === "deadline") {
    document.getElementById("deadlineOption").style.display = "block";
  }
}

function filterByCompletion(status) {
  const tasks = getTasks();
  return tasks.filter(task => task.completed === (status === "completed"));
}

function filterByDeadlineRange(startDate, endDate) {
  const tasks = getTasks();
  return tasks.filter(task => {
    const taskDeadline = new Date(task.deadline);
    return taskDeadline >= new Date(startDate) && taskDeadline <= new Date(endDate);
  });
}

function applyFilter() {
  const filterType = document.getElementById("filterType").value;

  let filteredTasks = getTasks();

  if (filterType === "completion") {
    const selectedCompletionStatus = document.querySelector('input[name="completionStatus"]:checked');
    if (selectedCompletionStatus) {
      filteredTasks = filterByCompletion(selectedCompletionStatus.value);
    }
  } else if (filterType === "deadline") {
    const startDate = document.getElementById("startDateFilter").value;
    const endDate = document.getElementById("endDateFilter").value;
    if (startDate && endDate) {
      filteredTasks = filterByDeadlineRange(startDate, endDate);
    }
  }
  renderTasks(filteredTasks);
}

function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function renderTasks(tasks) {
  const taskTableBody = document.getElementById("taskTableBody");
  taskTableBody.innerHTML = "";

  tasks.forEach(task => {
    const row = document.createElement("tr");

    if (task.completed) {
      row.classList.add("checked");
    }

    row.innerHTML = `
      <td>${task.task}</td>
      <td>${task.des}</td>
      <td>${task.deadline}</td>
      <td class="toggle-container">
        <label class="switch">
          <input type="checkbox" class="task-toggle" ${task.completed ? "checked" : ""} onchange="toggleTask(this)">
          <span class="slideRound"></span>
        </label>
        <button onclick="deleteTask(this)">Delete</button>
      </td>
    `;
    taskTableBody.appendChild(row);
  });
}

function clearFilter() {
  document.getElementById("filterType").value = "";
  const selectedCompletion = document.querySelector('input[name="completionStatus"]:checked');
  if (selectedCompletion) {
    selectedCompletion.checked = false;
  }
  document.getElementById("startDateFilter").value = "";
  document.getElementById("endDateFilter").value = "";
  document.getElementById("completionOption").style.display = "none";
  document.getElementById("deadlineOption").style.display = "none";
  renderTasks(getTasks());
}

document.getElementById("filter").addEventListener("click", () => {
  const Dropdown = document.getElementById("dropDown");
  console.log("filter button is working nicely ");
  Dropdown.classList.toggle("show");
});

function newTab(){
  window.open('Documentation.html', '_blank'); 

}