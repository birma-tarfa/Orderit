# Supabase Storage Setup - Product Images

Run the following SQL commands in your Supabase SQL Editor to set up the product image storage bucket and policies.

## Step 1: Create Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);
```

## Step 2: Create Storage Policies

```sql
-- Policy to allow anyone to upload product images
CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- Policy to allow anyone to view product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
```

## Execution Steps:

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" section
3. Click "New Query"
4. Copy and paste the SQL commands above
5. Click "Run" to execute all commands
6. You should see success messages for each policy created

## Features Implemented:

### ImageUpload Component (`src/components/ui/ImageUpload.tsx`)
- Multiple image upload (up to 5 images)
- Drag-and-drop zone with visual feedback
- Image preview grid
- Individual image removal with X button
- Progress bar while uploading
- File type validation (jpg, png, webp only)
- File size validation (5MB max per file)
- Error handling and display
- Public URL returned via onChange callback

### AvatarUpload Component (`src/components/ui/AvatarUpload.tsx`)
- Single image upload
- Current image preview or placeholder
- Click to upload
- Customizable folder path (default: 'logos')
- File validation (image files only, 5MB max)
- Error display

### Updated Product Forms
- `src/app/(main)/vendor/products/new/page.tsx` - Uses ImageUpload component
- `src/app/(main)/vendor/products/[id]/edit/page.tsx` - Uses ImageUpload component

## Usage Example:

```tsx
import { ImageUpload } from "@/components/ui/ImageUpload";

export function MyProductForm() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <ImageUpload
      value={images}
      onChange={(urls) => setImages(urls)}
    />
  );
}
```

## Storage Structure:

```
product-images/
├── products/
│   ├── {timestamp}-{random}.jpg
│   ├── {timestamp}-{random}.png
│   └── {timestamp}-{random}.webp
└── logos/
    ├── {timestamp}-{random}.jpg
    └── {timestamp}-{random}.png
```

All images are stored with public read access, allowing them to be displayed without authentication.
