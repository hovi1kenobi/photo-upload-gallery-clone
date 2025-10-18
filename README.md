# Photo Upload Gallery

![App Preview](https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&h=300&fit=crop&auto=format)

A secure photo upload and gallery website where visitors enter an access code to upload and view photos. Perfect for private events, weddings, parties, or any gathering where you want to collect and share photos with a select group of people.

## Features

- **🔐 Secure Access Control** - Environment variable-based access code protection
- **📤 Drag & Drop Upload** - Intuitive photo upload with visual feedback and progress tracking
- **🖼️ Responsive Photo Grid** - Beautiful masonry-style layout that adapts to any screen size
- **🔍 Full-Screen Modal Viewer** - Immersive photo viewing experience with smooth transitions
- **⌨️ Keyboard Navigation** - Arrow keys (←/→) for seamless photo browsing
- **🎯 Thumbnail Navigation** - Clickable thumbnail strip for quick photo selection
- **📱 Mobile Optimized** - Fully responsive design that works perfectly on all devices
- **⚡ Fast Loading** - Optimized image delivery using Cosmic's imgix integration
- **🎨 Clean UI** - Modern, minimalist design focusing on the photos

## Clone this Project

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Project](https://img.shields.io/badge/Clone%20this%20Project-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmicjs.com/projects/new?clone_bucket=68f2f8b6a8c41dcd66871049&clone_repository=68f2fa5ea8c41dcd6687104c)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> No content model prompt provided - app built from existing content structure

### Code Generation Prompt

> Create a photo upload website where visitors:
> 1. Type in an access code (set by env var)
> 2. Users can drop photos to upload (do not set a folder)
> 3. User can see all photos displayed in a grid, clicking photos opens a modal with full screen with navigation arrows and keyboard arrows. Also thumbnails at the bottom are clickable to set full screen image.

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Cosmic SDK** - Headless CMS for media management
- **React Hook Form** - Form handling and validation
- **Lucide React** - Modern icon library

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Cosmic account with a bucket set up
- Basic knowledge of React and Next.js

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd photo-upload-gallery
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   COSMIC_BUCKET_SLUG=your-bucket-slug
   COSMIC_READ_KEY=your-read-key
   COSMIC_WRITE_KEY=your-write-key
   ACCESS_CODE=your-secret-access-code
   ```

4. **Run the development server**
   ```bash
   bun dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000` and enter your access code to start uploading photos!

## Cosmic SDK Examples

### Uploading Photos
```typescript
const response = await cosmic.media.insertOne({
  media: file, // File object from drag & drop
});
```

### Fetching All Photos
```typescript
const response = await cosmic.media.find().props(['name', 'url', 'imgix_url', 'created_at']);
const photos = response.media;
```

### Optimizing Images with Imgix
```typescript
// Thumbnail
const thumbnailUrl = `${photo.imgix_url}?w=300&h=300&fit=crop&auto=format,compress`;

// Full size
const fullSizeUrl = `${photo.imgix_url}?w=1920&h=1080&fit=max&auto=format,compress`;
```

## Cosmic CMS Integration

This application uses Cosmic as a headless CMS for:

- **Media Storage**: All uploaded photos are stored in your Cosmic bucket's media library
- **Automatic Optimization**: Images are automatically optimized and served via imgix
- **Secure Access**: Environment variables protect your bucket and access code
- **Fast Delivery**: Global CDN ensures fast image loading worldwide

The app leverages Cosmic's media management capabilities to provide a seamless photo upload and viewing experience without the need for complex server infrastructure.

## Deployment Options

### Deploy to Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in your Vercel project settings:
   - `COSMIC_BUCKET_SLUG`
   - `COSMIC_READ_KEY`
   - `COSMIC_WRITE_KEY`
   - `ACCESS_CODE`
3. **Deploy** - Your app will be live at your Vercel URL

### Deploy to Netlify

1. **Connect your repository** to Netlify
2. **Add environment variables** in your Netlify site settings
3. **Build command**: `bun run build`
4. **Publish directory**: `.next`

### Other Platforms

This Next.js application can be deployed to any platform that supports Node.js applications. Make sure to set the required environment variables in your hosting platform's configuration.

<!-- README_END -->