const viewUpload = document.getElementById('view-upload')
const viewMain = document.getElementById('view-main')

chrome.storage.local.get(['pendingUpload'], ({ pendingUpload }) => {
  if (pendingUpload) {
    showUploadView(pendingUpload)
  }
})

function showUploadView(srcUrl) {
  viewUpload.classList.add('active')
  viewMain.classList.add('hidden')

  const img = document.getElementById('previewImg')
  img.src = srcUrl
  img.onerror = () => {
    img.parentElement.innerHTML = '<span class="no-preview">Preview unavailable</span>'
  }

  const nameInput = document.getElementById('nameInput')
  try {
    nameInput.value = new URL(srcUrl).hostname.replace('www.', '')
  } catch {}
  setTimeout(() => { nameInput.focus(); nameInput.select() }, 50)

  chrome.storage.local.get(['apiUrl', 'adminToken'], ({ apiUrl, adminToken }) => {
    if (apiUrl && adminToken) {
      fetch(`${apiUrl}/api/categories`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      })
        .then(r => r.json())
        .then(data => {
          const ul = document.getElementById('csOptions')
          ul.innerHTML = '<li class="cs-option cs-selected" data-value="">No category</li>'
          ;(data.categories || []).forEach(c => {
            const li = document.createElement('li')
            li.className = 'cs-option'
            li.dataset.value = c.id
            li.textContent = c.name
            ul.appendChild(li)
          })
          attachDropdownListeners()
        })
        .catch(() => { attachDropdownListeners() })
    } else {
      attachDropdownListeners()
    }
  })

  document.getElementById('backBtn').addEventListener('click', dismissUploadView)
  document.getElementById('cancelUpload').addEventListener('click', dismissUploadView)

  document.getElementById('nameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('doUpload').click()
    if (e.key === 'Escape') dismissUploadView()
  })

  document.getElementById('doUpload').addEventListener('click', () => doUpload(srcUrl))
}

function dismissUploadView() {
  chrome.storage.local.remove('pendingUpload')
  viewUpload.classList.remove('active')
  viewMain.classList.remove('hidden')
}

async function doUpload(srcUrl) {
  const name = document.getElementById('nameInput').value.trim()
  const categoryId = document.getElementById('categoryValue').value || null
  const msg = document.getElementById('uploadMsg')
  const saveBtn = document.getElementById('doUpload')

  if (!name) {
    setMsg(msg, 'Please enter a name.', 'err')
    return
  }

  const { apiUrl, adminToken } = await chrome.storage.local.get(['apiUrl', 'adminToken'])
  if (!apiUrl || !adminToken) {
    setMsg(msg, 'Configure API URL and token in Settings first.', 'err')
    return
  }

  saveBtn.disabled = true
  setMsg(msg, 'Uploading...', 'info')

  try {
    const res = await fetch(`${apiUrl}/api/gallery/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ imageUrl: srcUrl, customName: name, categoryId }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Server error ${res.status}`)
    }

    const data = await res.json()
    pushLog({ name, sourceUrl: srcUrl, thumbnailUrl: data.thumbnail_url || '', timestamp: Date.now(), status: 'success' })
    setMsg(msg, 'Saved to gallery!', 'ok')
    chrome.storage.local.remove('pendingUpload')
    setTimeout(() => window.close(), 1000)
  } catch (err) {
    pushLog({ name, sourceUrl: srcUrl, thumbnailUrl: '', timestamp: Date.now(), status: 'error', error: err.message })
    setMsg(msg, err.message || 'Upload failed', 'err')
    saveBtn.disabled = false
  }
}

function pushLog(entry) {
  chrome.storage.local.get(['uploadLogs'], ({ uploadLogs }) => {
    const logs = uploadLogs || []
    logs.unshift(entry)
    chrome.storage.local.set({ uploadLogs: logs.slice(0, 50) })
  })
}

function attachDropdownListeners() {
  const trigger = document.getElementById('csTrigger')
  const dropdown = document.getElementById('csDropdown')
  const label = document.getElementById('csLabel')
  const valueInput = document.getElementById('categoryValue')
  if (!trigger || !dropdown) return

  trigger.addEventListener('click', () => {
    const isOpen = dropdown.classList.contains('open')
    dropdown.classList.toggle('open', !isOpen)
    trigger.classList.toggle('open', !isOpen)
  })

  dropdown.addEventListener('click', e => {
    const opt = e.target.closest('.cs-option')
    if (!opt) return
    dropdown.querySelectorAll('.cs-option').forEach(el => el.classList.remove('cs-selected'))
    opt.classList.add('cs-selected')
    label.textContent = opt.textContent.replace('✓', '').trim()
    valueInput.value = opt.dataset.value || ''
    dropdown.classList.remove('open')
    trigger.classList.remove('open')
  })

  document.addEventListener('click', e => {
    if (!document.getElementById('categoryDropdown')?.contains(e.target)) {
      dropdown.classList.remove('open')
      trigger.classList.remove('open')
    }
  })
}

function setMsg(el, text, type) {
  el.textContent = text
  el.className = 'msg ' + type
}

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
const settingsMsg = document.getElementById('settingsMsg')

chrome.storage.local.get(['apiUrl', 'adminToken'], ({ apiUrl, adminToken }) => {
  if (apiUrl) apiUrlInput.value = apiUrl
  if (adminToken) adminTokenInput.value = adminToken
})

document.getElementById('saveSettings').addEventListener('click', () => {
  const apiUrl = apiUrlInput.value.trim().replace(/\/$/, '')
  const adminToken = adminTokenInput.value.trim()
  if (!apiUrl) { setMsg(settingsMsg, 'API URL is required.', 'err'); return }
  if (!adminToken) { setMsg(settingsMsg, 'Admin token is required.', 'err'); return }
  chrome.storage.local.set({ apiUrl, adminToken }, () => setMsg(settingsMsg, 'Settings saved.', 'ok'))
})

function renderLogs() {
  chrome.storage.local.get(['uploadLogs'], ({ uploadLogs }) => {
    const logs = uploadLogs || []
    const list = document.getElementById('logList')
    if (!logs.length) { list.innerHTML = '<div class="empty">No uploads yet.</div>'; return }
    list.innerHTML = logs.map(log => {
      const thumb = log.thumbnailUrl
        ? `<img class="log-thumb" src="${log.thumbnailUrl}" onerror="this.className='log-placeholder'" />`
        : '<div class="log-placeholder"></div>'
      return `<div class="log-item">
        ${thumb}
        <div class="log-info">
          <div class="log-name" title="${log.name}">${log.name}</div>
          <div class="log-time">${new Date(log.timestamp).toLocaleString()}</div>
        </div>
        <span class="badge ${log.status === 'success' ? 'ok' : 'err'}">${log.status === 'success' ? 'OK' : 'ERR'}</span>
      </div>`
    }).join('')
  })
}

document.getElementById('clearLogs').addEventListener('click', () => {
  chrome.storage.local.remove('uploadLogs', () => {
    document.getElementById('logList').innerHTML = '<div class="empty">No uploads yet.</div>'
  })
})
