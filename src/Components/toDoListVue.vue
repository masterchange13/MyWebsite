<template>
  <div class="todo-page">
    <section class="todoapp">
    <header class="header">
      <h1>Mission Board</h1>
      <input
        class="new-todo"
        autofocus
        placeholder="输入任务后按 Enter 添加..."
        @keyup.enter="addTodo"
      >
    </header>
    <section class="main" v-show="todos.length">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        :checked="remaining === 0"
        @change="toggleAll"
      >
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li
          v-for="todo in filteredTodos"
          class="todo"
          :key="todo.time"
          :class="{ completed: todo.completed, editing: todo === editedTodo }" 
        >
        <div class="view">
          <input class="toggle" type="checkbox" v-model="todo.completed" @change="toDoApi.updateTodoStatus(todo)">
          <label class="todo-title" @dblclick="editTodo(todo)">
            {{ todo.title }}
          </label>
          <div class="todo-time">
            <span class="time created">创建 {{ formatTime(todo.created_time) }}</span>
            <span class="time updated">更新 {{ formatTime(todo.updated_time) }}</span>
          </div>
          <button class="destroy" @click="removeTodo(todo)"></button>
        </div>

          <input
            v-if="todo === editedTodo"
            class="edit"
            type="text"
            v-model="todo.title"
            @vue:mounted="({ el }) => el.focus()"
            @blur="doneEdit(todo)"
            @keyup.enter="doneEdit(todo)"
            @keyup.escape="cancelEdit(todo)"
          >
        </li>
      </ul>
    </section>
    <footer class="footer" v-show="todos.length">
      <span class="todo-count">
        <strong>{{ remaining }}</strong>
        <span>{{ remaining === 1 ? ' item' : ' items' }} left</span>
      </span>
      <ul class="filters">
        <li>
          <a href="#" 
            :class="{ selected: visibility === 'all' }"
            @click.prevent="visibility = 'all'">
            All
          </a>
        </li>
        <li>
          <a href="#" 
            :class="{ selected: visibility === 'active' }"
            @click.prevent="visibility = 'active'">
            Active
          </a>
        </li>
        <li>
          <a href="#" 
            :class="{ selected: visibility === 'completed' }"
            @click.prevent="visibility = 'completed'">
            Completed
          </a>
        </li>
      </ul>
      <button class="clear-completed" @click="removeCompleted" v-show="todos.length > remaining">
        Clear completed
      </button>
    </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { toDoApi } from '@/api/toDoApi'
import { ElMessage } from 'element-plus'

const STORAGE_KEY = 'vue-todomvc'

const filters = {
  all: (todos) => todos,
  active: (todos) => todos.filter((todo) => !todo.completed),
  completed: (todos) => todos.filter((todo) => todo.completed)
}

// state
const todos = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
const visibility = ref('all')
const editedTodo = ref()

toDoApi.getAllTodo().then(response => {
  todos.value = response.data
})

// derived state
const filteredTodos = computed(() => filters[visibility.value](todos.value))
const remaining = computed(() => filters.active(todos.value).length)

// handle routing
// window.addEventListener('hashchange', onHashChange)

// persist state
watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value))
})

function toggleAll(e) {
  todos.value.forEach((todo) => (todo.completed = e.target.checked))
}

function addTodo(e) {
  const value = e.target.value.trim()
    const data = {
      time: Date.now(),
      title: value,
      completed: false,
      created_time: Date.now(),
      updated_time: Date.now()
    }
    if (!value) {
      return
    }
    toDoApi.addTodo(data).then(response => {
      if (response.code === 200) {
        todos.value.push(data)
        e.target.value = ''
        console.log(response);
      }else{
        ElMessage.error(response.msg)
      }
    })
}

function removeTodo(todo) {
  todos.value.splice(todos.value.indexOf(todo), 1)
  toDoApi.removeTodo(todo).then(response => {
    if (response.code === 200) {
      ElMessage.success("删除成功")
      console.log(response);
    }else{
      ElMessage.error(response.msg)
    }
  })
}

let beforeEditCache = ''
function editTodo(todo) {
  beforeEditCache = todo.title
  editedTodo.value = todo
}

function cancelEdit(todo) {
  editedTodo.value = null
  todo.title = beforeEditCache
}

function doneEdit(todo) {
  if (editedTodo.value) {
    editedTodo.value = null
    todo.title = todo.title.trim()
    toDoApi.doneEdit(todo).then(response => {
      if (response.code === 200) {
        ElMessage.success(response.data)
        console.log(response);
      }else{
        ElMessage.error(response.msg)
      } 
    })
  }
}

