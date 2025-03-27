<template>
    <section class="todoapp">
    <header class="header">
      <h1>Todos</h1>
      <input
        class="new-todo"
        autofocus
        placeholder="What needs to be done?"
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
            <label @dblclick="editTodo(todo)">{{ todo.title }}</label>
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
          <a href="#/all" :class="{ selected: visibility === 'all' }">All</a>
        </li>
        <li>
          <a href="#/active" :class="{ selected: visibility === 'active' }">Active</a>
        </li>
        <li>
          <a href="#/completed" :class="{ selected: visibility === 'completed' }">Completed</a>
        </li>
      </ul>
      <button class="clear-completed" @click="removeCompleted" v-show="todos.length > remaining">
        Clear completed
      </button>
    </footer>
    </section>
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
//   if (value) {
//     todos.value.push({
//       time: Date.now(),
//       title: value,
//       completed: false
//     })
//     e.target.value = ''
//   }
    const data = {
      time: Date.now(),
      title: value,
      completed: false
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
</script>

<style scoped>
@import "todomvc-app-css/index.css";
</style>


