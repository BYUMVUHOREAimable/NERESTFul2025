import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "react-query";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, LogIn, ParkingCircle } from "lucide-react"; // ParkingCircle for illustration
// Assuming Logo is a component. If it's just an img, we'll adjust.
// import { Logo } from "../ui/logo"; 
import { loginUser } from "../../api/auth"; // Make sure this path is correct
import { Input } from "../../components/ui/input";   // Make sure path is correct
import { Label } from "../../components/ui/label";   // Make sure path is correct
import { Button } from "../../components/ui/button"; // Make sure path is correct
import { Loader } from "../../components/ui/loader";   // Make sure path is correct
import { useAuth } from "../../context/auth-context"; // Make sure path is correct

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."), // Min 1 to ensure it's not empty
  rememberMe: z.boolean().optional(),
});

export const LoginForm = () => { // Changed to LoginPage assuming it's a full page
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login: contextLogin } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const { from, intent, requestId } = location.state || {};
      if (from && intent === 'viewTicket' && requestId) {
        navigate(`${from.pathname}?requestId=${requestId}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true }); // Default staff dashboard or main app page
      }
    }
  }, [isAuthenticated, navigate, location.state]);

  const loginMutation = useMutation(loginUser, {
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast.success("Login successful! Welcome back.");
      window.location.href = "/dashboard"; // Or navigate and use context
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
        "Login failed. Please check your credentials."
      );
      setFormData((prev) => ({ ...prev, password: "" }));
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    loginMutation.mutate(result.data);
  };

  return (
    <div className="flex min-h-screen bg-page-bg"> {/* Themed page background */}
      {/* Left Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col items-center justify-center bg-golden-hour-gradient p-12 text-white relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 left-0 w-60 h-60 sm:w-72 sm:h-72 bg-brand-yellow-light/10 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-80 sm:h-80 bg-brand-yellow-dark/10 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl opacity-70"></div>

        <div className="relative z-10 text-center">
          <Link to="/" className="inline-block mb-8 sm:mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md">
            {/* Replace with your actual ParkWell logo image */}
            <img src="/images/logo2.png" alt="ParkWell Logo" className="h-16 sm:h-20 w-auto mx-auto opacity-90 drop-shadow-lg" />
            <h1 className="text-4xl sm:text-5xl font-bold mt-3 sm:mt-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-yellow-50 to-yellow-100 drop-shadow-sm">
              ParkWell
            </h1>
          </Link>

          <p className="text-lg sm:text-xl mt-4 sm:mt-6 font-light max-w-xs sm:max-w-sm mx-auto leading-relaxed opacity-80">
            Seamless Parking, Golden Experience. <br />Access your smart parking solution.
          </p>

          <div className="mt-12 sm:mt-16">
            <ParkingCircle size={120} strokeWidth={0.75} className="mx-auto text-white/20 opacity-40 animate-pulse" /> {/* Subtle animation */}
            <p className="text-xs mt-3 opacity-50 tracking-wider">ILLUSTRATION: SMART PARKING ACCESS</p>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 py-10 sm:p-8 lg:p-12">
        <div className="w-full max-w-xs sm:max-w-sm"> {/* Adjusted max-width */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link to="/">
              <img src="/images/logo2.png" alt="ParkWell Logo" className="h-10 w-auto text-brand-yellow" />
            </Link>
          </div>

          <div className="bg-card-bg shadow-2xl rounded-xl p-6 sm:p-8 border border-theme-border-default/20">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main mb-1.5">
                Staff Portal Login
              </h2>
              <p className="text-text-muted text-sm">
                Welcome back! Please sign in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5"> {/* Adjusted space */}
              <div>
                <Label htmlFor="email" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Email Address</Label>
                <Input
                  id="email" name="email" type="email" autoComplete="email"
                  value={formData.email} onChange={handleChange}
                  className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 
                            border-2 transition-all duration-150 ease-in-out
                            focus:bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow
                            ${errors.email ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                  placeholder="staff.email@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Password</Label>
                <div className="relative">
                  <Input
                    id="password" name="password" type={showPassword ? "text" : "password"}
                    autoComplete="current-password" value={formData.password} onChange={handleChange}
                    className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 
                                border-2 transition-all duration-150 ease-in-out
                                focus:bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow
                                ${errors.password ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-text-main"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="rememberMe" name="rememberMe" type="checkbox"
                    checked={formData.rememberMe} onChange={handleChange}
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-yellow border-theme-border-input rounded focus:ring-brand-yellow focus:ring-offset-card-bg" // Adjusted ring offset
                  />
                  <Label htmlFor="rememberMe" className="ml-2 text-text-main cursor-pointer text-xs sm:text-sm">Remember Me</Label>
                </div>
                <Link to="/forgot-password" className="font-medium text-link hover:text-link-hover text-xs sm:text-sm hover:underline">Forgot?</Link>
              </div>

              {errors.general && (
                <p className="text-sm text-destructive text-center py-2 bg-destructive/10 rounded-md border border-destructive/30">
                  {errors.general}
                </p>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isLoading}
                className="w-full flex items-center justify-center py-3 text-sm sm:text-base bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold rounded-lg 
                           shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-brand-yellow 
                           disabled:opacity-70 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loginMutation.isLoading ? (
                  <> <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" /> Signing In... </>
                ) : (
                  <> <LogIn size={18} className="mr-2" /> Sign In </>
                )}
              </Button>
              <div className="text-center pt-3">
                <p className="text-sm text-text-muted">
                  Need staff access?{" "}
                  <Link to="/register-staff" className="font-medium text-link hover:text-link-hover hover:underline">Register Here</Link>
                  {/* Or "Contact Admin" if self-registration is off */}
                </p>
              </div>
            </form>
          </div>
          <p className="text-center text-xs text-text-muted mt-8">
            © {new Date().getFullYear()} ParkWell Systems.
          </p>
        </div>
      </div>
    </div>
  );
};