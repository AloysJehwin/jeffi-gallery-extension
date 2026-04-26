const apiUrlInput = document.getElementById('apiUrl')
const adminTokenInput = document.getElementById('adminToken')
const saveBtn = document.getElementById('save')
const status = document.getElementById('status')

chrome.storage.local.get(['apiUrl', 'adminToken'], ({ apiUrl, adminToken }) => {
  if (apiUrl) apiUrlInput.value = apiUrl
  if (adminToken) adminTokenInput.value = adminToken
})

saveBtn.addEventListener('click', () => {
  const apiUrl = apiUrlInput.value.trim().replace(/\/$/, '')
  const adminToken = adminTokenInput.value.trim()

  if (!apiUrl) {
    status.textContent = 'API URL is required.'
    status.className = 'error'
    return
  }
  if (!adminToken) {
    status.textContent = 'Admin token is required.'
    status.className = 'error'
    return
  }

  chrome.storage.local.set({ apiUrl, adminToken }, () => {
    status.textContent = 'Settings saved.'
    status.className = ''
    setTimeout(() => { status.textContent = '' }, 2000)
  })
})
