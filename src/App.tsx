/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Wifi, 
  Wind, 
  Coffee, 
  ShieldCheck, 
  Car, 
  ChevronRight, 
  Play,
  X,
  Menu,
  Send,
  Loader2,
  CheckCircle2,
  Armchair,
  Fan,
  Lightbulb,
  Lock,
  Calendar,
  Users,
  Heart,
  Home,
  MapPinned,
  ShieldAlert,
  DollarSign
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { db, auth } from './lib/firebase';
import { collection, addDoc, Timestamp, doc, onSnapshot } from 'firebase/firestore';
import AdminPanel from './AdminPanel';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- CONFIGURATION ---
// Replace this with your actual Supabase Storage Public URL
// Format: https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET_NAME]
const STORAGE_BASE_URL = "https://eulxcwxefaaamjsfblqx.supabase.co/storage/v1/object/public/flat-assets";

const AMENITIES = [
  { icon: <Wifi className="w-5 h-5" />, label: "High-speed Wi-Fi" },
  { icon: <Wind className="w-5 h-5" />, label: "Air Conditioning" },
  { icon: <Coffee className="w-5 h-5" />, label: "Equipped Kitchen" },
  { icon: <Armchair className="w-5 h-5" />, label: "Full Furniture" },
  { icon: <ShieldCheck className="w-5 h-5" />, label: "24/7 Security" },
  { icon: <Fan className="w-5 h-5" />, label: "Ceiling Fan" },
  { icon: <Lightbulb className="w-5 h-5" />, label: "Premium Light" },
  { icon: <Lock className="w-5 h-5" />, label: "Smart Door Lock" },
];

const HERO_IMAGES = Array.from({ length: 35 }, (_, i) => ({
  src: `${STORAGE_BASE_URL}/hero/${String(i + 1).padStart(2, '0')}.jpg`,
  fallback: `https://picsum.photos/seed/hero${i + 1}/1920/1080`,
  caption: `View of the apartment space ${i + 1}`
}));

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-brand-gray relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-brand-white/10 to-transparent" />
  </div>
);

