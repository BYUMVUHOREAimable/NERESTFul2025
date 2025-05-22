import { Link } from "react-router-dom";
import { ChevronRight, MapPin, ShieldCheck, Zap, MessageSquare } from "lucide-react"; // Example icons
import { useAuth } from "../context/auth-context";
import { useEffect } from "react";

// Placeholder for a hero illustration/animation - you'd replace this
const HeroIllustration = () => (


  <div className="aspect-[16/10] md:aspect-[16/9] lg:aspect-[21/9] rounded-xl bg-gradient-to-br from-brand-yellow-light/30 via-brand-yellow/10 to-transparent relative overflow-hidden border border-brand-yellow/20 shadow-xl">
    {/* Mockup of an abstract parking interface or city with highlighted spots */}
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Simple geometric shapes pulsating or moving */}
      <div className="w-32 h-32 bg-brand-yellow rounded-full opacity-20 animate-pulse delay-500"></div>
      <div className="w-48 h-48 border-2 border-brand-yellow-light rounded-full opacity-30 absolute animate-ping"></div>
      <p className="text-2xl font-semibold text-brand-yellow/70 z-10">Smart Parking Visualized</p>
    </div>
    {/* You would replace this with an actual SVG, Lottie animation, or a cool image/video */}
  </div>
);

// Placeholder for testimonial data
const testimonials = [
  { id: 1, name: "Sarah L.", role: "Daily Commuter", quote: "XYZ LTD PMS made my city parking stress-free! Finding a spot is now a breeze.", avatar: "/images/sarah.jpg" },
  { id: 2, name: "Vannnessa J..", role: "Business Owner", quote: "Managing parking for my employees has never been easier or more efficient. Highly recommend!", avatar: "/images/vannessa.jpg" },
  { id: 3, name: "Maria K.", role: "Weekend Explorer", quote: "Love the futuristic feel and how quickly I can reserve a spot. The yellow theme is so cheerful!", avatar: "/images/maria.jpg" },
];


export const HomePage = () => {
  const { user } = useAuth(); 
  useEffect(() => {
    //redirect to dashboard if user is logged in
    if (user) {
      window.location.href = "/my-vehicles";
    }
  }, [user]);

  return (
    <div className="bg-page-bg text-text-main min-h-screen">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-card-bg/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center">
              <img src="/images/logo2.png" alt="XYZ LTD PMS Logo" className="h-10 w-auto mr-2" />
              <span className="text-3xl font-bold tracking-tight text-brand-yellow">XYZ PARKING MANAGEMENT SYSTEM</span>
            </Link>
            <div className="flex items-center space-x-3 sm:space-x-5">
              <Link to="/login" className="text-sm font-medium text-text-main hover:text-link transition-colors px-3 py-2 rounded-md">
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-brand-yellow text-text-on-brand hover:bg-brand-yellow-hover px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        {/* Subtle background gradient or pattern */}
        <div className="absolute inset-0 bg-golden-subtle-gradient opacity-50"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-text-main sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block">Park Smarter,</span>
              <span className="block text-brand-yellow">Not Harder.</span>
            </h1>
            <p className="mt-6 max-w-xl mx-auto text-lg text-text-muted sm:text-xl md:text-2xl leading-relaxed">
              Discover XYZ LTD PMS: Your intuitive, secure, and efficient solution for finding and managing parking spaces. Say goodbye to parking hassles.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-text-on-brand bg-brand-yellow hover:bg-brand-yellow-hover md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Find Your Spot Now <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {/* Feature Section */}
        <section className="py-16 sm:py-24 bg-card-bg border-t border-b border-theme-border-default/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold text-brand-yellow tracking-wide uppercase">Why XYZ LTD PMS?</h2>
              <p className="mt-2 text-3xl lg:text-4xl font-extrabold tracking-tight text-text-main">
                The Future of Parking is Here
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center p-6 bg-page-bg rounded-xl shadow-lg border border-theme-border-default/30 hover:shadow-xl transition-shadow duration-300">
                <div className="flex-shrink-0 mb-5">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-yellow/10 text-brand-yellow">
                    <MapPin size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-text-main mb-2">Easy Spot Finding</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Quickly locate available parking slots with our intuitive interface. Real-time updates ensure you find the perfect spot, every time.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center p-6 bg-page-bg rounded-xl shadow-lg border border-theme-border-default/30 hover:shadow-xl transition-shadow duration-300">
                <div className="flex-shrink-0 mb-5">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-yellow/10 text-brand-yellow">
                    <ShieldCheck size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-text-main mb-2">Secure & Efficient</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Your vehicle's safety and your time are our top priorities. Secure payments and efficient slot management.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center p-6 bg-page-bg rounded-xl shadow-lg border border-theme-border-default/30 hover:shadow-xl transition-shadow duration-300">
                <div className="flex-shrink-0 mb-5">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-yellow/10 text-brand-yellow">
                    <Zap size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-text-main mb-2">Futuristic Experience</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Embrace a modern, visually engaging platform designed for a seamless and sophisticated parking experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Illustration Section (if applicable) */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <HeroIllustration />
          </div>
        </section>


        {/* Testimonials Section */}
        <section className="py-16 sm:py-24 bg-input-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold text-brand-yellow tracking-wide uppercase">Loved By Users</h2>
              <p className="mt-2 text-3xl lg:text-4xl font-extrabold tracking-tight text-text-main">
                Don't Just Take Our Word For It
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-card-bg p-8 rounded-xl shadow-lg border border-theme-border-default/30 flex flex-col">
                  <MessageSquare size={36} className="text-brand-yellow/70 mb-4" />
                  <p className="text-text-muted italic flex-grow">"{testimonial.quote}"</p>
                  <div className="mt-6 flex items-center">
                    <img className="h-12 w-12 rounded-full object-cover" src={testimonial.avatar} alt={testimonial.name} />
                    <div className="ml-4">
                      <p className="font-semibold text-text-main">{testimonial.name}</p>
                      <p className="text-sm text-text-muted">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 sm:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
              Ready to Simplify Your Parking?
            </h2>
            <p className="mt-4 text-lg leading-6 text-text-muted max-w-2xl mx-auto">
              Join XYZ LTD PMS today and experience the difference. Quick registration, easy slot finding, and stress-free parking management.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-base font-semibold rounded-xl text-text-on-brand bg-brand-yellow hover:bg-brand-yellow-hover shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Sign Up For Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-text-main text-page-bg/70 border-t border-theme-border-default/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-brand-yellow tracking-wider uppercase">XYZ LTD PMS</h3>
              <ul role="list" className="mt-4 space-y-2">
                <li><Link to="/about" className="text-xs hover:text-brand-yellow-light transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="text-xs hover:text-brand-yellow-light transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-yellow tracking-wider uppercase">Support</h3>
              <ul role="list" className="mt-4 space-y-2">
                <li><Link to="/help" className="text-xs hover:text-brand-yellow-light transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="text-xs hover:text-brand-yellow-light transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-yellow tracking-wider uppercase">Legal</h3>
              <ul role="list" className="mt-4 space-y-2">
                <li><Link to="/privacy" className="text-xs hover:text-brand-yellow-light transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-xs hover:text-brand-yellow-light transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            {/* Social Media or App Store Links can go here */}
          </div>
          <div className="mt-10 border-t border-page-bg/10 pt-8 text-center">
            <p className="text-xs">© {new Date().getFullYear()} XYZ LTD PMS Systems. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};