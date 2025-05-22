import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { ArrowLeft, Mail, ParkingCircle } from "lucide-react";
import { requestPasswordReset } from "../../api/auth"; // Assuming path
import { Input } from "../ui/input";     // Assuming path
import { Label } from "../ui/label";     // Assuming path
import { Button } from "../ui/button";   // Assuming path
import { Loader } from "../ui/loader";     // Assuming path
// import { Logo } from "../ui/logo"; // Using image logo
import { useAuth } from "../../context/auth-context"; // Assuming path

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Get isAuthenticated
  const [email, setEmail] = useState("");
  const [zodError, setZodError] = useState(""); // For Zod specific error
  const [generalError, setGeneralError] = useState(""); // For API errors

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const resetMutation = useMutation(requestPasswordReset, {
    onSuccess: (data) => {
      toast.success(data.message || "Password reset OTP sent if your email is registered.");
      navigate("/reset-password", { state: { email: email } }); // Pass email to next page
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Failed to send OTP. Please try again.";
      toast.error(errorMsg);
      setGeneralError(errorMsg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setZodError("");
    setGeneralError("");
    try {
      forgotPasswordSchema.parse({ email });
      resetMutation.mutate({ email });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setZodError(err.errors[0].message);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-page-bg">
      {/* Left Visual Side */}
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
            Locked Out? No Problem. <br /> Quick OTP to regain access.
          </p>
          <div className="mt-16">
            <Mail size={150} strokeWidth={0.75} className="mx-auto text-white/20 opacity-40" />
            <p className="text-xs mt-4 opacity-50 tracking-wider">ILLUSTRATION: SECURE OTP DELIVERY</p>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
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
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main mb-1.5">Forgot Your Password?</h2>
              <p className="text-text-muted text-sm">
                Enter your email address below and we'll send you an OTP to reset your password.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Email Address</Label>
                <Input id="email" name="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setZodError(""); setGeneralError(""); }}
                  className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-3 px-4 border-2 transition-all duration-150 ease-in-out focus:bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${zodError || generalError ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                  placeholder="you@example.com"
                />
                {zodError && <p className="mt-1 text-xs text-destructive">{zodError}</p>}
              </div>

              {generalError && !zodError && <p className="text-sm text-destructive text-center py-2">{generalError}</p>}

              <Button type="submit" disabled={resetMutation.isLoading}
                className="w-full mt-6 flex items-center justify-center py-3 text-sm sm:text-base bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-brand-yellow disabled:opacity-70 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {resetMutation.isLoading ? (
                  <> <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" /> Sending OTP... </>
                ) : (
                  <> <Mail size={18} className="mr-2" /> Send OTP </>
                )}
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-text-muted mt-8">
            © {new Date().getFullYear()} XYZ LTD PM Systems.
          </p>
        </div>
      </div>
    </div>
  );
};