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
  DollarSign,
  ChefHat,
  Sofa,
  Monitor,
  Bed,
  Bath,
  Utensils,
  GraduationCap,
  Building2,
  Navigation,
  School,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { db, auth } from './lib/firebase';
import { collection, addDoc, Timestamp, doc, onSnapshot } from 'firebase/firestore';
import AdminPanel from './AdminPanel';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// --- CONFIGURATION ---
// Replace this with your actual Supabase Storage Public URL
// Format: https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET_NAME]
const STORAGE_BASE_URL = "https://eulxcwxefaaamjsfblqx.supabase.co/storage/v1/object/public/flat-assets";

const AMENITIES = [
  { icon: <Car className="w-5 h-5" />, label: "Dedicated Car Parking" },
  { icon: <Users className="w-5 h-5" />, label: "2 Spacious Elevators" },
  { icon: <ShieldCheck className="w-5 h-5" />, label: "24/7 Security" },
  { icon: <Wind className="w-5 h-5" />, label: "Full Generator Support" },
  { icon: <Coffee className="w-5 h-5" />, label: "Contemporary Kitchen" },
  { icon: <Fan className="w-5 h-5" />, label: "Premium Ceiling Fans" },
  { icon: <Lightbulb className="w-5 h-5" />, label: "Decorative Lighting" },
  { icon: <Home className="w-5 h-5" />, label: "4 Spacious Bedrooms" },
];

const LANDMARKS = [
  { 
    name: "Evercare Hospital", 
    distance: "3 mins", 
    distKm: "1.2 km", 
    category: "Healthcare", 
    icon: <ShieldAlert className="w-5 h-5" />, 
    link: "https://maps.google.com/?q=Evercare+Hospital+Dhaka",
    usp: "State-of-the-art multi-disciplinary medical facility."
  },
  { 
    name: "Jamuna Future Park", 
    distance: "5 mins", 
    distKm: "2.1 km", 
    category: "Mall", 
    icon: <ShoppingBag className="w-5 h-5" />, 
    link: "https://maps.google.com/?q=Jamuna+Future+Park",
    usp: "Asia's largest shopping mall and entertainment hub."
  },
  { 
    name: "ICCB", 
    distance: "7 mins", 
    category: "Expo", 
    distKm: "2.8 km", 
    icon: <Building2 className="w-5 h-5" />, 
    link: "https://maps.google.com/?q=International+Convention+City+Bashundhara",
    usp: "The country's premier event and exhibition destination."
  },
  { 
    name: "300 Feet Road", 
    distance: "4 mins", 
    category: "Transit", 
    distKm: "1.5 km", 
    icon: <Navigation className="w-5 h-5" />, 
    link: "https://maps.google.com/?q=300+Feet+Road+Dhaka",
    usp: "Scenic Purbachal highway, the gateway to new Dhaka."
  },
  { 
    name: "IUB & NSU", 
    distance: "5 mins", 
    category: "Education", 
    distKm: "1.8 km", 
    icon: <GraduationCap className="w-5 h-5" />, 
    link: "https://maps.google.com/?q=Independent+University+Bangladesh",
    usp: "Leading private universities for academic excellence."
  },
  { 
    name: "English Medium Schools", 
    distance: "2 mins", 
    category: "Education", 
    distKm: "0.5 km", 
    icon: <School className="w-5 h-5" />, 
    link: "https://maps.google.com/?q=International+School+Dhaka",
    usp: "Top-tier international schools within walking distance."
  }
];

