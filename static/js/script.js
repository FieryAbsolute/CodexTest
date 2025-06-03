document.addEventListener('DOMContentLoaded', () => {
  const newTaskForm = document.getElementById('new-task-form');
  const newTaskInput = document.getElementById('new-task-input');
  const taskList = document.getElementById('task-list');
  const menuButton = document.querySelector('md-icon-button[icon="menu"]');
  const drawer = document.getElementById('drawer');

  // Drawer toggle (from previous step, ensure it's here)
  if (menuButton && drawer) {
    menuButton.addEventListener('click', () => {
      drawer.open = !drawer.open;
    });
  }

  // Handle new task submission
  if (newTaskForm) {
    newTaskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const taskText = newTaskInput.value.trim();
      if (taskText === '') {
        // Potentially show an error or just ignore
        return;
      }
      addTask(taskText);
      newTaskInput.value = ''; // Clear input
      // newTaskInput.focus(); // Optionally refocus
    });
  }

  function addTask(text) {
    const taskItem = document.createElement('md-list-item');
    taskItem.setAttribute('headline', text);
    // taskItem.setAttribute('supporting-text', 'Click checkbox to complete'); // Optional

    const checkbox = document.createElement('md-checkbox');
    checkbox.setAttribute('touch-target', 'wrapper');
    checkbox.slot = 'start'; // Place checkbox at the start of the list item

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        taskItem.style.textDecoration = 'line-through';
        taskItem.style.opacity = '0.6';
      } else {
        taskItem.style.textDecoration = 'none';
        taskItem.style.opacity = '1';
      }
    });

    taskItem.appendChild(checkbox);
    taskList.appendChild(taskItem);
  }

  // Example: Add a few initial tasks
  addTask("Buy groceries");
  addTask("Finish project report");
  addTask("Schedule dentist appointment");
});
