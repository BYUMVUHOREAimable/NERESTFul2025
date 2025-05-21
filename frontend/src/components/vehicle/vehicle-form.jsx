
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { motion } from "framer-motion";
// import { Upload, X, ImageIcon } from "lucide-react"; // Image upload removed for now
import { Car } from "lucide-react"; // Icon for form
// Updated API imports
import {
  createVehicle,
  getMyVehicleById,
  updateMyVehicle,
} from "../../api/vehicles"; // Assuming path
import { Input } from "../ui/input"; // Assuming path
import { Button } from "../ui/button"; // Assuming path
import { Label } from "../ui/label"; // Assuming path
import { Textarea } from "../ui/textarea"; // For 'other_attributes' if you want multi-line
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"; // Assuming path
import { Loader } from "../ui/loader"; // Assuming path
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"; // For enum fields like type and size

// Enum values from your backend schema (important to keep in sync)
const VEHICLE_TYPES = ["CAR", "MOTORCYCLE", "TRUCK", "BICYCLE"];
const VEHICLE_SIZES = ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"];

// Validation schema for Vehicle
const vehicleSchema = z.object({
  plate_number: z
    .string()
    .min(3, "Plate number must be at least 3 characters")
    .max(15, "Plate number too long")
    .regex(
      /^[A-Z0-9-]+$/i,
      "Plate number can only contain letters, numbers, and hyphens."
    ),
  vehicle_type: z.enum(VEHICLE_TYPES, {
    required_error: "Vehicle type is required.",
  }),
  size: z.enum(VEHICLE_SIZES, { required_error: "Vehicle size is required." }),
  other_attributes: z
    .string()
    .optional()
    .transform((val, ctx) => {
      // Store as JSON string, parse before sending
      if (!val || val.trim() === "") return null;
      try {
        return JSON.parse(val);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Other attributes must be valid JSON or empty",
        });
        return z.NEVER;
      }
    })
    .nullable(),
});

export const VehicleForm = ({ isEdit }) => {
  // Pass isEdit prop
  const { id } = useParams(); // Vehicle ID for edit mode
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    plate_number: "",
    vehicle_type: "", // Default to empty or first option
    size: "", // Default to empty or first option
    other_attributes: "", // Input as string, will be parsed to JSON
  });
  const [errors, setErrors] = useState({});

  // Fetch vehicle data if in edit mode
  const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery(
    ["my-vehicle", id], // Query key
    () => getMyVehicleById(id),
    {
      enabled: !!isEdit && !!id, // Only run if isEdit is true and id is present
      onSuccess: (data) => {
        setFormData({
          plate_number: data.plate_number,
          vehicle_type: data.vehicle_type,
          size: data.size,
          other_attributes: data.other_attributes
            ? JSON.stringify(data.other_attributes, null, 2)
            : "",
        });
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Failed to load vehicle details for editing."
        );
        navigate("/my-vehicles"); // Redirect if vehicle not found or error
      },
    }
  );

  // Create vehicle mutation
  const createVehicleMutation = useMutation(createVehicle, {
    onSuccess: () => {
      toast.success("Vehicle added successfully");
      
      queryClient.invalidateQueries("my-vehicles");
      navigate("/my-vehicles");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add vehicle");
    },
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation(
    (data) => updateMyVehicle(id, data),
    {
      onSuccess: () => {
        toast.success("Vehicle updated successfully");
        queryClient.invalidateQueries("my-vehicles");
        queryClient.invalidateQueries(["my-vehicle", id]);
        navigate("/my-vehicles");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update vehicle"
        );
      },
    }
  );

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      // Clear error if user starts typing
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle select change
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    const dataToSubmit = {
      ...formData,
      // Attempt to parse other_attributes if it's not empty
      other_attributes:
        formData.other_attributes.trim() === ""
          ? null
          : formData.other_attributes,
    };

    try {
      const parsedData = vehicleSchema.parse(dataToSubmit);
      // If parsing is successful, parsedData.other_attributes will be an object or null

      const finalPayload = {
        ...parsedData,
        // Ensure plate_number is uppercase before sending to backend
        plate_number: parsedData.plate_number.toUpperCase(),
      };

      if (isEdit) {
        updateVehicleMutation.mutate(finalPayload);
      } else {
        createVehicleMutation.mutate(finalPayload);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please correct the form errors.");
        // Scroll to first error (optional)
      } else {
        // Handle unexpected errors
        toast.error("An unexpected error occurred.");
        console.error("Submission error:", error);
      }
    }
  };

  if (isLoadingVehicle && isEdit) {
    return <Loader />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="max-w-2xl mx-auto">
        {" "}
        {/* Max width for form */}
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="mr-2 h-6 w-6 text-brand-yellow/80" />
            {isEdit ? "Edit Vehicle" : "Add New Vehicle"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {" "}
            {/* Increased spacing */}
            <div>
              <Label htmlFor="plate_number">Plate Number *</Label>
              <Input
                id="plate_number"
                name="plate_number"
                value={formData.plate_number}
                onChange={handleChange}
                className={`mt-1 ${
                  errors.plate_number ? "border-red-500" : ""
                }`}
                placeholder="e.g., ABC-123"
              />
              {errors.plate_number && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.plate_number}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                <Select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onValueChange={(value) =>
                    handleSelectChange("vehicle_type", value)
                  }
                >
                  <SelectTrigger
                    className={`mt-1 ${
                      errors.vehicle_type ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicle_type && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.vehicle_type}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="size">Vehicle Size *</Label>
                <Select
                  name="size"
                  value={formData.size}
                  onValueChange={(value) => handleSelectChange("size", value)}
                >
                  <SelectTrigger
                    className={`mt-1 ${errors.size ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size.charAt(0) + size.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.size && (
                  <p className="text-sm text-red-500 mt-1">{errors.size}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="other_attributes">
                Other Attributes (JSON format)
              </Label>
              <Textarea
                id="other_attributes"
                name="other_attributes"
                value={formData.other_attributes}
                onChange={handleChange}
                rows={4}
                className={`mt-1 font-mono text-sm ${
                  errors.other_attributes ? "border-red-500" : ""
                }`}
                placeholder='e.g., {"color": "Red", "model": "Sedan X"}'
              />
              {errors.other_attributes && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.other_attributes}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter as valid JSON or leave blank. Example:{" "}
                {`{"color": "Blue", "year": 2022}`}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/my-vehicles")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createVehicleMutation.isLoading ||
                updateVehicleMutation.isLoading
              }
              className="bg-brand-yellow/80 hover:bg-brand-yellow/60"
            >
              {createVehicleMutation.isLoading ||
              updateVehicleMutation.isLoading ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEdit ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};