const RESIDENCE_FEATURES = [
  {
    icon: <Sofa className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Formal Living Room (Including Foyer)",
    description: "Elegantly designed with modern interior finishes, the formal living space features refined decorative lighting, premium ceiling fans, a curated hanging garden, and abundant natural daylight, creating a warm and welcoming ambiance.",
    details: "Refined decorative lighting, premium ceiling fans, curated hanging garden."
  },
  {
    icon: <ChefHat className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Kitchen with Attached Balcony",
    description: "A contemporary, fully functional kitchen equipped with high-quality cabinetry, a dedicated groceries organizer, premium kitchen hood, exhaust system, and sink with hot water supply. The space includes provision for a water purifier, sleek marble countertops, and a stylish breakfast counter, all complemented by ample natural light and an attached utility balcony.",
    details: "High-quality cabinetry, kitchen hood, water purifier provision, breakfast counter."
  },
  {
    icon: <Utensils className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Dining Area",
    description: "Thoughtfully designed with modern aesthetics, the dining space is enhanced with decorative lighting, a ceiling fan, and generous natural daylight, offering a comfortable and elegant setting for family dining.",
    details: "Decorative lighting, ceiling fan, generous natural daylight."
  },
  {
    icon: <Monitor className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Family Living Area",
    description: "A cozy yet sophisticated family lounge featuring modern interior elements, decorative lighting, ceiling fans, a custom TV cabinet, and internet connectivity setup, with plenty of natural daylight for a relaxed everyday living experience.",
    details: "Custom TV cabinet, internet connectivity, plenty of natural daylight."
  },
  {
    icon: <Bed className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Bedrooms",
    description: "Beautifully appointed bedrooms featuring modern interior finishes, decorative lighting, night lamps, and ceiling fans. The master bedroom includes an air cooler for added comfort. Each room offers a workstation-cum-dressing unit, a spacious walk-in closet with a large mirror, and a private balcony. All balconies are equipped with cloth drying rails for convenience.",
    details: "Workstation-cum-dressing unit, walk-in closet, private balcony with drying rails."
  },
  {
    icon: <Bath className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Bathrooms",
    description: "Well-appointed bathrooms with modern fittings and premium finishes. The master and second bedrooms include attached bathrooms, while bedrooms 3 and 4 share a common bathroom. Each bathroom is equipped with TOTO wall-hung WCs, imported sanitary fittings, hot water supply, and glass-enclosed shower areas. A separate maid’s bathroom is conveniently located adjacent to the kitchen balcony.",
    details: "TOTO wall-hung WCs, imported sanitary fittings, hot water supply, glass shower areas."
  }
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
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [landscapeImages, setLandscapeImages] = useState<typeof HERO_IMAGES>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);
  const [outdoorImage, setOutdoorImage] = useState<string | null>(null);
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
    // Listen for rent and settings updates
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setMonthlyRent(data.monthlyRent);
        setOutdoorImage(data.outdoorImage || null);
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

  // Auto-sliding for features on mobile
  useEffect(() => {
    const timer = setInterval(() => {
      if (window.innerWidth < 768) {
        setCurrentFeatureIndex((prev) => (prev + 1) % RESIDENCE_FEATURES.length);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (featuresRef.current && window.innerWidth < 768) {
      const scrollAmount = currentFeatureIndex * (window.innerWidth * 0.85 + 24); // 85vw + gap
      featuresRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [currentFeatureIndex]);

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
      
      // Send email notification via backend
      try {
        await fetch('/api/notify-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formState)
        });
      } catch (err) {
        console.error('Failed to trigger email notification:', err);
      }

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
            AJMERI
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
                AJMERI<span className="font-light italic ml-6">Ivory</span>
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

        <div className="relative z-10 text-center text-brand-white px-6 max-w-4xl pt-12 md:pt-0">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1.5, ease: "easeOut" }}
            className="text-4xl md:text-[10rem] font-serif italic mb-6 md:mb-12 leading-[1.1] md:leading-[0.95] tracking-tighter"
          >
            Ajmeri <br /> Ivory
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mb-10 md:mb-0"
          >
            <a 
              href="#gallery"
              className="inline-flex items-center space-x-2 border border-brand-white/30 px-5 py-2 rounded-full hover:bg-brand-white hover:text-brand-black transition-all duration-500 group backdrop-blur-sm"
            >
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold">Discover the space</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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

      {/* About/Info Section with Rounded Top Corners */}
      <section className="relative -mt-10 md:-mt-20 py-8 md:py-16 px-6 max-w-7xl mx-auto bg-brand-white rounded-t-[40px] md:rounded-t-[64px] z-20">
        <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="pt-4 md:pt-0"
          >
            <h2 className="text-3xl md:text-5xl font-serif mb-0.5 md:mb-1 leading-[1.05] md:leading-[1.05]">
              A 2,150 SFT <br className="hidden md:block" /> sanctuary of refined <br className="hidden md:block" /> <span className="italic">modern living.</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-brand-black/60 leading-relaxed space-y-4"
          >
            {/* Quick-Specs Highlight Bar with Icons */}
            <div className="flex items-center justify-between py-4 border-y border-brand-black/5 mb-4">
              <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                <Home className="w-4 h-4 text-brand-black/20 mb-2" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-brand-black/20 mb-0.5">Size</p>
                <p className="text-sm font-bold text-brand-black">2,150 SFT</p>
              </div>
              <div className="w-[1px] h-10 bg-brand-black/10 mx-2" />
              <div className="flex-1 flex flex-col items-center text-center">
                <Users className="w-4 h-4 text-brand-black/20 mb-2" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-brand-black/20 mb-0.5">Layout</p>
                <p className="text-sm font-bold text-brand-black">4 Bedrooms</p>
              </div>
              <div className="w-[1px] h-10 bg-brand-black/10 mx-2" />
              <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right">
                <MapPinned className="w-4 h-4 text-brand-black/20 mb-2" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-brand-black/20 mb-0.5">Floor</p>
                <p className="text-sm font-bold text-brand-black">5th Floor</p>
              </div>
            </div>

            <div className="space-y-4 md:space-y-5">
              {monthlyRent && (
                <div className="inline-flex items-center space-x-4 bg-brand-gray px-6 py-2.5 rounded-full border border-brand-black/5 mb-1">
                  <DollarSign className="w-4 h-4 text-brand-black/40" />
                  <p className="text-sm font-serif italic text-brand-black">Premium Residency: <span className="not-italic font-bold ml-1">{monthlyRent.toLocaleString()} BDT</span></p>
                </div>
              )}
              <p>
                Perfectly located in Bashundhara Residential Area (Block-D), AJMERI IVORY offers a beautifully interior-designed 2,150 SFT apartment on the 5th floor. Situated on a 40-foot-wide road, this residence ensures excellent accessibility and a serene atmosphere.
              </p>
              
              {outdoorImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative aspect-video rounded-3xl overflow-hidden border border-brand-black/5 shadow-sm my-6"
                >
                  <ImageWithSkeleton 
                    src={outdoorImage} 
                    alt="Outdoor View" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/40 to-transparent flex items-end p-4">
                    <p className="text-brand-white text-[10px] uppercase tracking-widest font-bold">Architectural Exterior</p>
                  </div>
                </motion.div>
              )}

              <p>
                This elegant home features 4 well-appointed bedrooms, a formal living area with a foyer, and a separate family lounge. The thoughtfully crafted layout combines a refined dining space with a contemporary kitchen, reflecting a commitment to both functionality and modern aesthetics.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Nearby Landmarks Section */}
      <section className="py-8 md:py-16 px-6 bg-brand-gray/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 md:mb-16">
            <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Prime Location</p>
            <h2 className="text-4xl md:text-5xl font-serif italic">Connected <span className="not-italic">Convenience</span></h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
            {LANDMARKS.map((landmark, idx) => (
              <motion.a
                key={idx}
                href={landmark.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-brand-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-brand-black/5 flex flex-col items-center text-center group hover:bg-brand-black transition-all duration-500"
              >
                <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-brand-gray rounded-full group-hover:bg-brand-white/10 group-hover:text-brand-white transition-colors relative">
                  <div className="scale-90 md:scale-100">
                    {landmark.icon}
                  </div>
                  <ExternalLink className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="hidden md:block text-[10px] uppercase tracking-widest font-bold text-brand-black/20 mb-1 group-hover:text-brand-white/40">{landmark.category}</p>
                <h3 className="text-[10px] md:text-xs font-bold text-brand-black group-hover:text-brand-white mb-1 md:mb-2 leading-tight line-clamp-2 md:line-clamp-none">{landmark.name}</h3>
                <div className="mt-auto pt-2 md:pt-3 border-t border-brand-black/5 group-hover:border-brand-white/10 w-full">
                  <p className="text-[9px] md:text-[10px] font-bold text-brand-black/60 group-hover:text-brand-white/80">{landmark.distKm}</p>
                  <p className="text-[9px] md:text-[10px] italic text-brand-black/40 group-hover:text-brand-white/40">~ {landmark.distance}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Residence Features Grid */}
      <section className="py-8 md:py-16 px-6 bg-brand-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Interior Excellence</p>
              <h2 className="text-4xl md:text-6xl font-serif italic leading-[1.1]">Sophisticated <br /> <span className="not-italic">Craftsmanship</span></h2>
            </div>
          </div>
          
          <div 
            ref={featuresRef}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12 overflow-x-auto md:overflow-visible pb-8 md:pb-0 snap-x no-scrollbar"
            onScroll={(e) => {
              if (window.innerWidth < 768) {
                const scrollLeft = e.currentTarget.scrollLeft;
                const itemWidth = window.innerWidth * 0.85 + 24;
                const index = Math.round(scrollLeft / itemWidth);
                if (index !== currentFeatureIndex) {
                  setCurrentFeatureIndex(index);
                }
              }
            }}
          >
            {RESIDENCE_FEATURES.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-6 md:p-10 bg-brand-gray/30 rounded-[32px] md:rounded-[40px] border border-brand-black/5 hover:bg-brand-black hover:text-brand-white transition-all duration-700 min-w-[85vw] md:min-w-0 snap-center flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 md:mb-8 flex items-center justify-between">
                    <div className="p-3 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand-white border border-brand-black/5 flex items-center justify-center group-hover:bg-brand-white/10 group-hover:border-brand-white/20 transition-all duration-500">
                      <span className="text-brand-black group-hover:text-brand-white font-serif text-sm md:text-base">{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="text-brand-black/40 group-hover:text-brand-white/40 transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg md:text-2xl font-serif mb-4 md:mb-6 group-hover:text-brand-white transition-colors">{feature.title}</h3>
                  <p className="text-xs md:text-sm leading-relaxed mb-6 group-hover:text-brand-white/70 transition-colors">{feature.description}</p>
                </div>
                <div className="pt-6 border-t border-brand-black/5 group-hover:border-brand-white/10">
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold mb-2 group-hover:text-brand-white/40">Key Highlights</p>
                  <p className="text-[11px] md:text-xs italic leading-relaxed group-hover:text-brand-white/60">{feature.details}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature Carousel Indicators - Mobile Only */}
          <div className="flex md:hidden justify-center space-x-2 mt-6">
            {RESIDENCE_FEATURES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentFeatureIndex(idx);
                  if (featuresRef.current) {
                    const itemWidth = window.innerWidth * 0.85 + 24;
                    featuresRef.current.scrollTo({
                      left: idx * itemWidth,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  currentFeatureIndex === idx ? 'w-6 bg-brand-black' : 'bg-brand-black/20'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-8 md:py-16 bg-brand-gray">
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
      <section id="amenities" className="py-8 md:py-16 px-6 bg-brand-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Comforts</p>
            <h2 className="text-4xl md:text-5xl font-serif">Premium Amenities</h2>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-y-10 md:gap-y-16 gap-x-4 md:gap-x-8">
            {AMENITIES.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center text-center space-y-4 group relative"
              >
                <div className="w-16 h-16 rounded-full bg-brand-gray flex items-center justify-center text-brand-black/80 relative">
                  {item.icon}
                  {/* Tooltip */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
                    whileHover={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-12 left-1/2 pointer-events-none z-30"
                  >
                    <div className="bg-brand-black text-brand-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                      {item.label}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-black rotate-45" />
                    </div>
                  </motion.div>
                </div>
                <span className="text-sm font-medium tracking-tight text-brand-black/70">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="relative py-8 md:py-16 overflow-hidden bg-brand-gray">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8 md:mb-10">
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
      <section id="location" className="py-8 md:py-16 bg-brand-black text-brand-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-white/40 mb-4">Neighborhood</p>
              <h2 className="text-4xl md:text-5xl font-serif mb-8 italic">The Location</h2>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-brand-white/40 mt-1" />
                  <div>
                    <h4 className="font-medium text-lg mb-2 text-brand-white">AJMERI IVORY, Block-D, Bashundhara R/A</h4>
                    <p className="text-brand-white/60 font-serif italic">House-7P & 7Q, Abdus Sadek Sarak</p>
                  </div>
                </div>
                <p className="text-brand-white/60 leading-relaxed">
                  Ideally situated on a 40-foot-wide road, providing effortless connectivity to Dhaka's most essential landmarks including Evercare Hospital, Jamuna Future Park, and ICCB.
                </p>
                <div className="grid grid-cols-2 gap-4 md:gap-8 pt-8 border-t border-brand-white/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-white/40 mb-3">Healthcare & Retail</p>
                    <p className="text-xs leading-relaxed text-brand-white/80">Minutes from Evercare & Jamuna Future Park</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-white/40 mb-3">Connectivity</p>
                    <p className="text-xs leading-relaxed text-brand-white/80">300 Feet Road Access & 40ft Wide Entrance</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                  <a 
                    href="https://www.google.com/maps/dir/?api=1&destination=23.818418,90.430407"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 bg-brand-white text-brand-black px-8 py-3 rounded-full hover:bg-brand-gray transition-colors group"
                  >
                    <Navigation className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs uppercase tracking-widest font-bold">Get Directions</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-brand-white/10 z-0 bg-brand-gray/10">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.098083818617!2d90.4282181!3d23.818418!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQ5JzA2LjMiTiA5MMKwMjUnNDEuNiJF!5e0!3m2!1sen!2sbd!4v1713890000000!5m2!1sen!2sbd" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Location"
                className="grayscale brightness-[0.8] contrast-[1.2] hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Application Section */}
      <section id="contact" className="py-8 md:py-16 bg-brand-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-16">
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
                AJMERI<span className="font-light italic ml-6">Ivory</span>
              </div>
              <p className="text-brand-black/60 max-w-sm leading-relaxed">
                Elevating the standard of urban living at AJMERI IVORY through intentional design and uncompromising quality.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Address</h4>
              <p className="text-brand-black/60 text-sm leading-relaxed max-w-[200px]">
                AJMERI IVORY,<br />
                House-7P & 7Q (5th floor),<br />
                Abdus Sadek Sarak,<br />
                Bashundhara R/A, Dhaka
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Proximity</h4>
              <ul className="space-y-4 text-sm text-brand-black/60">
                <li><a href="#location" className="hover:text-brand-black transition-colors">Evercare Hospital</a></li>
                <li><a href="#location" className="hover:text-brand-black transition-colors">Jamuna Future Park</a></li>
                <li><a href="#location" className="hover:text-brand-black transition-colors">ICCB & 300 Feet Rd</a></li>
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
            <p>© 2026 sabbir islam alvi. All rights reserved.</p>
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
              <div 
                className="max-h-[70vh] md:max-h-[80vh] w-full cursor-pointer relative group flex items-center justify-center" 
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center md:hidden">
                  <div className="bg-brand-black/40 backdrop-blur-md px-4 py-2 rounded-full text-[10px] text-brand-white/70 uppercase tracking-widest border border-brand-white/10">
                    Swipe or Tap to slide
                  </div>
                </div>

                <motion.div
                  key={galleryIndex}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    const threshold = 50;
                    if (info.offset.x < -threshold) nextImage();
                    else if (info.offset.x > threshold) prevImage();
                  }}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full flex justify-center touch-none"
                >
                  <ImageWithSkeleton 
                    src={HERO_IMAGES[galleryIndex].src} 
                    fallback={HERO_IMAGES[galleryIndex].fallback}
                    alt="Full view" 
                    className="max-h-[70vh] md:max-h-[80vh] w-full object-contain rounded-lg shadow-2xl select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                    loading="eager"
                  />
                </motion.div>
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
