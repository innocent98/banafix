# Marviotone - Modern Music Academy Website

A refined, modern, and sleek music academy website built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

✨ **Modern Design**
- Clean, professional interface with smooth animations
- Responsive layout for all device sizes
- Custom Tailwind configuration with amber/slate color scheme
- Beautiful gradient overlays and glassmorphism effects

🎯 **Key Sections**
- Hero section with compelling CTA
- Trust banner with certifications
- Course catalog with availability indicators
- Why choose us section
- Training modes (One-on-One, Online, Home Training)
- Student testimonials
- FAQ accordion
- Call-to-action sections
- Professional footer

🔧 **Technical Features**
- Component-based architecture
- TypeScript for type safety
- Optimized images with Next.js Image component
- Smooth animations and transitions
- Mobile-first responsive design
- SEO optimized

## Project Structure

```
marviotone-website/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main homepage
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── sections/           # Page sections
│   │   ├── hero-section.tsx
│   │   ├── trust-banner.tsx
│   │   ├── courses-section.tsx
│   │   ├── why-choose-section.tsx
│   │   ├── training-modes-section.tsx
│   │   ├── testimonials-section.tsx
│   │   ├── faq-section.tsx
│   │   └── cta-section.tsx
│   ├── navigation.tsx      # Header navigation
│   └── footer.tsx          # Footer component
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies

```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Customization Guide

### Colors
Edit `tailwind.config.ts` to change the color scheme:
```typescript
colors: {
  amber: { ... },  // Primary accent color
  slate: { ... },  // Base colors
}
```

### Content
All content is located in the section components:
- `components/sections/courses-section.tsx` - Course offerings
- `components/sections/testimonials-section.tsx` - Student reviews
- `components/sections/faq-section.tsx` - FAQ items

### Navigation Links
Update links in `components/navigation.tsx`:
```typescript
const navLinks = [
  { href: "/", label: "Home" },
  // Add more links here
]
```

### Images
Replace Unsplash URLs with your own images in each section component.

## Components Overview

### UI Components
- **Button**: Variant-based button with multiple sizes and styles
- **Card**: Flexible card container with header, content, and footer
- **Badge**: Small label component for tags and indicators

### Section Components
- **HeroSection**: Landing section with CTA and stats
- **TrustBanner**: Certification and credibility badges
- **CoursesSection**: Course catalog with enrollment info
- **WhyChooseSection**: Feature highlights grid
- **TrainingModesSection**: Different learning formats
- **TestimonialsSection**: Student reviews and ratings
- **FAQSection**: Collapsible FAQ accordion
- **CTASection**: Final call-to-action

## Key Improvements Made

1. **Better Component Organization**: Separated into logical, reusable components
2. **Enhanced Styling**: Modern gradients, shadows, and animations
3. **Improved Navigation**: Sticky header with mobile menu
4. **Better Typography**: Custom font variables with Sora and Inter
5. **Refined Buttons**: Consistent button system with variants
6. **Smooth Interactions**: Hover effects and transitions throughout
7. **Better Accessibility**: Semantic HTML and ARIA labels
8. **Performance**: Optimized images and component loading

## Button Click Functionality

All buttons are ready for functionality. To add actions:

```typescript
// Example: Add onClick handler
<Button onClick={() => handleEnroll(courseId)}>
  Enroll
</Button>

// Example: Link to page
<Link href="/courses">
  <Button>View Courses</Button>
</Link>
```

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Other Platforms
Build the project and deploy the `.next` folder:
```bash
npm run build
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is provided as-is for your use.

## Support

For questions or issues, please refer to the Next.js documentation:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