function removeCompleted() {
  todos.value = filters.active(todos.value)
  toDoApi.removeCompleted().then(response => {
    if (response.code === 200) {
      ElMessage.success(response.data)
      console.log(response);
    }else{
      ElMessage.error(response.msg)
    } 
  })
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''

  const date = new Date(timeStr)

  const Y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const D = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')

  return `${Y}-${M}-${D} ${h}:${m}`
}
</script>

<style scoped>
.todo-page {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background:
    radial-gradient(1200px 500px at -240px -240px, rgba(0, 245, 255, 0.12) 0%, rgba(0, 245, 255, 0) 60%),
    radial-gradient(900px 500px at 120% 0, rgba(255, 0, 204, 0.10) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, #090a1a 0%, #0d1022 100%);
}

.todoapp {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 980px;
  margin: 0 auto;
  border: 1px solid rgba(0, 255, 255, 0.25);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(7, 11, 24, 0.78);
  box-shadow: 0 0 18px rgba(0, 245, 255, 0.12), 0 0 36px rgba(255, 0, 204, 0.08);
  backdrop-filter: blur(6px);
}

.header {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.08) 0%, rgba(255, 0, 204, 0.08) 100%);
}

.header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #9ef7ff;
  text-shadow: 0 0 12px rgba(0, 245, 255, 0.4);
}

.new-todo {
  width: 100%;
  height: 48px;
  border: 1px solid rgba(0, 255, 255, 0.25);
  border-radius: 10px;
  background: rgba(8, 14, 32, 0.88);
  color: #d6fbff;
  padding: 0 14px;
  font-size: 15px;
  box-sizing: border-box;
  outline: none;
}

.new-todo::placeholder {
  color: #88a8be;
}

.new-todo:focus {
  border-color: rgba(0, 255, 255, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 255, 255, 0.12);
}

.main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.toggle-all {
  margin: 12px 0 0 16px;
}

.toggle-all + label {
  color: #97bed7;
}

.todo-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.todo {
  margin: 8px 12px;
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 12px;
  background: rgba(13, 19, 40, 0.8);
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.todo:hover {
  border-color: rgba(255, 0, 204, 0.28);
  transform: translateY(-1px);
}

.todo.completed .todo-title {
  text-decoration: line-through;
  opacity: 0.55;
}

.view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
}

.todo-content {
  flex: 1;
  margin-left: 6px;
  display: flex;
  flex-direction: column;
}

.todo-title {
  flex: 1;
  font-size: 17px;
  font-weight: 500;
  color: #d8f8ff;
  cursor: pointer;
  margin-right: 8px;
  word-break: break-word;
}

.todo-title:hover {
  color: #ff8bea;
}

.todo-time {
  margin-top: 2px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.time {
  font-size: 12px;
  color: #7fa4bd;
}

.time.created::before {
  content: "⏱ ";
}

.time.updated::before {
  content: "↻ ";
}

.toggle {
  width: 20px;
  height: 20px;
}

.destroy {
  width: 26px;
  height: 26px;
  background: none;
  color: #ff7dcf;
  border: none;
  cursor: pointer;
  opacity: 0.75;
}

.destroy:hover {
  opacity: 1;
  color: #ff46bd;
}

.destroy::after {
  content: "×";
  font-size: 22px;
  line-height: 1;
}

.edit {
  width: calc(100% - 28px);
  margin: 0 14px 12px;
  height: 40px;
  border: 1px solid rgba(0, 255, 255, 0.28);
  border-radius: 8px;
  background: rgba(8, 14, 32, 0.88);
  color: #d6fbff;
  padding: 0 12px;
  box-sizing: border-box;
}

.footer {
  border-top: 1px solid rgba(0, 255, 255, 0.2);
  background: rgba(8, 10, 24, 0.9);
  color: #9ec2da;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.todo-count strong {
  color: #9ef7ff;
}

.filters {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.filters a {
  color: #8bb0cb;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
}

.filters a:hover {
  color: #ff8bea;
}

.filters a.selected {
  color: #9ef7ff;
  border-color: rgba(0, 255, 255, 0.35);
  background: rgba(0, 255, 255, 0.08);
}

.clear-completed {
  border: 1px solid rgba(255, 0, 204, 0.35);
  background: rgba(255, 0, 204, 0.08);
  color: #ff96e7;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
}

.clear-completed:hover {
  background: rgba(255, 0, 204, 0.15);
}

@media (max-width: 768px) {
  .todo-page {
    padding: 10px;
  }
  .header h1 {
    font-size: 22px;
  }
}
</style>

