
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { LogIn as VehicleEnterIcon, ParkingSquare, AlertCircle } from "lucide-react"; // Using LogIn for entry
import { recordVehicleEntryApi, getParkingFacilitiesForSelection } from "../../api/vehicle-entries"; // Adjust path
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader } from "../ui/loader";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../ui/card";

const vehicleEntrySchema = z.object({
    plate_number: z.string()
        .min(3, "Plate number (min 3 characters).")
        .max(15, "Plate number (max 15 characters).")
        .regex(/^[A-Z0-9-]+$/i, "Plate number can only contain letters, numbers, and hyphens."),
    parking_id: z.string().uuid("Please select a valid parking facility."),
});

export const VehicleEntryForm = ({ onSuccessRecord }) => { // Renamed prop for clarity
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        plate_number: "",
        parking_id: "",
    });
    const [errors, setErrors] = useState({});

    const {
        data: parkingsData,
        isLoading: isLoadingParkings,
        isError: parkingsFetchError
    } = useQuery(
        "selectableParkingFacilitiesForEntry", // More specific query key
        () => getParkingFacilitiesForSelection({ sortBy: 'code', order: 'asc' }),
        {
            staleTime: 5 * 60 * 1000,
            onError: () => {
                toast.error("Error: Could not load parking facilities list.");
            }
        }
    );
    const parkingOptions = parkingsData?.data || [];

    const entryMutation = useMutation(recordVehicleEntryApi, {
        onSuccess: (data) => {
            toast.success(data.message || "Vehicle entry recorded successfully!");
            queryClient.invalidateQueries("adminParkingFacilities"); // If admin dashboard shows occupancy
            queryClient.invalidateQueries("attendantViewAllParkingFacilities"); // If attendant views occupancy
            queryClient.invalidateQueries("currentlyParkedVehicles"); // For attendant's list of parked cars
            setFormData({ plate_number: "", parking_id: "" });
            setErrors({});
            if (onSuccessRecord) onSuccessRecord(data); // Pass full response data up
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.message || "Failed to record entry.";
            toast.error(errorMsg);
            if (error.response?.data?.errors) { // Field-specific errors from backend
                setErrors(error.response.data.errors);
            } else if (error.response?.status === 400 && errorMsg.toLowerCase().includes("full")) {
                setErrors({ parking_id: errorMsg }); // Assign "full" error to parking_id field
            }
            else {
                setErrors({ general: errorMsg });
            }
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === "plate_number") {
            processedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); // Auto-uppercase and basic sanitize
        }
        setFormData((prev) => ({ ...prev, [name]: processedValue }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
        if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
    };

    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
        if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        const dataToValidate = {
            ...formData,
            plate_number: formData.plate_number.trim(), // Ensure trimming before validation
        };
        const result = vehicleEntrySchema.safeParse(dataToValidate);

        if (!result.success) {
            const fieldErrors = {};
            result.error.errors.forEach((err) => {
                if (err.path.length > 0) fieldErrors[err.path[0]] = err.message;
            });
            setErrors(fieldErrors);
            toast.error("Please correct the form errors.");
            return;
        }
        entryMutation.mutate(result.data);
    };

    return (
        <Card className="w-full max-w-lg bg-card-bg border border-theme-border-default shadow-xl rounded-xl">
            <CardHeader className="pb-4 border-b border-theme-border-input">
                <CardTitle className="flex items-center text-xl font-semibold text-text-main">
                    <VehicleEnterIcon className="mr-3 h-6 w-6 text-brand-yellow" />
                    Record New Vehicle Entry
                </CardTitle>
                <CardDescription className="text-text-muted text-sm">
                    Enter vehicle plate and select parking facility.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="pt-6 space-y-5">
                    <div>
                        <Label htmlFor="plate_number" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Plate Number *</Label>
                        <Input id="plate_number" name="plate_number" value={formData.plate_number} onChange={handleChange}
                            className={`w-full bg-input-bg text-text-main placeholder-text-placeholder rounded-md py-2.5 px-4 border-2 text-base sm:text-lg font-mono tracking-wider
                         focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow 
                         ${errors.plate_number ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}
                            placeholder="ABC-123"
                        />
                        {errors.plate_number && <p className="mt-1 text-xs text-destructive">{errors.plate_number}</p>}
                    </div>

                    <div>
                        <Label htmlFor="parking_id" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Parking Facility/Zone *</Label>
                        {isLoadingParkings ? <div className="flex items-center text-sm text-text-muted mt-2"><Loader size="sm" className="mr-2" /> Loading options...</div> :
                            parkingsFetchError ? <p className="text-sm text-destructive mt-2">Error loading parking facilities.</p> :
                                parkingOptions.length === 0 ? <p className="text-sm text-amber-600 mt-2 flex items-center"><AlertCircle className="h-4 w-4 mr-1.5" />No parking facilities found. Please add one via Admin Panel.</p> :
                                    (
                                        <Select name="parking_id" value={formData.parking_id} onValueChange={(value) => handleSelectChange("parking_id", value)}>
                                            <SelectTrigger className={`w-full mt-1 bg-input-bg text-text-main rounded-md py-2.5 px-4 border-2
                                          focus:bg-card-bg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow 
                                          ${errors.parking_id ? "border-destructive ring-1 ring-destructive/30" : "border-theme-border-input"}`}>
                                                <SelectValue placeholder="Select parking area..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parkingOptions.map((p) => {
                                                    const availableSpaces = p.total_spaces - p.occupied_spaces;
                                                    return (
                                                        <SelectItem key={p.id} value={p.id} disabled={availableSpaces <= 0}>
                                                            {p.name} ({p.code}) -
                                                            <span className={availableSpaces <= 0 ? "text-destructive font-semibold" : "text-green-600 font-semibold"}>
                                                                {availableSpaces > 0 ? ` ${availableSpaces} available` : " Full"}
                                                            </span>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    )}
                        {errors.parking_id && <p className="mt-1 text-xs text-destructive">{errors.parking_id}</p>}
                    </div>

                    {errors.general && <p className="text-sm text-destructive text-center py-2 bg-destructive/10 rounded-md border border-destructive/30">{errors.general}</p>}

                </CardContent>
                <CardFooter className="pt-6 border-t border-theme-border-input">
                    <Button type="submit" disabled={entryMutation.isLoading || isLoadingParkings || parkingOptions.length === 0}
                        className="w-full flex items-center justify-center py-3 text-sm sm:text-base bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-semibold rounded-lg shadow-md">
                        {entryMutation.isLoading && <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" />}
                        Record Entry & Generate Ticket
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};