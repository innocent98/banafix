"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, ExternalLink, Compass, Car, Bus, Clock } from "lucide-react"

export function LocationDetails() {
  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl shadow-lg">
            <MapPin className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-slate-900">
            Visit Our Campus
          </h2>
        </div>
        <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
          Experience our state-of-the-art facilities, meet our instructors, and feel the creative energy that makes Banafix special.
        </p>
      </div>

      {/* Main Location Card */}
      <Card className="border-0 shadow-2xl rounded-3xl bg-white overflow-hidden group hover:shadow-3xl transition-all duration-500">
        <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 text-center">
          <CardTitle className="text-2xl lg:text-3xl font-heading font-bold text-slate-900">
            Banafix Music Academy
          </CardTitle>
          <p className="text-slate-600 text-lg">Your musical journey starts here</p>
        </CardHeader>

        <CardContent className="p-12 space-y-10">
          {/* Address & Contact Grid */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Address Information */}
            <div className="space-y-6">
              <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-500 rounded-2xl">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-slate-900">Campus Address</h3>
                </div>

                <div className="space-y-3 text-slate-700">
                  <p className="text-lg font-semibold">32, Road 8 Greenland Estate</p>
                  <p className="text-lg">Olokonla Bus Stop, Eti-Osa</p>
                  <p className="text-lg">Lekki, Lagos</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                    Prime Location
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                    Easy Access
                  </Badge>
                </div>
              </div>
            </div>

            {/* Transportation Options */}
            <div className="space-y-6">
              <h3 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Bus className="w-5 h-5 text-green-600" />
                </div>
                How to Get Here
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl border border-green-200">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <Bus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Public Transport</h4>
                    <p className="text-sm text-green-800">Short walk from Olokonla Bus Stop</p>
                    <p className="text-sm text-green-800">Along the Lekki-Epe Expressway corridor</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Private Vehicle</h4>
                    <p className="text-sm text-blue-800">Free secure parking available</p>
                    <p className="text-sm text-blue-800">Uber/Bolt pickup point at main entrance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Map Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-heading font-bold text-slate-900 mb-3">Explore Our Campus</h3>
              <p className="text-slate-600">Get a virtual tour before your visit</p>
            </div>

            <div className="relative group">
              <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-blue-400 transition-all duration-300 cursor-pointer">
                <div className="text-center group-hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-3xl transition-shadow duration-300">
                    <Compass className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="text-2xl font-heading font-bold text-slate-900 mb-4">Interactive Campus Map</h4>
                  <p className="text-slate-600 mb-6 text-lg max-w-md mx-auto">
                    Take a virtual tour of our facilities including studios, practice rooms, and performance halls
                  </p>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl font-semibold shadow-lg"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Explore Virtual Tour
                  </Button>
                </div>
              </div>

              {/* Animated overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Map Navigation Buttons */}
          <div className="grid md:grid-cols-3 gap-6">
            <Button
              size="lg"
              variant="outline"
              className="h-16 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-2xl font-semibold group transition-all duration-300"
            >
              <ExternalLink className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-bold">Google Maps</div>
                <div className="text-xs text-slate-500">Get directions</div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-16 border-2 border-green-200 hover:bg-green-50 hover:border-green-300 rounded-2xl font-semibold group transition-all duration-300"
            >
              <Navigation className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-bold">Apple Maps</div>
                <div className="text-xs text-slate-500">iOS navigation</div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-16 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 rounded-2xl font-semibold group transition-all duration-300"
            >
              <Clock className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-bold">Book Visit</div>
                <div className="text-xs text-slate-500">Schedule tour</div>
              </div>
            </Button>
          </div>

          {/* Campus Hours */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-8 rounded-3xl">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="text-xl font-heading font-bold text-amber-900">Campus Hours</h4>
              </div>
              <p className="text-amber-800">Visit us during these hours for tours and enrollment</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/70 rounded-2xl border border-amber-200">
                <div className="font-bold text-amber-900 mb-1">Monday - Friday</div>
                <div className="text-amber-800">8:00 AM - 8:00 PM</div>
              </div>
              <div className="text-center p-4 bg-white/70 rounded-2xl border border-amber-200">
                <div className="font-bold text-amber-900 mb-1">Saturday</div>
                <div className="text-amber-800">9:00 AM - 6:00 PM</div>
              </div>
              <div className="text-center p-4 bg-white/70 rounded-2xl border border-amber-200">
                <div className="font-bold text-amber-900 mb-1">Sunday</div>
                <div className="text-amber-800">12:00 PM - 5:00 PM</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}