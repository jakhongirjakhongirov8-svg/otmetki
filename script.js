// Текущий режим: 'today', 'tomorrow', 'history'
let currentTab = 'today';

// Загрузка данных из localStorage
let todayTasks = JSON.parse(localStorage.getItem('pl_today')) || [];
let tomorrowTasks = JSON.parse(localStorage.getItem('pl_tomorrow')) || [];
let deletedHistory = JSON.parse(localStorage.getItem('pl_history')) || [];

// Функция переключения вкладок
function switchTab(tab) {
  currentTab = tab;

  // Сброс и установка стилей кнопок меню
  document.getElementById('tabToday').className = "w-full text-left flex items-center gap-3 text-zinc-400 hover:text-white px-3 py-2.5 rounded-xl transition cursor-pointer";
  document.getElementById('tabTomorrow').className = "w-full text-left flex items-center gap-3 text-zinc-400 hover:text-white px-3 py-2.5 rounded-xl transition";
  document.getElementById('tabHistory').className = "w-full text-left flex items-center gap-3 text-zinc-400 hover:text-white px-3 py-2.5 rounded-xl transition";

  const activeBtn = document.getElementById(tab === 'today' ? 'tabToday' : tab === 'tomorrow' ? 'tabTomorrow' : 'tabHistory');
  activeBtn.className = "w-full text-left flex items-center gap-3 text-white font-medium bg-zinc-800 px-3 py-2.5 rounded-xl transition cursor-pointer";

  const mainTitle = document.getElementById('mainTitle');
  const inputBox = document.getElementById('inputBox');
  const taskInput = document.getElementById('taskInput');

  if (tab === 'today') {
    mainTitle.innerText = "Планы на Сегодня";
    inputBox.style.display = 'flex';
    taskInput.placeholder = "Написать новый план на сегодня...";
  } else if (tab === 'tomorrow') {
    mainTitle.innerText = "Планы на Завтра";
    inputBox.style.display = 'flex';
    taskInput.placeholder = "Написать новый план на завтра...";
  } else if (tab === 'history') {
    mainTitle.innerText = "История удаленных задач";
    inputBox.style.display = 'none';
  }

  render();
}

// Главная функция отрисовки
function render() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';

  if (currentTab === 'today') {
    renderList(todayTasks);
    updateProgress(todayTasks);
  } else if (currentTab === 'tomorrow') {
    renderList(tomorrowTasks);
    updateProgress(tomorrowTasks);
  } else if (currentTab === 'history') {
    renderHistory();
  }
}

// Отрисовка списка задач (сегодня / завтра)
function renderList(list) {
  const taskList = document.getElementById('taskList');
  if (list.length === 0) {
    taskList.innerHTML = `<p class="text-zinc-400 text-sm text-center py-6">Задач в этом списке пока нет</p>`;
    return;
  }

  list.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = "flex items-center justify-between bg-white border border-zinc-200/80 shadow-sm rounded-full px-5 py-3.5 transition hover:shadow";
    li.innerHTML = `
      <label class="flex items-center gap-3.5 cursor-pointer flex-1 select-none">
        <input 
          type="checkbox" 
          ${task.completed ? 'checked' : ''} 
          onclick="toggleTask(${index})"
          class="w-5 h-5 accent-emerald-500 rounded-md cursor-pointer"
        >
        <span class="text-sm font-medium ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}">
          ${task.text}
        </span>
      </label>
      <button onclick="deleteTask(${index})" class="text-zinc-400 hover:text-red-500 p-1 transition cursor-pointer" title="Удалить">🗑️</button>
    `;
    taskList.appendChild(li);
  });
}

// Отрисовка Истории удалений
function renderHistory() {
  const taskList = document.getElementById('taskList');

  if (deletedHistory.length === 0) {
    taskList.innerHTML = `<p class="text-zinc-400 text-sm text-center py-6">История удалений пуста. Вы еще ничего не удаляли.</p>`;
    document.getElementById('progressPercent').innerText = "🗑️";
    document.getElementById('progressCount').innerText = "Архив пуст";
    return;
  }

  // Кнопка для очистки истории и блок со списком
  let html = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-xs text-zinc-500 font-medium">Всего удалено: ${deletedHistory.length}</span>
      <button onclick="clearHistory()" class="text-xs text-red-500 hover:underline cursor-pointer">Очистить историю</button>
    </div>
    <div class="space-y-3">
  `;

  // Выводим удаленные задачи (новые сверху)
  [...deletedHistory].reverse().forEach((item) => {
    html += `
      <div class="flex items-center justify-between bg-white border border-zinc-200/80 shadow-sm rounded-full px-5 py-3.5">
        <div class="flex items-center gap-3">
          <span class="text-red-400">❌</span>
          <span class="text-sm font-medium text-zinc-700 line-through">${item.text}</span>
        </div>
        <span class="text-xs text-zinc-400">${item.date}</span>
      </div>
    `;
  });

  html += '</div>';
  taskList.innerHTML = html;
  
  document.getElementById('progressPercent').innerText = "🗑️";
  document.getElementById('progressCount').innerText = `${deletedHistory.length} удалено`;
}

// Добавление задачи
function addTask() {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();
  if (!text) return;

  if (currentTab === 'today') {
    todayTasks.push({ text: text, completed: false });
  } else if (currentTab === 'tomorrow') {
    tomorrowTasks.push({ text: text, completed: false });
  }

  input.value = '';
  save();
  render();
}

// Переключение галочки
function toggleTask(index) {
  if (currentTab === 'today') {
    todayTasks[index].completed = !todayTasks[index].completed;
  } else if (currentTab === 'tomorrow') {
    tomorrowTasks[index].completed = !tomorrowTasks[index].completed;
  }
  save();
  render();
}

// Удаление задачи с сохранением в историю
function deleteTask(index) {
  let removedTask;

  if (currentTab === 'today') {
    removedTask = todayTasks.splice(index, 1)[0];
  } else if (currentTab === 'tomorrow') {
    removedTask = tomorrowTasks.splice(index, 1)[0];
  }

  if (removedTask) {
    // Получаем текущую дату и время для истории
    const now = new Date();
    const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Добавляем в массив истории
    deletedHistory.push({
      text: removedTask.text,
      date: timeStr
    });
  }

  save();
  render();
}

// Очистка истории
function clearHistory() {
  deletedHistory = [];
  save();
  render();
}

// Подсчет процентов для текущего дня/завтра
function updateProgress(list) {
  const total = list.length;
  if (total === 0) {
    document.getElementById('progressPercent').innerText = "0%";
    document.getElementById('progressCount').innerText = "0 выполнено";
    return;
  }
  const completed = list.filter(t => t.completed).length;
  const percent = Math.round((completed / total) * 100);
  document.getElementById('progressPercent').innerText = `${percent}%`;
  document.getElementById('progressCount').innerText = `${completed} из ${total} выполнено`;
}

// Сохранение в браузер
function save() {
  localStorage.setItem('pl_today', JSON.stringify(todayTasks));
  localStorage.setItem('pl_tomorrow', JSON.stringify(tomorrowTasks));
  localStorage.setItem('pl_history', JSON.stringify(deletedHistory));
}

// Горячая клавиша Enter для добавления
document.getElementById('taskInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

render();