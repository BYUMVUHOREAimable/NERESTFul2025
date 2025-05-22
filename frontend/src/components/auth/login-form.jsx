import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "react-query";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, LogIn } from "lucide-react"; 
import { loginUser } from "../../api/auth";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Loader } from "../../components/ui/loader";
import { useAuth } from "../../context/auth-context";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().optional(),
});

export const LoginForm = () => { 
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
        navigate("/dashboard", { replace: true }); 
      }
    }
  }, [isAuthenticated, navigate, location.state]);

  const loginMutation = useMutation(loginUser, {
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast.success("Login successful!");
      window.location.href = "/dashboard"; 
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-8 sm:p-10 border border-gray-200/50 bg-gradient-to-b from-white to-gray-50/50">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6 transition-transform duration-200 hover:scale-105">
            <img src="/images/logo2.png" alt="XYZ LTD PMS Logo" className="h-16 sm:h-20 w-auto mx-auto" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">XYZ Parking Management</h1>
          <p className="text-base text-gray-500 mt-2">Sign in to manage your parking system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div>
            <Label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full border rounded-lg py-3 px-4 text-gray-700 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition duration-200 hover:border-teal-400 ${errors.password ? "border-red-500" : "border-gray-300"}`}
                placeholder="Enter your password"
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
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-600"
              />
              <Label htmlFor="rememberMe" className="ml-2 text-base text-gray-700">Remember me</Label>
            </div>
            <Link to="/forgot-password" className="text-teal-600 hover:text-teal-700 hover:underline transition-colors duration-200">Forgot password?</Link>
          </div>

          {errors.general && (
            <p className="text-base text-red-500 text-center py-3 bg-red-50 rounded-lg border border-red-200">
              {errors.general}
            </p>
          )}

          <Button
            type="submit"
            disabled={loginMutation.isLoading}
            className="w-full flex items-center justify-center py-3 text-base text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loginMutation.isLoading ? (
              <> <Loader size="sm" className="mr-2" colorClassName="border-white" /> Signing In... </>
            ) : (
              <> <LogIn size={24} className="mr-2" /> Sign In </>
            )}
          </Button>
          <div className="text-center pt-4">
            <p className="text-base text-gray-500">
              Need an account?{" "}
              <Link to="/register-staff" className="text-teal-600 hover:text-teal-700 hover:underline transition-colors duration-200">Register here</Link>
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