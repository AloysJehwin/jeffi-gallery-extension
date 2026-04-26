chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-gallery',
    title: 'Save to Jeffi Gallery',
    contexts: ['image'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'save-to-gallery') return

  const { apiUrl, adminToken } = await chrome.storage.local.get(['apiUrl', 'adminToken'])

  if (!apiUrl || !adminToken) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/48.png',
      title: 'Jeffi Gallery',
      message: 'Please configure your API URL and token in the extension settings.',
    })
    return
  }

  try {
    const res = await fetch(`${apiUrl}/api/gallery/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ imageUrl: info.srcUrl }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Server error ${res.status}`)
    }

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/48.png',
      title: 'Jeffi Gallery',
      message: 'Image saved to gallery.',
    })
  } catch (err) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/48.png',
      title: 'Jeffi Gallery — Upload Failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})
