# Jeffi Gallery Uploader

Chrome extension (Manifest V3) for uploading images to the Jeffi Stores gallery directly from any webpage.

## Setup

1. Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select this folder.
2. Click the extension icon and enter:
   - **API URL** — your Jeffi Stores domain (e.g. `https://jeffistores.in`)
   - **Admin Token** — copy from **Admin › Settings › Chrome Extension Token**
3. Right-click any image on any page → **Save to Jeffi Gallery**

## How it works

- Context menu registers on right-clicked images
- On click, sends a `POST /api/gallery/upload` request with `Authorization: Bearer <token>` and `{ imageUrl }` in the body
- The server fetches the image, converts to JPEG, generates a thumbnail, stores both in S3, and records in the `gallery_images` table
- A notification confirms success or shows the error message

## Using saved images

In the admin panel, go to **Add / Edit Product → Product Images → Choose from Gallery** to browse and select images you've saved with this extension.
