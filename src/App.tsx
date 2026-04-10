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
  Lock
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from "@/src/lib/supabase";

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
const STORAGE_BASE_URL = "https://your-project-id.supabase.co/storage/v1/object/public/flat-assets";

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

const GALLERY_IMAGES = [
  { src: `${STORAGE_BASE_URL}/gallery/01-living-room.jpg`, alt: "Living Room", span: "col-span-2 row-span-2", fallback: "https://picsum.photos/seed/flat1/1200/800" },
  { src: `${STORAGE_BASE_URL}/gallery/02-bedroom.jpg`, alt: "Bedroom", span: "col-span-1 row-span-2", fallback: "https://picsum.photos/seed/flat2/800/1200" },
  { src: `${STORAGE_BASE_URL}/gallery/03-kitchen.jpg`, alt: "Kitchen", span: "col-span-1 row-span-1", fallback: "https://picsum.photos/seed/flat3/800/800" },
  { src: `${STORAGE_BASE_URL}/gallery/04-bathroom.jpg`, alt: "Bathroom", span: "col-span-1 row-span-1", fallback: "https://picsum.photos/seed/flat4/800/800" },
  { src: `${STORAGE_BASE_URL}/gallery/05-balcony.jpg`, alt: "Balcony View", span: "col-span-2 row-span-1", fallback: "https://picsum.photos/seed/flat5/1200/800" },
];

const HERO_IMAGES = [
  { src: `${STORAGE_BASE_URL}/hero/hero-1.jpg`, fallback: "https://picsum.photos/seed/hero1/1920/1080" },
  { src: `${STORAGE_BASE_URL}/hero/hero-2.jpg`, fallback: "https://picsum.photos/seed/hero2/1920/1080" },
  { src: `${STORAGE_BASE_URL}/hero/hero-3.jpg`, fallback: "https://picsum.photos/seed/hero3/1920/1080" },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form state
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase
        .from('inquiries')
        .insert([formState]);

      if (error) throw error;

      setSubmitStatus('success');
      setFormState({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-white selection:bg-brand-black selection:text-brand-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-brand-white/80 backdrop-blur-md py-4 border-b border-brand-black/5" : "bg-transparent py-8"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-serif font-bold tracking-tight"
          >
            IVORY<span className="font-light">BUILDERS</span>
          </motion.div>
          
          <div className="hidden md:flex space-x-12 text-xs uppercase tracking-[0.2em] font-medium">
            {["Gallery", "Amenities", "Video", "Location", "Contact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:opacity-50 transition-opacity">
                {item}
              </a>
            ))}
          </div>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
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
            <div className="flex flex-col space-y-8 text-2xl font-serif">
              {["Gallery", "Amenities", "Video", "Location", "Contact"].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`} 
                  onClick={() => setIsMenuOpen(false)}
                  className="border-b border-brand-black/10 pb-4"
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentHeroIndex}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img 
              src={HERO_IMAGES[currentHeroIndex].src} 
              onError={(e) => (e.currentTarget.src = HERO_IMAGES[currentHeroIndex].fallback)}
              alt={`Hero Flat ${currentHeroIndex + 1}`} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-brand-black/20" />
          </motion.div>
        </AnimatePresence>

        {/* Hero Slide Indicators */}
        <div className="absolute bottom-12 right-12 z-20 flex space-x-4">
          {HERO_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentHeroIndex(idx)}
              className={`w-12 h-[2px] transition-all duration-500 ${idx === currentHeroIndex ? "bg-brand-white" : "bg-brand-white/30"}`}
            />
          ))}
        </div>

        <div className="relative z-10 text-center text-brand-white px-6">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xs uppercase tracking-[0.4em] mb-6 font-medium"
          >
            Available for Rent
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-4xl md:text-8xl font-serif mb-8 leading-tight"
          >
            Modern Living <br /> <span className="italic">Redefined.</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <a 
              href="#gallery"
              className="inline-flex items-center space-x-4 border border-brand-white/30 px-8 py-4 rounded-full hover:bg-brand-white hover:text-brand-black transition-all duration-500 group"
            >
              <span className="text-xs uppercase tracking-widest font-medium">Explore the Space</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-brand-white/50 to-transparent" />
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
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
      <section id="gallery" className="py-24 bg-brand-gray">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Visual Tour</p>
              <h2 className="text-4xl font-serif italic">The Space</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {GALLERY_IMAGES.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`${img.span} relative group cursor-pointer overflow-hidden rounded-2xl`}
                onClick={() => setSelectedImage(img.src)}
              >
                <img 
                  src={img.src} 
                  onError={(e) => (e.currentTarget.src = img.fallback)}
                  alt={img.alt} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <span className="text-brand-white text-xs uppercase tracking-widest font-medium border border-brand-white/30 px-6 py-2 rounded-full">
                    View Large
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
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
      <section id="video" className="relative py-32 overflow-hidden bg-brand-gray">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
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
      <section id="location" className="py-32 bg-brand-black text-brand-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-24 items-center">
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
                    Ivory Builders <br /> House 7p7q, Block-D, Bashundhara R/A
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-brand-black/40 mb-4">Inquiry</p>
            <h2 className="text-4xl md:text-5xl font-serif">Get in Touch</h2>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-medium text-brand-black/60">Name</label>
                <input 
                  required
                  type="text" 
                  value={formState.name}
                  onChange={(e) => setFormState({...formState, name: e.target.value})}
                  className="w-full bg-brand-gray border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-medium text-brand-black/60">Email</label>
                <input 
                  required
                  type="email" 
                  value={formState.email}
                  onChange={(e) => setFormState({...formState, email: e.target.value})}
                  className="w-full bg-brand-gray border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all"
                  placeholder="Your email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-medium text-brand-black/60">Message</label>
              <textarea 
                required
                rows={5}
                value={formState.message}
                onChange={(e) => setFormState({...formState, message: e.target.value})}
                className="w-full bg-brand-gray border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-brand-black/5 outline-none transition-all resize-none"
                placeholder="How can we help you?"
              />
            </div>

            <div className="flex flex-col items-center space-y-6">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-4 bg-brand-black text-brand-white px-12 py-5 rounded-full hover:opacity-90 transition-all disabled:opacity-50 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm uppercase tracking-widest font-medium">Sending...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm uppercase tracking-widest font-medium">Send Inquiry</span>
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>

              {submitStatus === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-green-600 font-medium"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Inquiry sent successfully! We'll get back to you soon.</span>
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 font-medium"
                >
                  Something went wrong. Please try again later.
                </motion.div>
              )}
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
                IVORY<span className="font-light">BUILDERS</span>
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
                <li><a href="#contact" className="hover:text-brand-black transition-colors">Contact</a></li>
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
            <p>© 2026 Ivory Builders. All rights reserved.</p>
            <div className="flex space-x-8">
              <a href="#" className="hover:text-brand-black transition-colors">Instagram</a>
              <a href="#" className="hover:text-brand-black transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-black/95 flex items-center justify-center p-6"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-8 right-8 text-brand-white">
              <X className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selectedImage} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
