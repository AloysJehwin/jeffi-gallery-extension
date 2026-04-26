chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-gallery',
    title: 'Save to Jeffi Gallery',
    contexts: ['image'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'save-to-gallery') return

  await chrome.storage.local.set({ pendingUpload: info.srcUrl || '' })
  await chrome.action.openPopup()
})
