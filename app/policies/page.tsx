"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Shield, CreditCard, Users, Gavel } from "lucide-react"

export default function PoliciesPage() {
  const [activeSection, setActiveSection] = useState("privacy")

  const sections = [
    { id: "privacy", title: "Privacy Policy", icon: Shield },
    { id: "terms", title: "Terms & Conditions", icon: FileText },
    { id: "refunds", title: "Refund Policy", icon: CreditCard },
    { id: "conduct", title: "Code of Conduct", icon: Users },
    { id: "legal", title: "Legal Information", icon: Gavel },
  ]

  const policies = {
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "December 15, 2024",
      content: [
        {
          heading: "Information We Collect",
          text: "We collect information you provide directly to us, such as when you create an account, enroll in courses, or contact us for support. This includes your name, email address, phone number, payment information, and learning preferences.",
        },
        {
          heading: "How We Use Your Information",
          text: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about courses, instructors, and promotional offers.",
        },
        {
          heading: "Information Sharing",
          text: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with instructors for course delivery and with service providers who assist us in operating our platform.",
        },
        {
          heading: "Data Security",
          text: "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.",
        },
      ],
    },
    terms: {
      title: "Terms & Conditions",
      lastUpdated: "December 15, 2024",
      content: [
        {
          heading: "Acceptance of Terms",
          text: "By accessing and using Banafix services, you accept and agree to be bound by the terms and provision of this agreement. These terms apply to all users of the platform, including students, instructors, and visitors.",
        },
        {
          heading: "Course Enrollment",
          text: "Course enrollment is subject to availability and instructor approval. Payment must be completed before course access is granted. Course materials and content are for personal use only and may not be shared or redistributed.",
        },
        {
          heading: "User Responsibilities",
          text: "Users are responsible for maintaining the confidentiality of their account information, attending scheduled sessions, and following our community guidelines. Inappropriate behavior may result in account suspension or termination.",
        },
        {
          heading: "Intellectual Property",
          text: "All course content, materials, and platform features are the intellectual property of Banafix or our instructors. Users may not reproduce, distribute, or create derivative works without explicit permission.",
        },
      ],
    },
    refunds: {
      title: "Refund Policy",
      lastUpdated: "December 15, 2024",
      content: [
        {
          heading: "14-Day Money-Back Guarantee",
          text: "We offer a full refund within 14 days of course enrollment if you are not completely satisfied. To be eligible, you must have attended fewer than 25% of scheduled sessions and request the refund through your student dashboard or by contacting support.",
        },
        {
          heading: "Partial Refunds",
          text: "After the 14-day period, partial refunds may be available for unused sessions due to exceptional circumstances such as medical emergencies or relocation. Each case is reviewed individually by our support team.",
        },
        {
          heading: "Processing Time",
          text: "Approved refunds are processed within 5-7 business days. Refunds are issued to the original payment method used for enrollment. Bank transfer refunds may take additional time depending on your financial institution.",
        },
        {
          heading: "Non-Refundable Items",
          text: "Course materials, digital downloads, and completed sessions are non-refundable. Promotional discounts and gift certificates cannot be refunded for cash value.",
        },
      ],
    },
    conduct: {
      title: "Code of Conduct",
      lastUpdated: "December 15, 2024",
      content: [
        {
          heading: "Respectful Communication",
          text: "All interactions between students, instructors, and staff must be respectful and professional. Harassment, discrimination, or inappropriate behavior of any kind will not be tolerated and may result in immediate account termination.",
        },
        {
          heading: "Session Etiquette",
          text: "Students are expected to arrive on time for sessions, come prepared with necessary materials, and maintain a distraction-free learning environment. For online sessions, ensure stable internet connection and appropriate lighting.",
        },
        {
          heading: "Academic Integrity",
          text: "Students must complete assignments and assessments honestly and independently unless collaboration is explicitly permitted. Plagiarism or cheating will result in course failure and potential account suspension.",
        },
        {
          heading: "Platform Usage",
          text: "Users must not attempt to hack, disrupt, or misuse the platform in any way. Sharing account credentials or accessing unauthorized areas is strictly prohibited and may result in legal action.",
        },
      ],
    },
    legal: {
      title: "Legal Information",
      lastUpdated: "December 15, 2024",
      content: [
        {
          heading: "Governing Law",
          text: "These terms and conditions are governed by and construed in accordance with the laws of Nigeria. Any disputes arising from the use of our services will be subject to the exclusive jurisdiction of Nigerian courts.",
        },
        {
          heading: "Limitation of Liability",
          text: "Banafix shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services. Our total liability shall not exceed the amount paid for the specific course or service in question.",
        },
        {
          heading: "Force Majeure",
          text: "We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, government actions, or technical failures.",
        },
        {
          heading: "Modifications",
          text: "We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notifications. Continued use of our services after modifications constitutes acceptance of the updated terms.",
        },
      ],
    },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Policies & Terms</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Important legal information and policies governing your use of Banafix services
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* TOC Sidebar */}
          <div className="lg:w-1/4">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Table of Contents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveSection(section.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {section.title}
                    </Button>
                  )
                })}

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full bg-transparent" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download All PDFs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-sora">
                    {policies[activeSection as keyof typeof policies].title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    Last updated: {policies[activeSection as keyof typeof policies].lastUpdated}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardHeader>
              <CardContent className="space-y-8">
                {policies[activeSection as keyof typeof policies].content.map((section, index) => (
                  <div key={index}>
                    <h3 className="text-xl font-semibold mb-4 text-primary">{section.heading}</h3>
                    <p className="text-muted-foreground leading-relaxed">{section.text}</p>
                  </div>
                ))}

                <div className="mt-12 p-6 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Questions about our policies?</h4>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about these policies or need clarification, please don't hesitate to
                    contact our legal team.
                  </p>
                  <Button>Contact Legal Team</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
