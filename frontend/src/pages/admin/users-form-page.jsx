import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { z } from "zod";
import { ArrowLeft, Save, User, Mail, Key, UserCheck } from "lucide-react";
import {
  getUserById,
  createUser,
  updateUser,
  getAllRoles,
} from "../../api/admin";
import { useAuth } from "../../context/auth-context";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader } from "../../components/ui/loader";

// Form validation schema
const userSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().optional(),
  role_id: z.string().min(1, "Role is required"),
});

export const AdminUserFormPage = ({ isEdit }) => {

  console.log(isEdit)
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
  });
  const [errors, setErrors] = useState({});

  // Check permissions
  const canManageUsers = user?.permissions?.includes("manage_all_users");

  // Fetch roles
  const { data: roles = [] } = useQuery("roles", getAllRoles, {
    enabled: canManageUsers,
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to load roles");
    },
  });

  // Fetch user data if editing
  const { data: userData, isLoading: isLoadingUser } = useQuery(
    ["user", id],
    () => getUserById(id),
    {
      enabled: isEdit && !!id && canManageUsers,
      onSuccess: (data) => {
        setFormData({
          name: data.name || "",
          email: data.email || "",
          password: "", 
          role_id: data.role_id?.toString() || "",
        });
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to load user data"
        );
        navigate("/admin/users");
      },
    }
  );

  // Create user mutation
  const createUserMutation = useMutation(createUser, {
    onSuccess: () => {
      toast.success("User created successfully");
      navigate("/admin/users");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create user");
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation((data) => updateUser(id, data), {
    onSuccess: () => {
      toast.success("User updated successfully");
      navigate("/admin/users");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    },
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle role selection
  const handleRoleChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      role_id: value,
    }));
    // Clear error when field is edited
    if (errors.role_id) {
      setErrors((prev) => ({
        ...prev,
        role_id: undefined,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      // Validate form data
      const validationSchema = isEdit
        ? userSchema
            .omit({ password: true })
            .merge(z.object({ password: z.string().optional() }))
        : userSchema;

      validationSchema.parse(formData);

      // Submit form
      if (isEdit) {
        // If password is empty, remove it from the data
        const dataToSubmit = { ...formData };
        if (!dataToSubmit.password) {
          delete dataToSubmit.password;
        }
        updateUserMutation.mutate(dataToSubmit);
      } else {
        createUserMutation.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set form errors
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please fix the errors in the form");
      }
    }
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="py-10">
          <Alert variant="destructive">
            <AlertDescription>
              You don't have permission to manage users.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEdit && isLoadingUser) {
    return <Loader />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/users")}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit User" : "Create New User"}</CardTitle>
          <CardDescription>
            {isEdit
              ? "Update user information and permissions"
              : "Add a new user to the system with appropriate permissions"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">User Information</h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="Enter name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500">{errors.last_name}</p>
                  )}
                </div>
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password{" "}
                  {isEdit ? (
                    "(Leave blank to keep current)"
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <div className="relative">
                  <Key
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder={
                      isEdit
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Role & Permissions</h3>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <UserCheck
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Select
                    value={formData.role_id}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger id="role" className="pl-10">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.role_id && (
                  <p className="text-sm text-red-500">{errors.role_id}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Each role comes with a predefined set
                  of permissions. Admins have full access, Managers can manage
                  inventory and transactions, Buyers can purchase items, and
                  Viewers have read-only access.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/admin/users")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createUserMutation.isLoading || updateUserMutation.isLoading
              }
              className="flex items-center"
            >
              {createUserMutation.isLoading || updateUserMutation.isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? "Update User" : "Create User"}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};
