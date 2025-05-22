import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react";
import { registerStaff } from "../../api/auth";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Loader } from "../../components/ui/loader";
import { useAuth } from "../../context/auth-context";

const staffRegisterSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name too long"),
    lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name too long"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(10, "Password must be at least 10 characters")
      .regex(/(?=.*[a-z])/, "Password must include a lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must include an uppercase letter")
      .regex(/(?=.*\d)/, "Password must include a digit")
      .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/, "Password must include a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["PARKING_ATTENDANT", "ADMIN"], { errorMap: () => ({ message: "Please select a valid role" }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "PARKING_ATTENDANT", // Default role
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const registerMutation = useMutation(registerStaff, {
    onSuccess: (data) => {
      toast.success("Staff account created! Please check your email for verification.");
      navigate("/verify-email", { state: { email: formData.email } });
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMsg);
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
    const { confirmPassword, ...payload } = result.data;
    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-8 sm:p-10 border border-gray-200/50 bg-gradient-to-b from-white to-gray-50/50">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6 transition-transform duration-200 hover:scale-105">
            <img src="/images/logo2.png" alt="XYZ LTD PMS Logo" className="h-16 sm:h-20 w-auto mx-auto" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Create An Account</h1>
          <p className="text-base text-gray-500 mt-2">Register as an Administrator or Attendant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="firstName" className="block text-base font-medium text-gray-700 mb-2">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full border rounded-lg py-3 px-4 text-gray-700 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition duration-200 hover:border-teal-400 ${errors.firstName ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your first name"
            />
            {errors.firstName && <p className="mt-2 text-sm text-red-500">{errors.firstName}</p>}
          </div>
          <div>
            <Label htmlFor="lastName" className="block text-base font-medium text-gray-700 mb-2">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full border rounded-lg py-3 px-4 text-gray-700 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition duration-200 hover:border-teal-400 ${errors.lastName ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your last name"
            />
            {errors.lastName && <p className="mt-2 text-sm text-red-500">{errors.lastName}</p>}
          </div>
          <div>
            <Label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border rounded-lg py-3 px-4 text-gray-700 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition duration-200 hover:border-teal-400 ${errors.email ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your email"
            />
            {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
          </div>
          {/* <div>
            <Label htmlFor="role" className="block text-base font-medium text-gray-700 mb-2">Role</Label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full border rounded-lg py-3 px-4 text-gray-700 text-base bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition duration-200 hover:border-teal-400 ${errors.role ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="PARKING_ATTENDANT">Parking Attendant</option>
              <option value="ADMIN">Administrator</option>
            </select>
            {errors.role && <p className="mt-2 text-sm text-red-500">{errors.role}</p>}
          </div> */}
          <div>
            <Label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full border rounded-lg py-3 px-4 text-gray-700 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition duration-200 hover:border-teal-400 ${errors.password ? "border-red-500" : "border-gray-300"}`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-teal-600 transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700 mb-2">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full border rounded-lg py-3 px-4 text-gray-700 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition duration-200 hover:border-teal-400 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                placeholder="Re-type password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-teal-600 transition-colors duration-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>

          {errors.general && (
            <p className="text-base text-red-500 text-center py-3 bg-red-50 rounded-lg border border-red-200">
              {errors.general}
            </p>
          )}

          <Button
            type="submit"
            disabled={registerMutation.isLoading}
            className="w-full flex items-center justify-center py-3 text-base text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {registerMutation.isLoading ? (
              <> <Loader size="sm" className="mr-2" colorClassName="border-white" /> Creating Account... </>
            ) : (
              <> <UserPlus size={24} className="mr-2" /> Create Staff Account </>
            )}
          </Button>
          <div className="text-center pt-4 flex justify-between items-center">
            <Link to="/login" className="inline-flex items-center text-base text-teal-600 hover:text-teal-700 hover:underline transition-colors duration-200">
              <ArrowLeft size={20} className="mr-2" />
              Back to Sign In
            </Link>
            <p className="text-base text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 hover:underline transition-colors duration-200">Sign in</Link>
            </p>
          </div>
        </form>
        <p className="text-center text-sm text-gray-500 mt-8">
          © {new Date().getFullYear()} XYZ LTD PMS Systems.
        </p>
      </div>
    </div>
  );
};