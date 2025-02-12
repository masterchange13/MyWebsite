<template>
    <div>
        <h1>Get Document</h1>
        
        <!-- show all the file in the server -->
        <div>
            {{ files }}    
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue'
    import {useRouter} from 'vue-router'
    import { request } from '@/utils/request';
    import { ElMessage } from 'element-plus';

    const router = useRouter()

    const file = ref(null)

    // 使用钩子函数，在组件加载时获取所有文件
    onMounted(() => {
        getAllFile()
    })

    const getAllFile = async () => {
        // get all the file in the server
        try{
            file.value = await request.post('/getAllFile')

        }catch(err){
            console.log(err)
            ElMessage.error(err)
        }
    }
</script>