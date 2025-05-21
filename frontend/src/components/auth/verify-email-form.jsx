import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMutation } from "react-query";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { ArrowLeft, CheckCircle, ParkingCircle, Mail } from "lucide-react"; // Added MailLock
import { verifyEmail as verifyEmailApi } from "../../api/auth"; // Renamed import
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Loader } from "../ui/loader";
// import { Logo } from "../ui/logo";
import { useAuth } from "../../context/auth-context";

const verifyEmailSchema = z.object({
  email: z.string().email("Valid email is required for verification."),
  code: z.string().length(6, "Verification code must be 6 digits.").regex(/^\d{6}$/, "Code must be 6 numeric digits."),
});

export const VerifyEmailForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [formError, setFormError] = useState(""); // For overall form error
  const inputRefs = useRef(Array(6).fill(null).map(() => React.createRef()));

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
    if (location.state?.email) {
      setEmail(location.state.email);
      inputRefs.current[0]?.current?.focus();
    } else {
      toast.error("Email not found for verification. Please try registering again.");
      navigate("/register", { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  const verifyMutation = useMutation(verifyEmailApi, { // Used aliased import
    onSuccess: () => {
      toast.success("Email verified successfully! You can now login.");
      navigate("/login");
    },
    onError: (error) => {
      setFormError(error.response?.data?.message || "Verification failed. Invalid or expired code.");
      toast.error(error.response?.data?.message || "Verification failed. Please try again.");
      setOtpDigits(Array(6).fill("")); // Clear OTP fields on error
      inputRefs.current[0]?.current?.focus();
    },
  });

  const handleOtpChange = (index, value) => {
    const newOtpDigits = [...otpDigits];
    // Allow only single digit, or empty string for deletion
    const digit = value.match(/^\d?$/) ? value : "";
    newOtpDigits[index] = digit;
    setOtpDigits(newOtpDigits);
    setFormError(""); // Clear form error on change

    if (digit && index < 5 && inputRefs.current[index + 1]?.current) {
      inputRefs.current[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtpDigits = [...otpDigits];
      if (newOtpDigits[index]) {
        newOtpDigits[index] = "";
      } else if (index > 0 && inputRefs.current[index - 1]?.current) {
        newOtpDigits[index - 1] = ""; // Also clear previous for easier multi-delete
        inputRefs.current[index - 1].current.focus();
      }
      setOtpDigits(newOtpDigits);
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = Array(6).fill('');
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtpDigits(newOtp);
      const focusIndex = Math.min(5, pastedData.length - 1); // Focus last pasted or last input
      inputRefs.current[focusIndex]?.current?.focus();
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    const joinedOtp = otpDigits.join("");
    setFormError("");

    const result = verifyEmailSchema.safeParse({ email, code: joinedOtp });
    if (!result.success) {
      setFormError(result.error.errors[0].message); // Show first Zod error
      return;
    }
    verifyMutation.mutate({ email, code: joinedOtp });
  };

  if (!email && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-bg">Loading...</div>
    );
  }

  return (
    <div className="flex min-h-screen bg-page-bg">
      {/* Left Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col items-center justify-center bg-golden-hour-gradient p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand-yellow-light/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-yellow-dark/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        <div className="relative z-10 text-center">
          <Link to="/" className="inline-block mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md">
            <img src="/images/logo2.png" alt="ParkWell Logo" className="h-20 w-auto mx-auto opacity-90 drop-shadow-lg" />
            <h1 className="text-5xl font-bold mt-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-yellow-50 to-yellow-100 drop-shadow-sm">
              ParkWell
            </h1>
          </Link>
          <p className="text-xl mt-6 font-light max-w-xs sm:max-w-sm mx-auto leading-relaxed opacity-80">
            One Last Step to Secure Parking. <br /> Let's Confirm It's You.
          </p>
          <div className="mt-16">
            <Mail size={150} strokeWidth={0.75} className="mx-auto text-white/20 opacity-40" />
            <p className="text-xs mt-4 opacity-50 tracking-wider">ILLUSTRATION: EMAIL VERIFICATION</p>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6 lg:hidden">
            <Link to="/">
              <img src="/images/logo2.png" alt="ParkWell Logo" className="h-10 w-auto text-brand-yellow" />
            </Link>
          </div>
          <div className="bg-card-bg shadow-2xl rounded-xl p-8 border border-theme-border-default/20">
            <div className="text-left mb-4">
              <Link to="/register" className="inline-flex items-center text-sm text-link hover:text-link-hover group">
                <ArrowLeft size={16} className="mr-1.5 transition-transform duration-150 group-hover:-translate-x-1" />
                Back to Registration
              </Link>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main mb-1.5">Verify Your Email</h2>
              <p className="text-text-muted text-sm">
                Enter the 6-digit OTP sent to <br />
                <span className="font-medium text-text-main">{email}</span>.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="block text-xs font-semibold text-text-main mb-2 text-center tracking-wide uppercase">Enter OTP Code</Label>
                <div className="flex justify-center space-x-2 sm:space-x-3" onPaste={handlePaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs.current[index]}
                      type="text" // Using text to control input length, pattern handles numeric
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-medium border-2 rounded-lg 
                                    bg-input-bg text-text-main 
                                    focus:bg-card-bg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow
                                    ${formError && otpDigits.join("").length !== 6 ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                      maxLength={1}
                      inputMode="numeric" // Hint for mobile keyboards
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>
                {formError && <p className="mt-2 text-center text-sm text-destructive">{formError}</p>}
              </div>

              <Button
                type="submit"
                disabled={verifyMutation.isLoading || otpDigits.join("").length !== 6}
                className="w-full mt-6 flex items-center justify-center py-3 text-sm sm:text-base bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-brand-yellow disabled:opacity-70 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {verifyMutation.isLoading ? (
                  <> <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" /> Verifying... </>
                ) : (
                  <> <CheckCircle size={18} className="mr-2" /> Verify Email </>
                )}
              </Button>
              <div className="text-center pt-2">
                <p className="text-xs text-text-muted">
                  Didn't receive the code? {/* Add resend functionality here later */}
                  <button type="button" className="font-medium text-link hover:text-link-hover hover:underline ml-1">
                    Resend OTP
                  </button>
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