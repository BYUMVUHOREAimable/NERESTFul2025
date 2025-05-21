import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, UserPlus, ParkingCircle, ArrowLeft } from "lucide-react";
// import { Logo } from "../ui/logo"; // Using image logo as in LoginForm
import { registerStaff } from "../../api/auth"; // API endpoint for staff registration
import { Input } from "../../components/ui/input";   // Ensure correct path
import { Label } from "../../components/ui/label";   // Ensure correct path
import { Button } from "../../components/ui/button"; // Ensure correct path
import { Loader } from "../../components/ui/loader";   // Ensure correct path
import { useAuth } from "../../context/auth-context"; // Ensure correct path

const staffRegisterSchema = z // Schema name updated for clarity
  .object({
    firstName: z.string().min(2, "First name (min 2 chars)").max(50, "First name too long"),
    lastName: z.string().min(2, "Last name (min 2 chars)").max(50, "Last name too long"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(10, "Password (min 10 chars)") // Adjusted min length for staff example
      // You can add back the more complex regex from your previous version if desired
      .regex(/(?=.*[a-z])/, "Lowercase letter required")
      .regex(/(?=.*[A-Z])/, "Uppercase letter required")
      .regex(/(?=.*\d)/, "Digit required")
      .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/, "Special character required"), // Keep if policy
    confirmPassword: z.string().min(1, "Please confirm your password"),
    // roleName could be added here if this form is used by an Admin to create users with specific roles
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Error will be attached to confirmPassword field
  });

export const RegisterForm = () => { // Changed to RegisterPage assuming it's a full page
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true }); // Default staff dashboard
    }
  }, [isAuthenticated, navigate]);

  const registerMutation = useMutation(registerStaff, { // Using registerStaff from backend
    onSuccess: (data) => {
      toast.success("Staff account created! Please check your email for verification.");
      navigate("/verify-email", { state: { email: formData.email } });
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMsg);
      // If the error is specific to a field (like email already exists),
      // your backend might return an errors object.
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: errorMsg });
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
    // Clear confirmPassword error if password changes
    if (name === "password" && errors.confirmPassword === "Passwords don't match") {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const result = staffRegisterSchema.safeParse(formData);

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
    // Send validated data (firstName, lastName, email, password)
    // Exclude confirmPassword from the payload sent to the backend
    const { confirmPassword, ...payload } = result.data;
    // If this form is for staff self-registration, roleName might be fixed or omitted.
    // If an admin uses this to create users, you might add roleName to payload.
    // For now, assuming self-registration or backend default role for staff.
    registerMutation.mutate(payload);
  };

  return (
    <div className="flex min-h-screen bg-page-bg">
      {/* Left Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col items-center justify-center bg-golden-hour-gradient p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-60 h-60 sm:w-72 sm:h-72 bg-brand-yellow-light/10 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-80 sm:h-80 bg-brand-yellow-dark/10 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl opacity-70"></div>
        <div className="relative z-10 text-center">
          <Link to="/" className="inline-block mb-8 sm:mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md">
            <img src="/images/logo2.png" alt="ParkWell Logo" className="h-16 sm:h-20 w-auto mx-auto opacity-90 drop-shadow-lg" />
            <h1 className="text-4xl sm:text-5xl font-bold mt-3 sm:mt-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-yellow-50 to-yellow-100 drop-shadow-sm">
              ParkWell
            </h1>
          </Link>
          <p className="text-lg sm:text-xl mt-4 sm:mt-6 font-light max-w-xs sm:max-w-sm mx-auto leading-relaxed opacity-80">
            Join the ParkWell Team. <br />Empowering Efficient Parking Management.
          </p>
          <div className="mt-12 sm:mt-16">
            <UserPlus size={120} strokeWidth={0.75} className="mx-auto text-white/20 opacity-40" />
            <p className="text-xs mt-3 opacity-50 tracking-wider">STAFF ACCOUNT CREATION</p>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 py-10 sm:p-8 lg:py-12 lg:px-10 overflow-y-auto">
        <div className="w-full max-w-xs sm:max-w-sm">
          <div className="flex justify-center mb-6 lg:hidden">
            <Link to="/"> <img src="/images/logo2.png" alt="ParkWell Logo" className="h-10 w-auto text-brand-yellow" /> </Link>
          </div>
          <div className="bg-card-bg shadow-2xl rounded-xl p-6 sm:p-8 border border-theme-border-default/20">
            <div className="text-left mb-4">
              <Link to="/login" className="inline-flex items-center text-sm text-link hover:text-link-hover group">
                <ArrowLeft size={16} className="mr-1.5 transition-transform duration-150 group-hover:-translate-x-1" />
                Back to Sign In
              </Link>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main mb-1.5">Create Staff Account</h2>
              <p className="text-text-muted text-sm">Register as an Administrator or Attendant.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">First Name</Label>
                  <Input id="firstName" name="firstName" type="text" autoComplete="given-name" value={formData.firstName} onChange={handleChange}
                    className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.firstName ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    placeholder="e.g., Alex"
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Last Name</Label>
                  <Input id="lastName" name="lastName" type="text" autoComplete="family-name" value={formData.lastName} onChange={handleChange}
                    className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.lastName ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    placeholder="e.g., Johnson"
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange}
                  className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.email ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                  placeholder="staff.member@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Password</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={formData.password} onChange={handleChange}
                    className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.password ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    placeholder="Create a strong password"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-text-main" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange}
                    className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.confirmPassword ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    placeholder="Re-type password"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-text-main" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              {/* If Admin creates users via this form, a Role select dropdown would go here */}
              {/* For self-registration, role is usually fixed or determined by backend */}

              {errors.general && <p className="text-sm text-destructive text-center py-2 bg-destructive/10 rounded-md border border-destructive/30">{errors.general}</p>}

              <Button type="submit" disabled={registerMutation.isLoading}
                className="w-full mt-6 flex items-center justify-center py-3 text-sm sm:text-base bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-brand-yellow disabled:opacity-70 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {registerMutation.isLoading ? (
                  <> <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" /> Creating Account... </>
                ) : (
                  <> <UserPlus size={18} className="mr-2" /> Create Staff Account </>
                )}
              </Button>
              <div className="text-center pt-3">
                <p className="text-sm text-text-muted">
                  Already have a staff account?{" "}
                  <Link to="/login" className="font-medium text-link hover:text-link-hover hover:underline">Sign In</Link>
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