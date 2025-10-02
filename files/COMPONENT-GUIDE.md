# Component Reference Guide

Quick reference for all components in the Marviotone website.

## 📂 Directory Structure

```
components/
├── ui/                          # Base UI components
│   ├── button.tsx              # Reusable button component
│   ├── card.tsx                # Card container component
│   └── badge.tsx               # Badge/label component
│
├── sections/                    # Page section components
│   ├── hero-section.tsx        # Main hero/landing section
│   ├── trust-banner.tsx        # Certification badges banner
│   ├── courses-section.tsx     # Course catalog grid
│   ├── why-choose-section.tsx  # Features/benefits section
│   ├── training-modes-section.tsx  # Learning formats section
│   ├── testimonials-section.tsx    # Student reviews section
│   ├── faq-section.tsx         # FAQ accordion section
│   └── cta-section.tsx         # Call-to-action section
│
├── navigation.tsx               # Header/navbar component
└── footer.tsx                   # Footer component
```

## 🎨 UI Components

### Button (`components/ui/button.tsx`)
**Purpose**: Reusable button with multiple variants and sizes

**Variants:**
- `default` - Slate background (primary)
- `primary` - Amber background (accent)
- `outline` - Border only
- `ghost` - Transparent background
- `link` - Text link style

**Sizes:**
- `sm` - Small (h-10)
- `default` - Medium (h-12)
- `lg` - Large (h-14)
- `xl` - Extra large (h-16)

**Rounded:**
- `default` - Rounded corners
- `full` - Fully rounded (pill shape)
- `none` - Square corners

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

// Primary button
<Button variant="primary" size="lg" rounded="full">
  Get Started
</Button>

// Outline button
<Button variant="outline" size="default">
  Learn More
</Button>
```

---

### Card (`components/ui/card.tsx`)
**Purpose**: Flexible container for content with header, body, and footer

**Sub-components:**
- `Card` - Main container
- `CardHeader` - Top section
- `CardTitle` - Header title
- `CardDescription` - Header description
- `CardContent` - Main content area
- `CardFooter` - Bottom section

**Usage:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Course Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

---

### Badge (`components/ui/badge.tsx`)
**Purpose**: Small label for tags, status, or categories

**Variants:**
- `default` - Dark background
- `outline` - Border only
- `secondary` - Light background

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="outline">Beginner</Badge>
<Badge>New</Badge>
```

---

## 📄 Section Components

### HeroSection (`components/sections/hero-section.tsx`)
**Purpose**: Main landing section with CTA and stats

**Features:**
- Large heading with gradient text
- Descriptive paragraph
- Two CTA buttons
- Stats counter (Alumni, Instruments, Tutors)
- Hero image with floating cards
- Responsive grid layout

**Key Elements:**
- Badge: "Nigeria's Premier Music Academy"
- H1: Main headline
- CTAs: "Get Started" and "View Courses"
- Stats: 3.2K+ Alumni, 20+ Instruments, 50+ Tutors
- Image: Professional violinist
- Floating cards: Rating (4.9/5), Active Students (1K+)

---

### TrustBanner (`components/sections/trust-banner.tsx`)
**Purpose**: Display certifications and credibility

**Features:**
- Certification badges
- Social proof
- Horizontal layout

**Key Elements:**
- "Trusted by leading institutions" text
- Badges: Certified, Accredited, Award Winner 2024

---

### CoursesSection (`components/sections/courses-section.tsx`)
**Purpose**: Display available courses with details

**Features:**
- Course grid (1/2/4 columns responsive)
- Image with overlays
- Seat availability indicator
- Progress bars
- Enroll buttons
- "View All Courses" CTA

**Data Structure:**
```tsx
{
  name: "Guitar",
  icon: Guitar,
  levels: ["Beginner", "Intermediate"],
  price: "₦25,000",
  seats: 8,
  total: 20,
  image: "url"
}
```

**Customization:**
Edit the `instruments` array to change courses

---

### WhyChooseSection (`components/sections/why-choose-section.tsx`)
**Purpose**: Highlight key benefits and features

**Features:**
- Icon-based grid layout
- 6 feature cards (3 columns on desktop)
- Hover effects on icons
- Responsive design

**Features Included:**
1. Experienced Tutors
2. Structured Curriculum
3. Marketing Growth
4. Flexible Schedule
5. A Blend of Plans
6. Positive-driven Teaching

**Customization:**
Edit the `features` array to change benefits

---

### TrainingModesSection (`components/sections/training-modes-section.tsx`)
**Purpose**: Show different learning formats

**Features:**
- 3 training mode cards
- Image headers with overlays
- Feature lists with checkmarks
- "Learn More" buttons
- Embedded CTA banner

