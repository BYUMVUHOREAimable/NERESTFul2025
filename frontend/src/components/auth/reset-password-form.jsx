import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMutation } from "react-query";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import { resetPassword } from "../../api/auth"; 
import { Input } from "../ui/input";   
import { Label } from "../ui/label";  
import { Button } from "../ui/button"; 
import { Loader } from "../ui/loader";   
import { useAuth } from "../../context/auth-context";

const resetPasswordSchema = z
  .object({
    otp_code: z.string().length(6, "OTP must be 6 digits.").regex(/^\d{6}$/, "OTP must be 6 numeric digits."),
    newPassword: z.string().min(10, "Password must be at least 10 characters")
      .regex(/(?=.*[a-z])/, "Must contain a lowercase letter")
      .regex(/(?=.*[A-Z])/, "Must contain an uppercase letter")
      .regex(/(?=.*\d)/, "Must contain a digit")
      .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/, "Must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const ResetPasswordForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    otp_code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState("");


  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
    if (!location.state?.email) {
      toast.error("No email provided for password reset. Please start over.");
      navigate("/forgot-password", { replace: true });
    } else {
      setFormData(prev => ({ ...prev, email: location.state.email }));
    }
  }, [isAuthenticated, location.state, navigate]);

  const resetMutation = useMutation(resetPassword, {
    onSuccess: () => {
      toast.success("Password reset successfully! You can now login with your new password.");
      navigate("/login");
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Password reset failed. Invalid OTP or an error occurred.";
      toast.error(errorMsg);
      setGeneralError(errorMsg);
      
      setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
    if (name === "newPassword" && errors.confirmPassword === "Passwords don't match") {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    const dataToValidate = {
      otp_code: formData.otp_code,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    };
    const result = resetPasswordSchema.safeParse(dataToValidate);

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
    resetMutation.mutate({ 
      email: formData.email,
      otp_code: result.data.otp_code,
      newPassword: result.data.newPassword
    });
  };

  if (!formData.email && !isAuthenticated) { 
    return ( 
      <div className="flex min-h-screen items-center justify-center bg-page-bg">Loading...</div>
    );
  }

  return (
    <div className="flex min-h-screen bg-page-bg">
      
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col items-center justify-center bg-golden-hour-gradient p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand-yellow-light/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-yellow-dark/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        <div className="relative z-10 text-center">
          <Link to="/" className="inline-block mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md">
            <img src="/images/logo2.png" alt="XYZ LTD PMS Logo" className="h-20 w-auto mx-auto opacity-90 drop-shadow-lg" />
            <h1 className="text-5xl font-bold mt-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-yellow-50 to-yellow-100 drop-shadow-sm">
              XYZ LTD PMS
            </h1>
          </Link>
          <p className="text-xl mt-6 font-light max-w-xs sm:max-w-sm mx-auto leading-relaxed opacity-80">
            Securely Update Your Access. <br /> Almost there!
          </p>
          <div className="mt-16">
            <KeyRound size={150} strokeWidth={0.75} className="mx-auto text-white/20 opacity-40" />
            <p className="text-xs mt-4 opacity-50 tracking-wider">ILLUSTRATION: PASSWORD SECURITY</p>
          </div>
        </div>
      </div>

      
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8 lg:py-12 lg:px-10 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6 lg:hidden">
            <Link to="/">
              <img src="/images/logo2.png" alt="XYZ LTD PMS Logo" className="h-10 w-auto text-brand-yellow" />
            </Link>
          </div>
          <div className="bg-card-bg shadow-2xl rounded-xl p-8 border border-theme-border-default/20">
            <div className="text-left mb-4">
              <Link to="/login" className="inline-flex items-center text-sm text-link hover:text-link-hover group">
                <ArrowLeft size={16} className="mr-1.5 transition-transform duration-150 group-hover:-translate-x-1" />
                Back to Sign In
              </Link>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main mb-1.5">Set New Password</h2>
              <p className="text-text-muted text-sm">
                Enter the OTP from your email and create a new secure password for <span className="font-medium text-text-main">{formData.email}</span>.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="otp_code" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">OTP Code</Label>
                <Input id="otp_code" name="otp_code" type="text" value={formData.otp_code} onChange={handleChange}
                  className={`w-full tracking-[0.2em] text-center bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-3 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.otp_code ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                  placeholder="6-digit code" maxLength={6}
                />
                {errors.otp_code && <p className="mt-1 text-xs text-destructive">{errors.otp_code}</p>}
              </div>
              <div>
                <Label htmlFor="newPassword" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">New Password</Label>
                <div className="relative">
                  <Input id="newPassword" name="newPassword" type={showPassword ? "text" : "password"} value={formData.newPassword} onChange={handleChange}
                    className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-3 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.newPassword ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    placeholder="Enter new password"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-text-main" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange}
                    className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-3 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.confirmPassword ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    placeholder="Re-type new password"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-text-main" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              {generalError && (!errors.otp_code && !errors.newPassword && !errors.confirmPassword) &&
                <p className="text-sm text-destructive text-center py-2">{generalError}</p>
              }

              <Button type="submit" disabled={resetMutation.isLoading}
                className="w-full mt-6 flex items-center justify-center py-3 text-sm sm:text-base bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-brand-yellow disabled:opacity-70 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {resetMutation.isLoading ? (
                  <> <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" /> Setting Password... </>
                ) : (
                  <> <KeyRound size={18} className="mr-2" /> Reset Password </>
                )}
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-text-muted mt-8">
            © {new Date().getFullYear()} XYZ LTD PMS Systems.
          </p>
        </div>
      </div>
    </div>
  );
};