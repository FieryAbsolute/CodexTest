// Wait for Material Web Components and FullCalendar to be loaded
window.addEventListener('load', () => {
    // Add a small delay to ensure all external scripts are fully processed
    setTimeout(() => {
        let allScriptsLoaded = true;
        if (typeof FullCalendar === 'undefined' || typeof FullCalendar.Calendar === 'undefined') {
            console.error('FullCalendar CORE NOT LOADED. Calendar will not initialize.');
            allScriptsLoaded = false;
        }
        // Correct global names for CDN-loaded plugins are typically FullCalendarDayGrid and FullCalendarInteraction
        if (typeof FullCalendarDayGrid === 'undefined' || typeof FullCalendarDayGrid.plugin === 'undefined') {
            console.error('FullCalendar DAYGRID PLUGIN (FullCalendarDayGrid) NOT LOADED. Calendar will not initialize.');
            allScriptsLoaded = false;
        }
        if (typeof FullCalendarInteraction === 'undefined' || typeof FullCalendarInteraction.plugin === 'undefined') {
            console.error('FullCalendar INTERACTION PLUGIN (FullCalendarInteraction) NOT LOADED. Calendar will not initialize.');
            allScriptsLoaded = false;
        }

        if (allScriptsLoaded) {
            console.log('FullCalendar and plugins appear loaded. Initializing app...');
            initialize();
        } else {
            console.error('One or more FullCalendar scripts did not load correctly. Please check script tags and network access.');
            const calendarContainer = document.getElementById('calendar-container');
            if (calendarContainer) {
                calendarContainer.innerHTML = '<p style="color: red;">Error: Calendar components failed to load. Check console (F12) & try a hard refresh (Ctrl+F5).</p>';
            }
            // Attempt to initialize non-calendar parts if main app logic is separate
            // For now, our initialize() function includes calendar, so we don't call it if calendar scripts fail.
            // If task functionality is truly independent, we could call a separate initTasks() here.
        }
    }, 100); // 100ms delay
});

let calendarInstance = null; // To hold the FullCalendar instance

