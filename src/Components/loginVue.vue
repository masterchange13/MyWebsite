<template>
    <div class="login-container">
      <h2>登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="请输入用户名"
          />
          <p v-if="errors.username" class="error">{{ errors.username }}</p>
        </div>
  
        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="请输入密码"
          />
          <p v-if="errors.password" class="error">{{ errors.password }}</p>
        </div>
  
        <button class="login-button" @click="toDashboard()" >登录</button>
      </form>
    </div>
  </template>
  
  <script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// pinia
import { useUserStore } from '@/stores/userStore';

export default {    
  name: 'Login',
  setup() {
    const router = useRouter();
    const userStore = useUserStore(); // 在这里获取 store 实例

    const username = ref('');
    const password = ref('');
    const errors = ref({
      username: '',
      password: '',
    });

    const handleLogin = () => {
      // 重置错误信息
      errors.value.username = '';
      errors.value.password = '';

      // 校验用户名
      if (!username.value) {
        errors.value.username = '用户名不能为空';
      }

      // 校验密码
      if (!password.value) {
        errors.value.password = '密码不能为空';
      }

      // 如果没有错误，提交表单
      if (!errors.value.username && !errors.value.password) {
        alert(`登录成功！用户名: ${username.value}`);
        // 在这里调用 toDashboard 方法
        toDashboard();
      }
    };

    const toDashboard = () => {
      // 使用 Pinia 存储数据
      userStore.setUsername(username.value);
      router.push('/dashboard');
    };

    return {
      username,
      password,
      errors,
      handleLogin,
      toDashboard,
    };
  },
};
</script>
  
  <style scoped>
  .login-container {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  }
  
  input:focus {
    outline: none;
    border-color: #007bff;
  }
  
  .error {
    color: red;
    font-size: 14px;
    margin-top: 5px;
  }
  
  .login-button {
    width: 100%;
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
  
  .login-button:hover {
    background: #0056b3;
  }
  </style>
  