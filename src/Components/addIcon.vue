<template>
    <el-form :model="website">
        <el-form-item label="Name" prop="name">
            <el-input v-model="website.name" />
        </el-form-item>
        <el-form-item label="URL" prop="url">
            <el-input v-model="website.url" />
        </el-form-item>
        <el-form-item label="Image" prop="img">
            <el-input v-model="website.img" />
        </el-form-item>

        <el-form-item>
            <el-button @click="resetForm">Reset</el-button>
            <el-button type="primary" @click="submitForm">Add</el-button>
        </el-form-item>
    </el-form>
</template>
 
<script setup>
import { ref, computed } from 'vue';
import Message from '@/utils/message'
import { navigatorApi } from '@/api/navigatorApi'
import { useUserStore } from '@/stores/userStore'
const emit = defineEmits(['added'])

const website = ref({
    name: '',
    url: '',
    img: ''
});    

const userStore = useUserStore()
const username = computed(() => userStore.getUsername())

const resetForm = () => {
    website.value.name = '';
    website.value.url = '';
    website.value.img = '';
};

const submitForm = async () => {
    try {
        const res = await navigatorApi.addNavigator({ ...website.value, username: username.value })
        if (res && res.code === 200) {
            Message.success('Icon added successfully!')
            emit('added')
            resetForm()
        } else {
            Message.error(res?.msg || 'Failed to add icon')
        }
    } catch (error) {
        Message.error('Error occurred while adding icon')
        console.error(error)
    }
};


</script>