function initialize() {
    // DOM Elements
    // const loginSection = document.querySelector('.login-section'); // Removed
    const appContent = document.getElementById('app-content'); // Remains, but default visibility changed in HTML
    
    const userProfileDiv = document.getElementById('user-profile');
    const googleSigninContainerDiv = document.getElementById('google-signin-container');
    
    const userNameSpan = document.getElementById('user-name');
    const userPictureImg = document.getElementById('user-picture');
    // const googleSignInButton = document.querySelector('.g_id_signin'); // This specific button is part of googleSigninContainerDiv
    const logoutButton = document.getElementById('logout-button');

    const newTaskInput = document.getElementById('new-task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const taskList = document.getElementById('task-list');
    const calendarContainer = document.getElementById('calendar-container');

    // Show app content by default (handled by HTML structure now)
    // appContent.style.display = 'block'; 

    // Load tasks and render calendar immediately
    loadTasks();
    initializeAndRenderCalendar();

    // Check for existing session
    if (sessionStorage.getItem('userLoggedIn') === 'true') {
        const user = JSON.parse(sessionStorage.getItem('googleUser'));
        if (user) {
            displayLoggedInUserInterface(user);
        } else {
            // Should not happen if userLoggedIn is true, but as a fallback:
            displayLoggedOutUserInterface();
        }
    } else {
        displayLoggedOutUserInterface();
    }

    // Google Sign-In Handler
    window.handleCredentialResponse = (response) => {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const user = JSON.parse(jsonPayload);
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('googleUser', JSON.stringify(user));
        sessionStorage.setItem('googleUserEmail', user.email); // Store email for logout revocation
        displayLoggedInUserInterface(user);
    };

    function displayLoggedInUserInterface(user) {
        userProfileDiv.style.display = 'block'; // Or 'flex' if layout needs it
        googleSigninContainerDiv.style.display = 'none';

        userNameSpan.textContent = user.name;
        userPictureImg.src = user.picture;
        // Logout button is part of userProfileDiv, so it becomes visible
    }

    function displayLoggedOutUserInterface() {
        userProfileDiv.style.display = 'none';
        googleSigninContainerDiv.style.display = 'block'; // Or 'flex'
        
        // Clear any previous user info, just in case
        userNameSpan.textContent = '';
        userPictureImg.src = '';
        // Google Sign-In button is part of googleSigninContainerDiv
    }

    // Logout
    logoutButton.addEventListener('click', () => {
        const userEmail = sessionStorage.getItem('googleUserEmail');
        if (userEmail && typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.revoke(userEmail, done => {
                // console.log('consent revoked for ' + userEmail);
            });
        }
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
        }
        sessionStorage.removeItem('userLoggedIn');
        sessionStorage.removeItem('googleUser');
        sessionStorage.removeItem('googleUserEmail');
        // taskList.innerHTML = ''; // Tasks are local, don't clear on logout unless specifically desired
        displayLoggedOutUserInterface();
    });

    // Task Management (remains the same)
    let tasks = [];

    addTaskButton.addEventListener('click', () => {
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            // For now, tasks added via input don't have a specific date for the calendar
            // We'll enhance this later to allow selecting a date or defaulting
            const newTask = { 
                id: Date.now().toString(), // FullCalendar event IDs are often strings
                text: taskText, 
                completed: false,
                // title: taskText, // for FullCalendar
                // date: new Date().toISOString().slice(0,10) // Example: assign to today
            };
            tasks.push(newTask);
            newTaskInput.value = '';
            renderTasks(); // Update the list display
            saveTasks();
            refreshCalendarEvents(); // Update calendar display
        }
    });

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const listItem = document.createElement('md-list-item');
            listItem.setAttribute('headline', task.text);
            listItem.setAttribute('data-task-id', task.id);
            
            const checkbox = document.createElement('md-checkbox');
            checkbox.slot = "end";
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                listItem.style.textDecoration = task.completed ? 'line-through' : 'none';
                saveTasks();
                refreshCalendarEvents(); // Reflect completion status on calendar
            });
            listItem.style.textDecoration = task.completed ? 'line-through' : 'none';

            const deleteButton = document.createElement('md-icon-button');
            deleteButton.slot = "end";
            deleteButton.innerHTML = '<md-icon>delete</md-icon>';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                tasks = tasks.filter(t => t.id !== task.id);
                renderTasks();
                saveTasks();
                refreshCalendarEvents();
            });
            
            listItem.appendChild(checkbox);
            listItem.appendChild(deleteButton);
            taskList.appendChild(listItem);
        });
    }

    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem('todoTasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        } else {
            tasks = []; // Ensure tasks is an array
        }
        renderTasks(); 
    }

    function mapTasksToCalendarEvents() {
        return tasks.map(task => ({
            id: task.id.toString(),
            title: task.text,
            start: task.date || new Date().toISOString().slice(0,10), // Default to today if no date
            allDay: true, // Assume all-day tasks for now
            classNames: task.completed ? ['task-completed'] : [],
            // extendedProps can hold original task data if needed
            extendedProps: {
                originalTask: task
            }
        }));
    }

    function initializeAndRenderCalendar() {
        const calendarEl = document.getElementById('calendar-container');
        if (!calendarEl) {
            console.error('Calendar container element (#calendar-container) not found. Calendar cannot be rendered.');
            return; // Stop if container isn't there
        }
        if (calendarInstance) {
            calendarInstance.destroy();
        }
        calendarEl.innerHTML = ''; // Clear placeholder or old content

        try {
            calendarInstance = new FullCalendar.Calendar(calendarEl, {
                plugins: [ FullCalendarDayGrid.plugin, FullCalendarInteraction.plugin ], 
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek,dayGridDay'
                },
                editable: true, 
                selectable: true, 
                events: mapTasksToCalendarEvents(),
                dateClick: function(info) {
                    const taskText = prompt('Enter task for ' + info.dateStr + ':', 'New task on this date');
                    if (taskText) {
                        const newTask = {
                            id: Date.now().toString(),
                            text: taskText,
                            completed: false,
                            date: info.dateStr 
                        };
                        tasks.push(newTask);
                        renderTasks();
                        saveTasks();
                        if (calendarInstance) { // Check if calendarInstance is valid
                            calendarInstance.addEvent({
                                id: newTask.id,
                                title: newTask.text,
                                start: newTask.date,
                                allDay: true
                            });
                        }
                    }
                },
                eventClick: function(info) {
                    const clickedTask = tasks.find(t => t.id.toString() === info.event.id.toString());
                    if (clickedTask) {
                        clickedTask.completed = !clickedTask.completed;
                        renderTasks(); 
                        saveTasks();
                        if (info.event) { // Check if info.event is valid
                            info.event.setExtendedProp('originalTask', clickedTask); 
                            if (clickedTask.completed) {
                                info.event.setProp('classNames', ['task-completed']);
                            } else {
                                info.event.setProp('classNames', []);
                            }
                        }
                    }
                },
                eventDrop: function(info) { 
                    const droppedTask = tasks.find(t => t.id.toString() === info.event.id.toString());
                    if (droppedTask && info.event) { // Check if droppedTask and info.event are valid
                        droppedTask.date = info.event.startStr.slice(0,10); 
                        saveTasks();
                        renderTasks(); 
                    }
                }
            });
            calendarInstance.render();
            console.log('FullCalendar rendered successfully.');
        } catch (e) {
            console.error('Error during FullCalendar initialization or rendering:', e);
            calendarEl.innerHTML = '<p style="color: red;">Critical error initializing calendar. Check console (F12).</p>';
        }
    }

    function refreshCalendarEvents() {
        if (calendarInstance) {
            calendarInstance.removeAllEvents();
            mapTasksToCalendarEvents().forEach(event => calendarInstance.addEvent(event));
        }
    }

    // Initial setup in initialize() function already calls loadTasks and initializeAndRenderCalendar
} 