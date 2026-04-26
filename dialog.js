const params = new URLSearchParams(window.location.search)
const srcUrl = params.get('src') || ''

const preview = document.getElementById('preview')
const nameInput = document.getElementById('nameInput')
const saveBtn = document.getElementById('saveBtn')
const cancelBtn = document.getElementById('cancelBtn')
const status = document.getElementById('status')

if (srcUrl) {
  preview.src = srcUrl
  preview.onerror = () => { preview.style.display = 'none' }
  try {
    const hostname = new URL(srcUrl).hostname.replace('www.', '')
    nameInput.value = hostname
    nameInput.select()
  } catch {}
}

cancelBtn.addEventListener('click', () => window.close())

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveBtn.click()
  if (e.key === 'Escape') window.close()
})

saveBtn.addEventListener('click', async () => {
  const name = nameInput.value.trim()
  if (!name) {
    status.textContent = 'Please enter a name.'
    status.className = 'error'
    return
  }

  saveBtn.disabled = true
  cancelBtn.disabled = true
  status.textContent = 'Uploading...'
  status.className = 'uploading'

  const { apiUrl, adminToken } = await chrome.storage.local.get(['apiUrl', 'adminToken'])

  if (!apiUrl || !adminToken) {
    status.textContent = 'Not configured. Open Settings first.'
    status.className = 'error'
    saveBtn.disabled = false
    cancelBtn.disabled = false
    return
  }

  try {
    const res = await fetch(`${apiUrl}/api/gallery/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ imageUrl: srcUrl, customName: name }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Server error ${res.status}`)
    }

    const data = await res.json()

    chrome.storage.local.get(['uploadLogs'], ({ uploadLogs }) => {
      const logs = uploadLogs || []
      logs.unshift({
        name,
        sourceUrl: srcUrl,
        thumbnailUrl: data.thumbnail_url || '',
        timestamp: Date.now(),
        status: 'success',
      })
      chrome.storage.local.set({ uploadLogs: logs.slice(0, 50) })
    })

    status.textContent = 'Saved to gallery!'
    status.className = 'success'
    setTimeout(() => window.close(), 1200)
  } catch (err) {
    chrome.storage.local.get(['uploadLogs'], ({ uploadLogs }) => {
      const logs = uploadLogs || []
      logs.unshift({
        name,
        sourceUrl: srcUrl,
        thumbnailUrl: '',
        timestamp: Date.now(),
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      chrome.storage.local.set({ uploadLogs: logs.slice(0, 50) })
    })

    status.textContent = err instanceof Error ? err.message : 'Upload failed'
    status.className = 'error'
    saveBtn.disabled = false
    cancelBtn.disabled = false
  }
})
