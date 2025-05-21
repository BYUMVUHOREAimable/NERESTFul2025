import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, UserCog, Save, ShieldAlert, CheckCheckIcon } from "lucide-react"; // Added icons
import { updateUserProfile } from "../../api/users"; // Ensure this API function is correct
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Loader } from "../ui/loader";
import { Separator } from "../ui/separator"; // For visual separation
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { motion } from "framer-motion";


// Schema for basic profile info (firstName, lastName)
const profileInfoSchema = z.object({
  firstName: z.string().min(2, "First name (min 2 chars).").max(50, "First name too long."),
  lastName: z.string().min(2, "Last name (min 2 chars).").max(50, "Last name too long."),
  // Email is not directly validated here as it's not user-editable in this form
});

// Schema for password change (only if user intends to change)
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password (min 8 characters).") // Adjust complexity as needed
      .regex(/(?=.*[a-z])/, "Must contain a lowercase letter.")
      .regex(/(?=.*[A-Z])/, "Must contain an uppercase letter.")
      .regex(/(?=.*\d)/, "Must contain a digit.")
      .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/, "Special char required."), // Optional
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"], // Error will be attached to confirmPassword field
  });

export const ProfileForm = ({ user }) => { // user prop should contain { id, firstName, lastName, email, ... }
  const queryClient = useQueryClient();
  const [wantsToChangePassword, setWantsToChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "", // Display only
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Populate form data when user prop is available or changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev, // Keep any password fields user might have started typing
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const updateProfileMutation = useMutation(
    (payloadToUpdate) => updateUserProfile(payloadToUpdate), // API function
    {
      onSuccess: (updatedUserData) => {
        toast.success("Profile updated successfully!");
        queryClient.invalidateQueries("currentUser"); // Invalidate query for useAuth or similar
        queryClient.setQueryData("currentUser", updatedUserData); // Optimistically update cache

        setFormData((prev) => ({
          ...prev,
          firstName: updatedUserData.firstName || prev.firstName,
          lastName: updatedUserData.lastName || prev.lastName,
          // Clear password fields after successful update
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setWantsToChangePassword(false); // Reset toggle
        setErrors({}); // Clear any previous errors
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.message || "Failed to update profile.";
        toast.error(errorMsg);
        if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
          setErrors(error.response.data.errors);
        } else {
          setErrors({ general: errorMsg });
        }
      },
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific field error and general error when user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
    // If password changes, clear confirm password error if it was due to mismatch
    if ((name === "newPassword" || name === "confirmPassword") && errors.confirmPassword === "New passwords don't match.") {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleTogglePasswordChange = (e) => {
    const isNowChecked = e.target.checked;
    setWantsToChangePassword(isNowChecked);
    if (!isNowChecked) {
      // Clear password fields and their specific errors if unchecking
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      setErrors(prev => ({
        ...prev,
        currentPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({}); // Clear all previous errors first
    let currentFieldErrors = {};
    let formIsValid = true;

    // Validate basic profile info
    const profileInfoPayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
    };
    const profileInfoResult = profileInfoSchema.safeParse(profileInfoPayload);
    if (!profileInfoResult.success) {
      formIsValid = false;
      profileInfoResult.error.errors.forEach((err) => {
        if (err.path.length > 0) currentFieldErrors[err.path[0]] = err.message;
      });
    }

    // Prepare and validate password data if user intends to change it
    let passwordApiPayload = {};
    if (wantsToChangePassword) {
      const passwordDataToValidate = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      };
      const passwordChangeResult = passwordChangeSchema.safeParse(passwordDataToValidate);
      if (!passwordChangeResult.success) {
        formIsValid = false;
        passwordChangeResult.error.errors.forEach((err) => {
          if (err.path.length > 0) currentFieldErrors[err.path[0]] = err.message;
        });
      } else {
        // Prepare password payload for API (backend might expect different field names)
        passwordApiPayload = {
          current_password: passwordChangeResult.data.currentPassword, // Example: backend expects snake_case
          new_password: passwordChangeResult.data.newPassword,
        };
      }
    }

    if (!formIsValid) {
      setErrors(currentFieldErrors);
      toast.error("Please correct the highlighted errors.");
      return;
    }

    // Combine payloads for API call
    const finalUpdateData = {
      ...(profileInfoResult.success ? profileInfoResult.data : {}), // Validated firstName, lastName
      ...(wantsToChangePassword ? passwordApiPayload : {}), // Validated password fields if applicable
    };

    // Only mutate if there's actually something to update
    if (Object.keys(finalUpdateData).length === 0 && !wantsToChangePassword) {
      toast.info("No changes to save.");
      return;
    }
    if (wantsToChangePassword && Object.keys(passwordApiPayload).length === 0) {
      // This case should be caught by Zod validation of password fields if wantsToChangePassword is true
      toast.error("Please fill in all required password fields to change your password.");
      return;
    }

    updateProfileMutation.mutate(finalUpdateData);
  };

  if (!user) { // If user data prop hasn't loaded yet in the parent page
    return (
      <div className="flex justify-center items-center p-10">
        <Loader size="default" colorClassName="border-brand-yellow" />
        <span className="ml-3 text-text-muted">Loading profile data...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card-bg border border-theme-border-default shadow-xl rounded-xl">
      <CardHeader className="pb-4 border-b border-theme-border-default">
        <CardTitle className="text-2xl font-semibold text-text-main flex items-center">
          <UserCog className="mr-3 h-7 w-7 text-brand-yellow" />
          My Profile
        </CardTitle>
        <CardDescription className="text-text-muted mt-1">
          Update your personal information and password.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-5">
          {errors.general && (
            <div className="p-3 mb-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-center">
              <ShieldAlert size={18} className="mr-2 flex-shrink-0" /> {errors.general}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="firstName" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">First Name *</Label>
              <Input id="firstName" name="firstName" type="text" autoComplete="given-name" value={formData.firstName} onChange={handleChange}
                className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.firstName ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
              />
              {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Last Name *</Label>
              <Input id="lastName" name="lastName" type="text" autoComplete="family-name" value={formData.lastName} onChange={handleChange}
                className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.lastName ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
              />
              {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Email Address</Label>
            <Input id="email" name="email" type="email" value={formData.email} disabled
              className="w-full bg-slate-100 text-slate-500 placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 border-theme-border-input cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-text-muted">Email address cannot be changed here.</p>
          </div>

          <Separator className="my-6 bg-theme-border-input/50" /> {/* Themed Separator */}

          <div className="flex items-center space-x-3 pt-1">
            <div className="flex items-center space-x-3 pt-1">
              <input
                id="changePasswordToggle"
                name="changePasswordToggle" // Good practice to add name attribute
                type="checkbox"
                checked={wantsToChangePassword}
                onChange={handleTogglePasswordChange} // Use the new handler
                className="
                h-4 w-4 sm:h-5 sm:w-5 rounded-sm accent-brand-yellow  /* Key: accent-brand-yellow */
                border-2 border-theme-border-input                     /* Default border */
                text-brand-yellow                                      /* Fallback for some browsers / actual checkmark */
                focus:ring-2 focus:ring-brand-yellow focus:ring-offset-2 focus:ring-offset-card-bg 
                cursor-pointer
              "
              />
              <Label
                htmlFor="changePasswordToggle"
                className="text-sm font-medium text-text-main cursor-pointer select-none"
              >
                I want to change my password
              </Label>
            </div>
          </div>

          {wantsToChangePassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-5 pt-5 border-t border-theme-border-input/50 mt-5 overflow-hidden" // Added border and margin top
            >
              <h3 className="text-md font-semibold text-text-main tracking-wide">Update Your Password</h3>
              <div>
                <Label htmlFor="currentPassword" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Current Password *</Label>
                <div className="relative">
                  <Input id="currentPassword" name="currentPassword" type={showCurrentPassword ? "text" : "password"} autoComplete="current-password" value={formData.currentPassword} onChange={handleChange}
                    className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.currentPassword ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-text-main" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.currentPassword && <p className="mt-1 text-xs text-destructive">{errors.currentPassword}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="newPassword" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">New Password *</Label>
                  <div className="relative">
                    <Input id="newPassword" name="newPassword" type={showNewPassword ? "text" : "password"} autoComplete="new-password" value={formData.newPassword} onChange={handleChange}
                      className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.newPassword ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-text-main" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Confirm New Password *</Label>
                  <div className="relative">
                    <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange}
                      className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.confirmPassword ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-placeholder hover:text-text-main" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end pt-6 border-t border-theme-border-default">
          <Button
            type="submit"
            disabled={updateProfileMutation.isLoading}
            className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-brand-yellow disabled:opacity-70 transition-all"
          >
            {updateProfileMutation.isLoading ? (
              <> <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" /> Saving... </>
            ) : (
              <> <Save size={16} className="mr-2" /> Save Changes </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};