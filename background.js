chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-gallery',
    title: 'Save to Jeffi Gallery',
    contexts: ['image'],
  })
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== 'save-to-gallery') return

  const src = encodeURIComponent(info.srcUrl || '')
  const dialogUrl = chrome.runtime.getURL(`dialog.html?src=${src}`)

  chrome.windows.create({
    url: dialogUrl,
    type: 'popup',
    width: 332,
    height: 320,
    focused: true,
  })
})