const ImageWithSkeleton = ({ 
  src, 
  alt, 
  className, 
  fallback, 
  loading = "lazy",
  ...props 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
  fallback?: string;
  loading?: "lazy" | "eager";
  [key: string]: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {!isLoaded && <Skeleton className="absolute inset-0 z-10" />}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`${className} transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          if (fallback && e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
        {...props}
      />
    </div>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [landscapeImages, setLandscapeImages] = useState<typeof HERO_IMAGES>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form state
  const [formState, setFormState] = useState({ 
    name: '', 
    email: '', 
    dob: '', 
    residency: '', 
    maritalStatus: 'unmarried', 
    familyMembers: 1 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    let error = "";
    if (name === "name") {
      if (!value) error = "Full name is required";
      else if (value.length < 3) error = "Name must be at least 3 characters";
    }
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = "Email address is required";
      else if (!emailRegex.test(value)) error = "Please enter a valid email address";
    }
    if (name === "dob") {
      if (!value) error = "Date of birth is required";
      else {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        
        if (age < 18) error = "Must be at least 18 years old to apply";
        if (birthDate > today) error = "Date of birth cannot be in the future";
      }
    }
    if (name === "residency") {
      if (!value) error = "Residency information is required";
    }
    if (name === "familyMembers") {
      if (!value || value < 1) error = "At least 1 family member is required";
    }
    
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return error;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormState({ ...formState, [field]: value });
    validateField(field, value);
  };

  useEffect(() => {
    // Listen for rent updates
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setMonthlyRent(doc.data().monthlyRent);
      }
    });
    return unsub;
  }, []);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryIndex === null) return;
    setGalleryIndex((prev) => (prev !== null ? (prev + 1) % HERO_IMAGES.length : 0));
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryIndex === null) return;
    setGalleryIndex((prev) => (prev !== null ? (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (galleryIndex === null) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setGalleryIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryIndex]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const validateImages = async () => {
      const results = await Promise.all(
        HERO_IMAGES.map((img) => {
          return new Promise<typeof HERO_IMAGES[0] | null>((resolve) => {
            const image = new Image();
            image.src = img.src;
            image.onload = () => {
              // Only accept landscape or square images
              if (image.naturalWidth >= image.naturalHeight) {
                resolve(img);
              } else {
                resolve(null);
              }
            };
            image.onerror = () => {
              // If main image fails, check fallback
              const fallbackImage = new Image();
              fallbackImage.src = img.fallback;
              fallbackImage.onload = () => {
                if (fallbackImage.naturalWidth >= fallbackImage.naturalHeight) {
                  resolve(img);
                } else {
                  resolve(null);
                }
              };
              fallbackImage.onerror = () => resolve(null);
            };
          });
        })
      );
      const filtered = results.filter((img): img is typeof HERO_IMAGES[0] => img !== null);
      setLandscapeImages(filtered.length > 0 ? filtered : HERO_IMAGES.slice(0, 5)); // Fallback to first 5 if none pass
    };

    validateImages();
  }, []);

  useEffect(() => {
    if (landscapeImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % landscapeImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [landscapeImages.length]);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formState).forEach((key) => {
      const error = validateField(key, (formState as any)[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error("Please fix the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await addDoc(collection(db, 'applications'), {
        ...formState,
        status: 'pending',
        appliedAt: Timestamp.now(),
        rentAtTimeOfApplication: monthlyRent
      });

      setSubmitStatus('success');
      setFormState({ 
        name: '', 
        email: '', 
        dob: '', 
        residency: '', 
        maritalStatus: 'unmarried', 
        familyMembers: 1 
      });
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitStatus('error');
      toast.error("Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-white selection:bg-brand-black selection:text-brand-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-brand-white/80 backdrop-blur-md py-3 md:py-4 border-b border-brand-black/5 text-brand-black" : "bg-transparent py-5 md:py-8 text-brand-white"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-serif font-bold tracking-tight"
          >
            AZMEREE
            <span className="font-light italic ml-6">Ivory</span>
          </motion.div>
          
          <div className="hidden md:flex space-x-12 text-xs uppercase tracking-[0.2em] font-medium">
            {["Gallery", "Amenities", "Video", "Location", "Contact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:opacity-50 transition-opacity">
                {item === "Contact" ? "Apply for Rent" : item}
              </a>
            ))}
          </div>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className={scrolled ? "text-brand-black" : "text-brand-white"} /> : <Menu className={scrolled ? "text-brand-black" : "text-brand-white"} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-brand-white pt-24 px-6 md:hidden"
          >
            <div className="mb-12 border-b border-brand-black/5 pb-8">
              <div className="text-xl font-serif font-bold tracking-tight">
                AZMEREE<span className="font-light italic ml-6">Ivory</span>
              </div>
            </div>
            <div className="flex flex-col space-y-8 text-2xl font-serif">
              {["Gallery", "Amenities", "Video", "Location", "Contact"].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`} 
                  onClick={() => setIsMenuOpen(false)}
                  className="border-b border-brand-black/10 pb-4"
                >
                  {item === "Contact" ? "Apply for Rent" : item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative aspect-[4/3] md:aspect-auto md:h-screen flex items-center justify-center overflow-hidden bg-brand-black">
        <AnimatePresence mode="wait">
          {landscapeImages.length > 0 && (
            <motion.div 
              key={currentHeroIndex}
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <ImageWithSkeleton 
                src={landscapeImages[currentHeroIndex].src} 
                fallback={landscapeImages[currentHeroIndex].fallback}
                alt={`Hero Flat ${currentHeroIndex + 1}`} 
                className="w-full h-full object-cover select-none"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-brand-black/20 via-transparent to-brand-black/60" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 text-center text-brand-white px-6 max-w-4xl pt-20 md:pt-0">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1.5, ease: "easeOut" }}
            className="text-4xl md:text-[10rem] font-serif italic mb-12 md:mb-16 leading-[1.1] md:leading-[0.95] tracking-tighter"
          >
            Azmeree <br /> Ivory
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mb-10 md:mb-0"
          >
            <a 
              href="#gallery"
              className="inline-flex items-center space-x-3 border border-brand-white/30 px-8 py-3 rounded-full hover:bg-brand-white hover:text-brand-black transition-all duration-500 group backdrop-blur-sm"
            >
              <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">Discover the space</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>

        {/* Simplified Hero Progress Bar */}
        <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-32 md:right-32 z-20">
          <div className="h-[1px] w-full bg-brand-white/10 relative overflow-hidden">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-brand-white"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentHeroIndex + 1) / landscapeImages.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between mt-3 text-[9px] uppercase tracking-[0.2em] text-brand-white/40 font-mono">
            <span>01</span>
            <span className="text-brand-white/20">/</span>
            <span>{String(landscapeImages.length).padStart(2, '0')}</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-32 px-6 max-w-7xl mx-auto bg-brand-white">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-serif mb-8 leading-tight">
              A sanctuary of light <br className="hidden md:block" /> and sophisticated <br className="hidden md:block" /> <span className="italic">minimalism.</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-brand-black/60 leading-relaxed space-y-6"
          >
            {monthlyRent && (
              <div className="inline-flex items-center space-x-4 bg-brand-gray px-6 py-4 rounded-2xl mb-4 border border-brand-black/5">
                <div className="w-10 h-10 rounded-full bg-brand-white flex items-center justify-center shadow-sm">
                  <DollarSign className="w-5 h-5 text-brand-black/40" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-black/40">Available for Rent</p>
                  <p className="text-xl font-serif italic text-brand-black">{monthlyRent.toLocaleString()} BDT <span className="text-xs not-italic font-sans opacity-40">/ month</span></p>
                </div>
              </div>
            )}
            <p>
              Located in the prestigious Bashundhara Residential Area, Dhaka, this 6th-floor apartment offers a serene and secure living environment. Situated in Block-D on Abdur Sadeq Road (House 7p7q), it provides the perfect blend of luxury and convenience.
            </p>
            <p>
              The space features modern architecture with premium lighting and smart security systems. Whether you're relaxing under the designer ceiling fans or enjoying the fully furnished interiors, every corner reflects a commitment to quality.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 md:py-24 bg-brand-gray">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10 md:mb-16">
            <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Visual Tour</p>
            <h2 className="text-4xl font-serif italic">The Collection</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {HERO_IMAGES.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 8) * 0.05 }}
                className="relative aspect-[4/3] group cursor-pointer overflow-hidden rounded-xl bg-brand-gray"
                onClick={() => setGalleryIndex(idx)}
              >
                <ImageWithSkeleton 
                  src={img.src} 
                  fallback={img.fallback}
                  alt={`Flat Image ${idx + 1}`} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <span className="text-brand-white text-[10px] uppercase tracking-widest font-medium border border-brand-white/30 px-4 py-1.5 rounded-full">
                    Enlarge
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="py-16 md:py-32 px-6 bg-brand-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-24">
            <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Comforts</p>
            <h2 className="text-4xl md:text-5xl font-serif">Premium Amenities</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-16 gap-x-8">
            {AMENITIES.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-brand-gray flex items-center justify-center text-brand-black/80">
                  {item.icon}
                </div>
                <span className="text-sm font-medium tracking-tight text-brand-black/70">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="relative py-16 md:py-32 overflow-hidden bg-brand-gray">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Cinematic Tour</p>
            <h2 className="text-4xl font-serif italic">Experience the Flow</h2>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group"
          >
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              poster={`${STORAGE_BASE_URL}/video/thumbnail.jpg`}
              controls={isVideoPlaying}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            >
              <source src={`${STORAGE_BASE_URL}/video/tour.mp4`} type="video/mp4" />
              <source src="https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-design-4328-large.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {!isVideoPlaying && (
              <div 
                className="absolute inset-0 bg-brand-black/30 flex items-center justify-center cursor-pointer group-hover:bg-brand-black/40 transition-colors"
                onClick={handleVideoPlay}
              >
                <div className="w-24 h-24 rounded-full bg-brand-white/20 backdrop-blur-md flex items-center justify-center border border-brand-white/30 group-hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-brand-white fill-brand-white" />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="py-16 md:py-32 bg-brand-black text-brand-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-white/40 mb-4">Neighborhood</p>
              <h2 className="text-4xl md:text-5xl font-serif mb-8 italic">The Location</h2>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-brand-white/40 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg mb-2">House 7p7q, Abdur Sadeq Road</h4>
                    <p className="text-brand-white/60">Block-D, Bashundhara R/A, Dhaka</p>
                  </div>
                </div>
                <p className="text-brand-white/60 leading-relaxed">
                  Experience living in one of Dhaka's most organized and secure neighborhoods. This 6th-floor unit offers privacy and a great view of the surrounding residential landscape.
                </p>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-brand-white/10">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-brand-white/40 mb-2">Transit</p>
                    <p className="text-sm">5 min to Central Station</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-brand-white/40 mb-2">Groceries</p>
                    <p className="text-sm">2 min to Organic Market</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-brand-white/10 z-0">
              <MapContainer center={[23.81841802565013, 90.43040677748353]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[23.81841802565013, 90.43040677748353]}>
                  <Popup>
                    Azmeree Ivory Builders <br /> House 7p7q, Block-D, Bashundhara R/A
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Application Section */}
      <section id="contact" className="py-16 md:py-32 bg-brand-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-20">
            <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Rental Application</p>
            <h2 className="text-4xl md:text-5xl font-serif italic mb-6">Show Your Interest</h2>
            <p className="text-brand-black/60 max-w-lg mx-auto leading-relaxed text-sm md:text-base">
              Complete the form below to apply for tenancy. Our team will review your application and contact you for further steps.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} noValidate className="space-y-6 md:space-y-12 bg-brand-gray/30 p-6 md:p-16 rounded-[32px] md:rounded-[40px] border border-brand-black/5">
            <div className="grid md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-black/40 flex items-center">
                  <Users className="w-3 h-3 mr-2" /> Full Name
                </label>
                <input 
                  type="text" 
                  value={formState.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full bg-brand-white border-2 rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all shadow-sm ${formErrors.name ? 'border-red-400' : 'border-transparent'}`}
                  placeholder="John Doe"
                />
                <AnimatePresence>
                  {formErrors.name && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-red-500 font-medium ml-1"
                    >
                      {formErrors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-black/40 flex items-center">
                  <Send className="w-3 h-3 mr-2" /> Email Address
                </label>
                <input 
                  type="email" 
                  value={formState.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full bg-brand-white border-2 rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all shadow-sm ${formErrors.email ? 'border-red-400' : 'border-transparent'}`}
                  placeholder="john@example.com"
                />
                <AnimatePresence>
                  {formErrors.email && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-red-500 font-medium ml-1"
                    >
                      {formErrors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-black/40 flex items-center">
                  <Calendar className="w-3 h-3 mr-2" /> Date of Birth
                </label>
                <input 
                  type="date" 
                  value={formState.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  className={`w-full bg-brand-white border-2 rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all shadow-sm ${formErrors.dob ? 'border-red-400' : 'border-transparent'}`}
                />
                <AnimatePresence>
                  {formErrors.dob && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-red-500 font-medium ml-1"
                    >
                      {formErrors.dob}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-black/40 flex items-center">
                  <MapPinned className="w-3 h-3 mr-2" /> Residency (Where are you from?)
                </label>
                <input 
                  type="text" 
                  value={formState.residency}
                  onChange={(e) => handleInputChange('residency', e.target.value)}
                  className={`w-full bg-brand-white border-2 rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all shadow-sm ${formErrors.residency ? 'border-red-400' : 'border-transparent'}`}
                  placeholder="City, Country"
                />
                <AnimatePresence>
                  {formErrors.residency && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-red-500 font-medium ml-1"
                    >
                      {formErrors.residency}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-black/40 flex items-center">
                  <Heart className="w-3 h-3 mr-2" /> Marital Status
                </label>
                <select 
                  value={formState.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className="w-full bg-brand-white border-2 border-transparent rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all shadow-sm appearance-none"
                >
                  <option value="unmarried">Unmarried</option>
                  <option value="married">Married</option>
                </select>
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-black/40 flex items-center">
                  <Home className="w-3 h-3 mr-2" /> Family Members
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={formState.familyMembers}
                  onChange={(e) => handleInputChange('familyMembers', parseInt(e.target.value))}
                  className={`w-full bg-brand-white border-2 rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all shadow-sm ${formErrors.familyMembers ? 'border-red-400' : 'border-transparent'}`}
                />
                <AnimatePresence>
                  {formErrors.familyMembers && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-red-500 font-medium ml-1"
                    >
                      {formErrors.familyMembers}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-col items-center pt-8">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-6 bg-brand-black text-brand-white px-16 py-6 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 group shadow-xl shadow-brand-black/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm uppercase tracking-[0.2em] font-bold">Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm uppercase tracking-[0.2em] font-bold">Submit Application</span>
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>

              <AnimatePresence>
                {submitStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 flex items-center space-x-3 text-green-600 font-medium bg-green-50 px-6 py-3 rounded-full"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">Application submitted! We'll review and contact you.</span>
                  </motion.div>
                )}
                {submitStatus === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 text-red-500 font-medium bg-red-50 px-6 py-3 rounded-full flex items-center space-x-2"
                  >
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-sm">Submission failed. Please try again.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-brand-black/5 bg-brand-gray">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-24">
            <div className="col-span-2">
              <div className="text-2xl font-serif font-bold tracking-tight mb-6">
                AZMEREE<span className="font-light italic ml-6">Ivory</span>
              </div>
              <p className="text-brand-black/60 max-w-sm leading-relaxed">
                Elevating the standard of urban living through intentional design and uncompromising quality.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-sm text-brand-black/60">
                <li><a href="#gallery" className="hover:text-brand-black transition-colors">Gallery</a></li>
                <li><a href="#amenities" className="hover:text-brand-black transition-colors">Amenities</a></li>
                <li><a href="#location" className="hover:text-brand-black transition-colors">Location</a></li>
                <li><a href="#contact" className="hover:text-brand-black transition-colors">Apply for Rent</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Contact</h4>
              <ul className="space-y-4 text-sm text-brand-black/60">
                <li><a href="mailto:islam.hive@yahoo.com" className="hover:text-brand-black transition-colors">islam.hive@yahoo.com</a></li>
                <li><a href="tel:01767842000" className="hover:text-brand-black transition-colors">01767842000</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-brand-black/5 flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-widest text-brand-black/40 space-y-4 md:space-y-0">
            <p>© 2026 Azmeree Ivory Builders. All rights reserved.</p>
            <div className="flex space-x-8">
              <button onClick={() => setIsAdminOpen(true)} className="hover:text-brand-black transition-colors">Admin Portal</button>
              <a href="#" className="hover:text-brand-black transition-colors">Instagram</a>
              <a href="#" className="hover:text-brand-black transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Panel Overlay */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110]"
          >
            <AdminPanel onClose={() => setIsAdminOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-center" />

      {/* Image Modal */}
      <AnimatePresence>
        {galleryIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-black/95 flex items-center justify-center p-4 md:p-12"
            onClick={() => setGalleryIndex(null)}
          >
            <button 
              className="absolute top-8 right-8 text-brand-white z-[110]"
              onClick={() => setGalleryIndex(null)}
            >
              <X className="w-8 h-8" />
            </button>

            <button 
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-brand-white/50 hover:text-brand-white transition-colors"
              onClick={prevImage}
            >
              <div className="p-3 md:p-5 rounded-full border border-brand-white/20 hover:bg-brand-white/10">
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 rotate-180" />
              </div>
            </button>

            <button 
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-brand-white/50 hover:text-brand-white transition-colors"
              onClick={nextImage}
            >
              <div className="p-3 md:p-5 rounded-full border border-brand-white/20 hover:bg-brand-white/10">
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </div>
            </button>

            <div className="max-w-5xl w-full flex flex-col items-center space-y-6">
              <div className="max-h-[70vh] md:max-h-[80vh] w-full" onClick={(e) => e.stopPropagation()}>
                <ImageWithSkeleton 
                  key={galleryIndex}
                  src={HERO_IMAGES[galleryIndex].src} 
                  fallback={HERO_IMAGES[galleryIndex].fallback}
                  alt="Full view" 
                  className="max-h-[70vh] md:max-h-[80vh] w-full object-contain rounded-lg shadow-2xl"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
              </div>
              <motion.div 
                key={`caption-${galleryIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center px-6"
              >
                <p className="text-brand-white text-lg font-serif italic">{HERO_IMAGES[galleryIndex].caption}</p>
                <p className="text-brand-white/40 text-[10px] uppercase tracking-widest mt-2">{galleryIndex + 1} / {HERO_IMAGES.length}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
