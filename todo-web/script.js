function handleCredentialResponse(response) {
    const data = parseJwt(response.credential);
    document.querySelector('.login-section').classList.add('hidden');
    document.querySelector('.task-section').classList.remove('hidden');
    document.querySelector('.calendar-section').classList.remove('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('logout-button').addEventListener('click', logout);
    localStorage.setItem('user', JSON.stringify(data));
}

function logout() {
    localStorage.removeItem('user');
    document.querySelector('.login-section').classList.remove('hidden');
    document.querySelector('.task-section').classList.add('hidden');
    document.querySelector('.calendar-section').classList.add('hidden');
    document.getElementById('user-info').classList.add('hidden');
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function initTasks() {
    const addButton = document.getElementById('add-task-button');
    const input = document.getElementById('new-task-input');
    const list = document.getElementById('task-list');

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    function render() {
        list.innerHTML = '';
        tasks.forEach((task, index) => {
            const item = document.createElement('md-list-item');
            item.innerHTML = `<div>${task}</div>`;
            item.addEventListener('click', () => {
                tasks.splice(index, 1);
                save();
                render();
            });
            list.appendChild(item);
        });
    }

    function save() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    addButton.addEventListener('click', () => {
        if (input.value.trim()) {
            tasks.push(input.value.trim());
            input.value = '';
            save();
            render();
        }
    });

    render();
}

function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    const date = new Date();
    calendarEl.innerHTML = date.toDateString();
}

window.addEventListener('DOMContentLoaded', () => {
    initTasks();
    initCalendar();
});