**Modes:**
1. One-on-One (personalized)
2. Online Classes (virtual)
3. Home Training (at location)

**Customization:**
Edit the `trainingModes` array

---

### TestimonialsSection (`components/sections/testimonials-section.tsx`)
**Purpose**: Display student reviews and ratings

**Features:**
- 3-column grid (responsive)
- Star ratings
- Student photos
- Quoted testimonials
- Author info (name, role)

**Data Structure:**
```tsx
{
  content: "Testimonial text",
  author: "Student Name",
  role: "Piano Student",
  rating: 5,
  avatar: "url"
}
```

**Customization:**
Edit the `testimonials` array

---

### FAQSection (`components/sections/faq-section.tsx`)
**Purpose**: Answer common questions

**Features:**
- Collapsible accordion
- Smooth animations
- Chevron indicators
- "View All FAQs" button

**Data Structure:**
```tsx
{
  question: "Question text?",
  answer: "Answer text"
}
```

**Customization:**
Edit the `faqs` array to add/remove questions

---

### CTASection (`components/sections/cta-section.tsx`)
**Purpose**: Final call-to-action before footer

**Features:**
- Dark gradient background
- Large heading
- Descriptive text
- Two CTA buttons
- Pattern overlay

**Key Elements:**
- H2: "Ready to Start Your Musical Journey?"
- CTAs: "Book Free Trial", "View All Courses"

---

## 🧭 Layout Components

### Navigation (`components/navigation.tsx`)
**Purpose**: Main header with navigation links

**Features:**
- Fixed/sticky positioning
- Desktop horizontal menu
- Mobile hamburger menu
- Logo/brand name
- Sign In / Get Started buttons
- Backdrop blur effect

**Customization:**
```tsx
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  // Add more links here
]
```

---

### Footer (`components/footer.tsx`)
**Purpose**: Site footer with links and information

**Features:**
- 4-column grid (responsive)
- Brand section with social icons
- Quick links
- Course links
- Contact information
- Bottom copyright bar

**Sections:**
1. Brand + Social Media
2. Quick Links (About, Tutors, etc.)
3. Courses (Guitar, Piano, etc.)
4. Contact (Phone, Email, Address)

**Customization:**
Edit the `quickLinks`, `courses`, and `socialLinks` arrays

---

## 🎯 How to Use Components

### Adding a New Section
1. Create new file in `components/sections/`
2. Export the component
3. Import in `app/page.tsx`
4. Add to page layout

Example:
```tsx
// components/sections/new-section.tsx
export function NewSection() {
  return <section>...</section>
}

// app/page.tsx
import { NewSection } from "@/components/sections/new-section"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <NewSection /> {/* Add here */}
      <CoursesSection />
    </>
  )
}
```

### Modifying Existing Content
1. Find the section component
2. Locate the data array or content
3. Edit directly in the component file
4. Save and see changes in browser

### Reordering Sections
Simply reorder the imports in `app/page.tsx`:
```tsx
<HeroSection />
<CoursesSection />    // Move this up
<WhyChooseSection />  // Move this down
```

---

## 🎨 Styling Patterns

### Common Classes Used
- `container mx-auto px-4 sm:px-6 lg:px-8` - Content container
- `py-20 lg:py-32` - Section padding
- `text-slate-900` - Primary text color
- `text-amber-500` - Accent color
- `hover:scale-105` - Hover scale effect
- `transition-all duration-300` - Smooth transitions
- `rounded-2xl` / `rounded-3xl` - Rounded corners
- `shadow-lg` / `shadow-xl` - Shadows

### Gradient Backgrounds
```tsx
bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
```

### Pattern Overlays
```tsx
<div className="absolute inset-0 bg-hero-pattern bg-pattern opacity-5"></div>
```

---

## 📱 Responsive Breakpoints

- `sm:` - 640px (small tablets)
- `md:` - 768px (tablets)
- `lg:` - 1024px (laptops)
- `xl:` - 1280px (desktops)
- `2xl:` - 1536px (large screens)

**Mobile-first approach**: Base styles apply to mobile, use breakpoints to enhance for larger screens.

---

## 🔗 Icon Library

Using **Lucide React** for all icons.

Common icons used:
- `Guitar`, `Piano`, `Drum`, `Mic` - Instruments
- `Users`, `Video`, `Home` - Training modes
- `Award`, `BookOpen`, `Star` - Features
- `CheckCircle` - Lists
- `ChevronDown` - Accordions
- `ArrowRight` - CTAs
- `Menu`, `X` - Mobile menu

Usage:
```tsx
import { Guitar, Star } from "lucide-react"

<Guitar className="w-6 h-6" />
```

---

**This reference guide helps you quickly find and modify any component! 🚀**
