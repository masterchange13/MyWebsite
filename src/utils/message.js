import { ElMessage } from 'element-plus'

const Message = {
  success(message) {
    ElMessage({
      message,
      type: 'success',
      duration: 3000
    })
  },

  error(message) {
    ElMessage({
      message,
      type: 'error',
      duration: 3000
    })
  },

  warning(message) {
    ElMessage({
      message,
      type: 'warning',
      duration: 3000
    })
  },

  info(message) {
    ElMessage({
      message,
      type: 'info',
      duration: 3000
    })
  }
}

export default Message
