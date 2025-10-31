# Event Image Upload & Display Implementation

## Overview

Implemented the functionality to upload images on the event creation page and display these images on the event list page. If an event has no uploaded images, the system will automatically display a default placeholder image.

## Implemented Features

### 1. Image Upload Functionality
- ✅ Upload up to 5 images on `/organization/events/create` page
- ✅ Images automatically upload to AWS S3 storage
- ✅ First image used as event cover image
- ✅ All images saved to `event_images` database table

### 2. Image Display Functionality
- ✅ Display event cover image on `/organization/events` list page
- ✅ Display system default placeholder if no images
- ✅ Automatically fallback to default image on load failure
- ✅ Improved card design with image area and overlay labels

### 3. Default Placeholder
- ✅ Created beautiful SVG default image: `/public/default-event-cover.svg`
- ✅ Gradient design (blue to purple)
- ✅ Includes "Event Image" text identifier

## Modified Files

### 1. `/src/app/api/organization/events/route.ts`
**Changes:**
- Import `uploadToS3` function
- POST method supports both FormData and JSON formats
- Handle image file uploads to S3
- Save image URL to `event.imageUrl` field
- Create `EventImage` records associated with event
- GET method includes event cover image
- Add `coverImage` field to return data

**Key Code:**
```typescript
// Upload images to S3
const imageUrls: string[] = [];
for (let i = 0; i < imageFiles.length; i++) {
  const file = imageFiles[i];
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `events/${organizationId}/${Date.now()}-${i}-${file.name}`;
  const url = await uploadToS3(buffer, fileName, file.type);
  imageUrls.push(url);
}

// Set first image as cover
imageUrl: imageUrls.length > 0 ? imageUrls[0] : null

// Create EventImage records
if (imageUrls.length > 0) {
  await Promise.all(
    imageUrls.map((url, index) =>
      prisma.eventImage.create({
        data: {
          url,
          eventId: event.id,
          userId: user.id,
          category: index === 0 ? 'cover' : 'general',
        },
      })
    )
  );
}
```

### 2. `/src/app/organization/events/create/page.tsx`
**Changes:**
- Modify `onSubmit` function to support FormData
- Use FormData when images are present, otherwise use JSON
- Add detailed debug logs
- Ensure FormData is properly constructed and sent

**Key Code:**
```typescript
if (eventImages.length > 0) {
  const formData = new FormData();
  formData.append('eventData', JSON.stringify(eventData));
  
  eventImages.forEach((image, index) => {
    formData.append(`image_${index}`, image);
  });

  response = await fetch('/api/organization/events', {
    method: 'POST',
    body: formData,
  });
}
```

### 3. `/src/app/organization/events/page.tsx`
**Changes:**
- Update `Event` interface, add `coverImage` and `imageUrl` fields
- Redesign event cards, add image area
- Implement image display logic and error handling
- Move status labels and action menu to image overlay

**Key Code:**
```typescript
const eventImageUrl = event.coverImage || event.imageUrl || '/default-event-cover.svg';

<div className="relative w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600">
  <img
    src={eventImageUrl}
    alt={event.title}
    className="w-full h-full object-cover"
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.src = '/default-event-cover.svg';
    }}
  />
  {/* Overlay labels */}
</div>
```

### 4. `/public/default-event-cover.svg` (New)
Created a beautiful SVG placeholder image, including:
- Gradient background (blue to purple)
- Abstract icon design
- "Event Image" text

## Database Schema

### Event Table
- `imageUrl`: Event cover image URL (stores first uploaded image)

### EventImage Table
```sql
CREATE TABLE "event_images" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "category" TEXT DEFAULT 'general',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP,
  FOREIGN KEY ("eventId") REFERENCES "events"("id"),
  FOREIGN KEY ("userId") REFERENCES "users"("id")
);
```

## Workflow

### Upload Images When Creating Event:
1. User selects images on event creation page (max 5 images)
2. On submit, frontend packages images and event data into FormData
3. Backend receives FormData, extracts eventData and image files
4. Upload each image to S3, get URLs
5. Create Event record, set first image as cover (imageUrl field)
6. Create EventImage record for each image

### Display Event List:
1. GET API includes first image when querying events (via images relation)
2. Build return data, add coverImage field
3. Frontend receives data, prioritizes coverImage, then imageUrl
4. If neither exists, use default placeholder
5. If image load fails, onError falls back to default image

## Error Handling

### Backend
- ✅ Supports both FormData and JSON request formats
- ✅ Automatically falls back to JSON if FormData parsing fails
- ✅ Image upload failure doesn't affect other images
- ✅ Detailed logging for debugging

### Frontend
- ✅ Displays default image when image load fails
- ✅ Logging when building FormData
- ✅ User-friendly error messages for API errors

## Usage

### Create Event with Images:
1. Visit `/organization/events/create`
2. Fill in event information
3. Upload images in "Event Images" section (optional)
4. Submit to create event

### View Event List:
1. Visit `/organization/events`
2. Each event card displays cover image at top
3. Click card to view event details

## Technical Details

### S3 Upload Configuration
- File path format: `events/{organizationId}/{timestamp}-{index}-{filename}`
- ACL setting: `public-read`
- Automatically sets correct Content-Type

### Image Processing
- Supported formats: JPG, PNG, WebP and other browser-supported formats
- Maximum quantity: 5 images
- First image automatically set as cover

### API Compatibility
- Backward compatible: Can create events normally without images (pure JSON request)
- Uses FormData request when images are present

## Debugging

### View Logs
Frontend logs (browser console):
- FormData construction information
- Image count and size
- API request results

Backend logs (server):
- Request format detection
- Number of images received
- Upload results

### Common Issues
1. **Images not displaying**: Check if S3 configuration and URLs are correct
2. **Upload failure**: Check file size and format
3. **Default image not displaying**: Ensure `/public/default-event-cover.svg` file exists

## Future Improvements

- [ ] Add image compression and size optimization
- [ ] Support image editing (crop, rotate)
- [ ] Image lazy loading for performance optimization
- [ ] Add image preview and management features
- [ ] Support adding images from URL
- [ ] Add image titles and descriptions

