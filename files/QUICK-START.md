# Quick Start Guide - Marviotone Website

## 🚀 Instant Setup

1. **Install Dependencies**
   ```bash
   cd marviotone-website
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## 📁 File Structure Summary

```
marviotone-website/
├── app/
│   ├── layout.tsx          → Root layout
│   ├── page.tsx            → Main homepage (imports all sections)
│   └── globals.css         → Global Tailwind styles
│
├── components/
│   ├── ui/                 → Base UI components
│   │   ├── button.tsx      → Button with variants
│   │   ├── card.tsx        → Card component
│   │   └── badge.tsx       → Badge component
│   │
│   ├── sections/           → Page sections (modular)
│   │   ├── hero-section.tsx
│   │   ├── trust-banner.tsx
│   │   ├── courses-section.tsx
│   │   ├── why-choose-section.tsx
│   │   ├── training-modes-section.tsx
│   │   ├── testimonials-section.tsx
│   │   ├── faq-section.tsx
│   │   └── cta-section.tsx
│   │
│   ├── navigation.tsx      → Header with mobile menu
│   └── footer.tsx          → Footer with links
│
└── Config Files
    ├── tailwind.config.ts  → Custom theme (amber/slate colors)
    ├── next.config.js      → Next.js config
    └── tsconfig.json       → TypeScript config
```

## 🎨 Key Features Implemented

### ✅ Fully Functional Navigation
- Sticky header on scroll
- Mobile hamburger menu
- Smooth transitions
- All links ready for routing

### ✅ Modern Hero Section
- Gradient backgrounds
- Animated stats
- Floating cards
- Responsive images
- Two prominent CTAs

### ✅ Course Cards
- Image overlays
- Seat availability indicator
- Progress bars
- Hover animations
- Enroll buttons ready

### ✅ Training Modes
- Three distinct cards
- Feature lists with checkmarks
- Learn More buttons
- Embedded CTA banner

### ✅ Testimonials
- Star ratings
- Profile images
- Responsive grid
- Smooth hover effects

### ✅ FAQ Section
- Collapsible accordion
- Smooth animations
- View All button

### ✅ Footer
- Social media links
- Quick links sections
- Contact information
- Bottom copyright bar

## 🔧 Common Customizations

### Change Brand Name
Search and replace "Marviotone" with your brand name across all files.

### Update Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  amber: { ... },  // Primary color
  slate: { ... },  // Base color
}
```

### Add Navigation Links
Edit `components/navigation.tsx`:
```typescript
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  // Add more here
]
```

### Update Course Data
Edit `components/sections/courses-section.tsx`:
```typescript
const instruments = [
  {
    name: "Guitar",
    price: "₦25,000",
    seats: 8,
    total: 20,
    // ...
  },
]
```

### Change Images
Replace Unsplash URLs in each section component with your own image URLs.

## 🎯 Making Buttons Functional

### Example 1: Enroll Button
```typescript
<Button onClick={() => handleEnroll(courseId)}>
  Enroll
</Button>
```

### Example 2: Navigation
```typescript
import Link from 'next/link'

<Link href="/courses">
  <Button>View Courses</Button>
</Link>
```

### Example 3: Form Submission
```typescript
<Button onClick={handleSubmit}>
  Book Free Trial
</Button>
```

## 🌐 Deployment Options

### Vercel (Easiest)
```bash
npm install -g vercel
vercel
```

### Netlify
1. Connect your Git repository
2. Build command: `npm run build`
3. Publish directory: `.next`

### Traditional Hosting
```bash
npm run build
npm start
```

## ⚡ Performance Tips

1. **Images**: Already optimized with Next.js Image component
2. **Code Splitting**: Automatic with Next.js
3. **Fonts**: Using next/font for optimization
4. **CSS**: Tailwind purges unused styles in production

## 🐛 Troubleshooting

### Images Not Loading
Make sure `next.config.js` has the correct image domains:
```javascript
images: {
  domains: ['images.unsplash.com', 'your-domain.com'],
}
```

### Styles Not Applying
1. Check Tailwind is installed: `npm install -D tailwindcss`
2. Verify `globals.css` is imported in `layout.tsx`

### TypeScript Errors
Run: `npm install --save-dev @types/react @types/node`

## 📦 Dependencies

Main packages used:
- **next**: ^14.0.4 - React framework
- **react**: ^18.2.0 - UI library
- **tailwindcss**: ^3.4.0 - Utility-first CSS
- **lucide-react**: ^0.294.0 - Icon library
- **typescript**: ^5.3.3 - Type safety

## 🎓 Next Steps

1. ✅ Install and run the project
2. ✅ Customize content (text, images, prices)
3. ✅ Update branding (logo, colors, fonts)
4. ✅ Add real functionality to buttons
5. ✅ Create additional pages (About, Contact, etc.)
6. ✅ Set up backend/CMS if needed
7. ✅ Test on mobile devices
8. ✅ Deploy to production

## 💡 Tips

- All components are in `components/` - easy to find and edit
- Use the Button component variants for consistent styling
- The Tailwind config has custom animations ready to use
- Mobile-first approach - test mobile view first
- All sections are independent - easy to reorder or remove

## 📞 Need Help?

- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs
- TypeScript Docs: https://www.typescriptlang.org/docs

---

**Your website is ready to go! Just install dependencies and run `npm run dev`** 🎉
