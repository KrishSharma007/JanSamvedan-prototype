"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeafletMap } from "@/components/leaflet-map";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Upload, Mic, Send, CheckCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function ReportIssuePage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureLocation = () => {
    setIsCapturingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setIsCapturingLocation(false);
          setShowMap(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation("Location access denied");
          setIsCapturingLocation(false);
        }
      );
    } else {
      setLocation("Geolocation not supported");
      setIsCapturingLocation(false);
    }
  };

  const openMapSelector = () => {
    setShowMap(true);
    setError(""); // Clear any previous errors
    
    // Set default location (Delhi) if no location is set
    if (!latitude || !longitude) {
      const defaultLat = 28.6139;
      const defaultLng = 77.209;
      setLatitude(defaultLat);
      setLongitude(defaultLng);
      setLocation(`${defaultLat.toFixed(6)}, ${defaultLng.toFixed(6)}`);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate location
    if (!latitude || !longitude) {
      setError("Please select a location on the map");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return router.replace("/login");

      // Upload image if present
      let imageUrl: string | undefined = undefined;
      if (selectedImage) {
        const up = await fetch(`${API_BASE}/uploads/image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataUrl: selectedImage,
            folder: "civicconnect/reports",
            category: category || "other",
          }),
        });
        if (!up.ok) {
          const ud = await up.json().catch(() => ({} as any));
          throw new Error(ud.error || "Image upload failed");
        }
        const upRes = await up.json();
        imageUrl = upRes.url as string;
      }

      // Use the latitude and longitude state variables
      const lat = latitude;
      const lng = longitude;

      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title || "Civic Issue",
          description,
          category: category || "other",
          priority: priority || "low",
          latitude: lat,
          longitude: lng,
          address: location,
          imageUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data.error || "Failed to submit report");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Issue Reported Successfully!
            </CardTitle>
            <CardDescription>Your report has been submitted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You will receive updates on your registered email/phone. Track
              your report status in "My Reports" section.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="flex-1"
              >
                Report Another
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push("/my-reports")}
              >
                View My Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Report a Civic Issue
          </h1>
          <p className="text-muted-foreground">
            Help make your community better by reporting issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us resolve the
              issue quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Short title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="photo">Upload Photo</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {selectedImage ? (
                    <div className="space-y-4">
                      <img
                        src={selectedImage || "/placeholder.svg"}
                        alt="Selected"
                        className="mx-auto max-h-48 rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedImage(null)}
                        size="sm"
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="photo-upload"
                          className="cursor-pointer"
                        >
                          <Button type="button" variant="outline" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Choose Photo
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Take a clear photo of the issue (JPG, PNG up to 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder={
                        error
                          ? "Enter coordinates manually"
                          : "Click on map to select location"
                      }
                      value={location}
                      readOnly={!error}
                      onChange={
                        error
                          ? (e) => {
                              const value = e.target.value;
                              setLocation(value);
                              // Try to parse coordinates from input
                              const coords = value
                                .split(",")
                                .map((s) => s.trim());
                              if (coords.length === 2) {
                                const lat = parseFloat(coords[0]);
                                const lng = parseFloat(coords[1]);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                  setLatitude(lat);
                                  setLongitude(lng);
                                }
                              }
                            }
                          : undefined
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={captureLocation}
                      disabled={isCapturingLocation}
                    >
                      <MapPin className="h-4 w-4" />
                      {isCapturingLocation ? "Getting..." : "Current"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openMapSelector}
                    >
                      <MapPin className="h-4 w-4" />
                      Select on Map
                    </Button>
                  </div>

                  {showMap && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/50 border-b">
                        <p className="text-sm text-muted-foreground">
                          Click anywhere on the map to set the issue location
                        </p>
                      </div>
                      <div className="relative">
                        <LeafletMap
                          latitude={latitude || 28.6139}
                          longitude={longitude || 77.209}
                          onLocationSelect={handleLocationSelect}
                          height="256px"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Issue Category</Label>
                <Select required onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pothole">Pothole</SelectItem>
                    <SelectItem value="garbage">Garbage Collection</SelectItem>
                    <SelectItem value="streetlight">Street Light</SelectItem>
                    <SelectItem value="water">Water Supply</SelectItem>
                    <SelectItem value="drainage">Drainage</SelectItem>
                    <SelectItem value="traffic">Traffic Signal</SelectItem>
                    <SelectItem value="park">Park Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select required onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Low - Minor inconvenience
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Medium - Moderate impact
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        High - Safety concern
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" placeholder="Full name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Send className="mr-2 h-4 w-4" />
                Submit Report
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
