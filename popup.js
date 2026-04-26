const tabs = document.querySelectorAll('.tab')
const panels = document.querySelectorAll('.panel')

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'))
    panels.forEach(p => p.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active')
    if (tab.dataset.tab === 'logs') renderLogs()
  })
})

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
  if (!apiUrl) { showStatus('API URL is required.', true); return }
  if (!adminToken) { showStatus('Admin token is required.', true); return }
  chrome.storage.local.set({ apiUrl, adminToken }, () => showStatus('Settings saved.', false))
})

function showStatus(msg, isError) {
  status.textContent = msg
  status.className = isError ? 'error' : ''
  setTimeout(() => { status.textContent = '' }, 2500)
}

function renderLogs() {
  chrome.storage.local.get(['uploadLogs'], ({ uploadLogs }) => {
    const logs = uploadLogs || []
    const list = document.getElementById('logList')
    if (logs.length === 0) {
      list.innerHTML = '<div class="empty">No uploads yet.</div>'
      return
    }
    list.innerHTML = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleString()
      const thumb = log.thumbnailUrl
        ? `<img class="log-thumb" src="${log.thumbnailUrl}" onerror="this.outerHTML='<div class=log-thumb-placeholder></div>'" />`
        : '<div class="log-thumb-placeholder"></div>'
      return `
        <div class="log-item">
          ${thumb}
          <div class="log-info">
            <div class="log-name" title="${log.name}">${log.name}</div>
            <div class="log-time">${time}</div>
          </div>
          <span class="log-status ${log.status}">${log.status === 'success' ? 'OK' : 'ERR'}</span>
        </div>`
    }).join('')
  })
}

document.getElementById('clearLogs').addEventListener('click', () => {
  chrome.storage.local.remove('uploadLogs', () => {
    document.getElementById('logList').innerHTML = '<div class="empty">No uploads yet.</div>'
  })
})
