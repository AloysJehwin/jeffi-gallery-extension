chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-gallery',
    title: 'Save to Jeffi Gallery',
    contexts: ['image'],
  })
})

function pushLog(entry) {
  chrome.storage.local.get(['uploadLogs'], ({ uploadLogs }) => {
    const logs = uploadLogs || []
    logs.unshift(entry)
    chrome.storage.local.set({ uploadLogs: logs.slice(0, 50) })
  })
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'save-to-gallery') return

  const { apiUrl, adminToken, pendingName } = await chrome.storage.local.get(['apiUrl', 'adminToken', 'pendingName'])

  if (!apiUrl || !adminToken) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/48.png',
      title: 'Jeffi Gallery',
      message: 'Please configure your API URL and token in the extension settings.',
    })
    return
  }

  const srcUrl = info.srcUrl || ''
  const autoName = pendingName || new URL(srcUrl).hostname + '-' + Date.now()

  await chrome.storage.local.remove('pendingName')

  try {
    const res = await fetch(`${apiUrl}/api/gallery/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ imageUrl: srcUrl, customName: autoName }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Server error ${res.status}`)
    }

    const data = await res.json()

    pushLog({
      name: autoName,
      sourceUrl: srcUrl,
      thumbnailUrl: data.thumbnail_url || '',
      timestamp: Date.now(),
      status: 'success',
    })

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/48.png',
      title: 'Jeffi Gallery',
      message: `Saved: ${autoName}`,
    })
  } catch (err) {
    pushLog({
      name: autoName,
      sourceUrl: srcUrl,
      thumbnailUrl: '',
      timestamp: Date.now(),
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    })

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/48.png',
      title: 'Jeffi Gallery — Upload Failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})
