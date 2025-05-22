"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { motion } from "framer-motion";
import { ParkingSquare, ArrowLeft, DollarSign } from "lucide-react"; // Changed icon
import {
  adminCreateParking,
  adminGetParkingById,
  adminUpdateParking,
} from "../../api/admin-parkings";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Loader } from "../../components/ui/loader";

// Validation schema for Parking Facility
const parkingFacilitySchema = z.object({
  code: z.string()
    .min(1, "Code is required.")
    .max(10, "Code max 10 chars.")
    .regex(/^[A-Z0-9_-]+$/i, "Code: Letters, numbers, hyphens, underscores."),
  name: z.string().min(3, "Name must be at least 3 characters.").max(100, "Name too long."),
  total_spaces: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number({ invalid_type_error: "Total spaces must be a number." })
      .int("Total spaces must be a whole number.")
      .positive("Total spaces must be positive.")
  ),
  location: z.string().max(100, "Location too long.").optional().nullable().or(z.literal("")),
  charge_per_hour: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : parseFloat(String(val))),
    z.number({ invalid_type_error: "Charge must be a number." })
      .min(0, "Charge cannot be negative.")
      .max(1000, "Charge seems too high.")
      
      .refine(val => val !== null, { message: "Charge per hour is required." })
  ),

});

export const AdminParkingFormPage = ({ isEdit }) => {
  const { id: parkingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    total_spaces: "",
    location: "",
    charge_per_hour: "",
  });
  const [errors, setErrors] = useState({});

  const { data: parkingData, isLoading: isLoadingParking } = useQuery(
    ["adminParkingFacility", parkingId],
    () => adminGetParkingById(parkingId),
    {
      enabled: !!isEdit && !!parkingId,
      onSuccess: (data) => {
        setFormData({
          code: data.code || "",
          name: data.name || "",
          total_spaces: data.total_spaces !== null ? String(data.total_spaces) : "",
          location: data.location || "",
          charge_per_hour: data.charge_per_hour !== null ? String(data.charge_per_hour) : "",
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to load parking facility details.");
        navigate("/admin/parkings");
      }
    }
  );

  const mutationOptions = {
    onSuccess: () => {
      toast.success(`Parking facility ${isEdit ? "updated" : "created"} successfully!`);
      queryClient.invalidateQueries("adminParkingFacilities");
      navigate("/admin/parkings");
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} facility.`;
      toast.error(errorMsg);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: errorMsg });
      }
    },
  };

  const createMutation = useMutation(adminCreateParking, mutationOptions);
  const updateMutation = useMutation((data) => adminUpdateParking(parkingId, data), mutationOptions);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const dataToValidate = {
      ...formData,
      location: formData.location.trim() === "" ? null : formData.location.trim(),
      
    };

    const result = parkingFacilitySchema.safeParse(dataToValidate);

    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => { newErrors[err.path[0]] = err.message; });
      setErrors(fieldErrors);
      toast.error("Please correct the form errors.");
      return;
    }

    const finalPayload = {
      ...result.data,
      code: result.data.code.toUpperCase(), 
    };

    if (isEdit) {
      updateMutation.mutate(finalPayload);
    } else {
      createMutation.mutate(finalPayload);
    }
  };

  if (isLoadingParking && isEdit) {
    return <div className="flex justify-center items-center h-screen"><Loader size="default" /></div>;
  }

  const isLoadingAction = createMutation.isLoading || updateMutation.isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-8 px-4 sm:px-6 lg:px-8"
    >
      <Button variant="outline" onClick={() => navigate("/admin/parkings")} className="mb-6 group text-text-main hover:bg-input-bg">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-150 group-hover:-translate-x-1" />
        Back to Parking Management
      </Button>
      <Card className="max-w-2xl mx-auto bg-card-bg border border-theme-border-default shadow-xl rounded-xl">
        <CardHeader className="pb-4 border-b border-theme-border-default">
          <CardTitle className="flex items-center text-2xl font-semibold text-text-main">
            <ParkingSquare className="mr-3 h-7 w-7 text-brand-yellow" />
            {isEdit ? "Edit Parking Facility" : "Add New Parking Facility"}
          </CardTitle>
          <CardDescription className="text-text-muted">
            {isEdit ? "Update the details of this parking area." : "Define a new parking area, zone, or facility."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="code" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Facility Code *</Label>
                <Input id="code" name="code" value={formData.code} onChange={handleChange}
                  className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.code ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                  placeholder="e.g., P1, ZONE-A"
                />
                {errors.code && <p className="mt-1 text-xs text-destructive">{errors.code}</p>}
              </div>
              <div>
                <Label htmlFor="name" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Facility Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange}
                  className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.name ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                  placeholder="e.g., Main Ground Floor"
                />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="total_spaces" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Total Spaces *</Label>
                <Input id="total_spaces" name="total_spaces" type="number" value={formData.total_spaces} onChange={handleChange}
                  className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.total_spaces ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                  placeholder="e.g., 100" min="1"
                />
                {errors.total_spaces && <p className="mt-1 text-xs text-destructive">{errors.total_spaces}</p>}
              </div>
              <div>
                <Label htmlFor="charge_per_hour" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Charge per Hour *</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <DollarSign className="h-4 w-4 text-text-placeholder" />
                  </div>
                  <Input id="charge_per_hour" name="charge_per_hour" type="number" value={formData.charge_per_hour} onChange={handleChange}
                    className={`w-full pl-9 bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.charge_per_hour ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                    placeholder="e.g., 2.50" step="0.01" min="0"
                  />
                </div>
                {errors.charge_per_hour && <p className="mt-1 text-xs text-destructive">{errors.charge_per_hour}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Location (Optional)</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange}
                className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow ${errors.location ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                placeholder="e.g., Near Main Entrance, Level 2 Section B"
              />
              {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
            </div>

            {errors.general && <p className="text-sm text-destructive text-center py-2 bg-destructive/10 rounded-md border border-destructive/30">{errors.general}</p>}

          </CardContent>
          <CardFooter className="flex justify-end space-x-3 pt-6 border-t border-theme-border-default">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/parkings")} disabled={isLoadingAction} className="text-text-main hover:bg-input-bg">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoadingAction} className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold">
              {isLoadingAction && <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" />}
              {isEdit ? "Save Changes" : "Create Facility"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};