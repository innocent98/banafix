"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  BookOpen,
  Calendar,
  DollarSign,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  Menu,
  X,
  GraduationCap
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sidebarSections = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      href: "/admin/dashboard",
      description: "Platform metrics and insights"
    },
    {
      id: "courses",
      label: "Courses",
      icon: BookOpen,
      href: "/admin/courses",
      description: "Manage course catalog"
    },
    {
      id: "enrollments",
      label: "Enrollments",
      icon: GraduationCap,
      href: "/admin/enrollments",
      description: "Student enrollments & payments"
    },
    // {
    //   id: "students",
    //   label: "Students",
    //   icon: Calendar,
    //   href: "/admin/students",
    //   description: "Manage student records"
    // },
    // {
    //   id: "payments",
    //   label: "Payments",
    //   icon: DollarSign,
    //   href: "/admin/payments",
    //   description: "Financial transactions"
    // },
    // {
    //   id: "testimonials",
    //   label: "Testimonials",
    //   icon: MessageSquare,
    //   href: "/admin/testimonials",
    //   description: "Student feedback"
    // },
    // {
    //   id: "faqs",
    //   label: "FAQs",
    //   icon: HelpCircle,
    //   href: "/admin/faqs",
    //   description: "Knowledge base"
    // },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/admin/settings",
      description: "Platform configuration"
    },
  ]

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    const token = localStorage.getItem("admin_token")
    const adminData = localStorage.getItem("admin_user")

    if (!token || !adminData) {
      router.push("/admin/login")
      return
    }

    try {
      // Optimistic update to show UI immediately
      setAdmin(JSON.parse(adminData))

      // Verify token validity with server
      const response = await fetch("/api/admin/verify-session", {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error("Session expired or invalid")
      }
    } catch (error) {
      console.error("Auth error:", error)
      localStorage.removeItem("admin_token")
      localStorage.removeItem("admin_user")
      router.push("/admin/login")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    router.push("/admin/login")
  }

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard"
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">BanaFix Platform</p>
          </div>
        </div>
      </div>

      {/* Admin User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={admin?.email ? `https://api.dicebear.com/7.x/initials/svg?seed=${admin.name}` : undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {admin?.name?.split(' ').map(n => n[0]).join('') || "AD"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{admin?.name || "Admin User"}</p>
            <p className="text-xs text-muted-foreground truncate">{admin?.email || "admin@banafix.com"}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {admin?.role || "Admin"}
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarSections.map((section) => {
          const Icon = section.icon
          const active = isActive(section.href)

          return (
            <Link key={section.id} href={section.href}>
              <div className={`group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}>
                <Icon className={`h-5 w-5 transition-colors ${
                  active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${active ? "text-primary-foreground" : ""}`}>
                    {section.label}
                  </p>
                  <p className={`text-xs ${
                    active ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border mt-auto">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Sign Out</span>
        </Button>

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  )

  if (!admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-72 bg-card border-r border-border min-h-screen">
          <SidebarContent />
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border">
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Top Bar */}
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-30">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                  </Button>

                  <div className="h-6 w-px bg-border" />

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Welcome back,</span>
                    <span className="font-medium">{admin?.name?.split(' ')[0] || "Admin"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}