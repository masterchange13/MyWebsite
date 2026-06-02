import request from '@/utils/request'

export const documentApi = {
  getAll: () => request.get('/document/getAll/'),
  detail: (id) => request.get('/document/detail/', { params: { id } }),
  publish: (data) => request.post('/document/publish/', data),
  remove: (id) => request.delete(`/document/remove/${id}/`),
  // comments
  getComments: (documentId) => request.get('/document/comment/list/', { params: { document_id: documentId } }),
  addComment: (data) => request.post('/document/comment/add/', data),
  deleteComment: (commentId) => request.delete(`/document/comment/delete/${commentId}/`),
}
