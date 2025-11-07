import toast from 'react-hot-toast'

export function notifySuccess(message) {
  toast.success(message || 'Success')
}

export function notifyError(errOrMessage) {
  let message = ''
  if (typeof errOrMessage === 'string') message = errOrMessage
  else if (errOrMessage?.response?.data?.message) message = errOrMessage.response.data.message
  else if (errOrMessage?.message) message = errOrMessage.message
  else message = 'Something went wrong'
  toast.error(message)
}

export function notifyInfo(message) {
  toast(message || 'Notice')
}

