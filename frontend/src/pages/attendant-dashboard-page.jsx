"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DownloadCloud, CheckCircle, ParkingSquare, CarFront as VehicleIcon } from "lucide-react"; // Added icons
import { VehicleEntryForm } from "../components/attendant/vehicle-entry-form"; // Adjust path
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state"; // Placeholder for empty state component
import { useAuth } from "../context/auth-context";
// Placeholder for future CurrentlyParkedVehiclesList
// import { CurrentlyParkedVehiclesList } from "../../components/attendant/currently-parked-list";

export const AttendantDashboardPage = () => {
    const { user } = useAuth();
    const [lastEntryResult, setLastEntryResult] = useState(null);

    const canRecordEntry = user?.permissions?.includes("record_vehicle_entry");
    // const canViewCurrentlyParked = user?.permissions?.includes("view_current_parked_vehicles");

    const handleEntrySuccess = (data) => { // This function is passed to VehicleEntryForm
        setLastEntryResult(data); // data = { message, vehicleEntry, ticketDownloadUrl }
    };

    if (!canRecordEntry) { // Basic check, could be expanded based on more attendant roles
        return (
            <div className="container mx-auto py-10 text-center text-destructive">
                You do not have sufficient permissions for attendant operations.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8"
        >
            <div className="text-center border-b border-theme-border-default pb-6 mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-text-main tracking-tight">Attendant Gate Operations</h1>
                <p className="text-text-muted mt-2 text-base">Manage vehicle entries and exits efficiently.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Vehicle Entry Section */}
                <section>
                    <VehicleEntryForm onSuccessRecord={handleEntrySuccess} />
                    {lastEntryResult && lastEntryResult.vehicleEntry && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <Card className="bg-green-50 border-green-400/50 shadow-md rounded-xl">
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="flex items-center text-md font-semibold text-green-700">
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Entry Recorded: #{lastEntryResult.vehicleEntry.ticket_number}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-green-800 space-y-1.5 pb-4">
                                    <p><strong>Plate:</strong> {lastEntryResult.vehicleEntry.plate_number}</p>
                                    <p><strong>Time:</strong> {new Date(lastEntryResult.vehicleEntry.entry_time).toLocaleTimeString()}</p>
                                    <p><strong>Parking:</strong> {lastEntryResult.parkingFacility?.name || lastEntryResult.vehicleEntry.parking_id.substring(0, 8)}</p> {/* Display parking name if available */}
                                    {lastEntryResult.ticketDownloadUrl && (
                                        <Button
                                            onClick={() => window.open(lastEntryResult.ticketDownloadUrl, '_blank')}
                                            className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                                            size="sm"
                                        >
                                            <DownloadCloud className="mr-2 h-4 w-4" />
                                            Download Entry Ticket
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </section>

                {/* Currently Parked Vehicles Section (Placeholder for next feature) */}
                <section>
                    <Card className="bg-card-bg border border-theme-border-default shadow-xl rounded-xl">
                        <CardHeader className="pb-4 border-b border-theme-border-input">
                            <CardTitle className="flex items-center text-xl font-semibold text-text-main">
                                <ParkingSquare className="mr-3 h-6 w-6 text-brand-yellow" />
                                Currently Parked
                            </CardTitle>
                            <CardDescription className="text-text-muted text-sm">
                                Overview of vehicles currently in the parking facilities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* {canViewCurrentlyParked ? <CurrentlyParkedVehiclesList /> : <p>No permission.</p>} */}
                            <EmptyState
                                icon={<VehicleIcon className="h-12 w-12 text-text-placeholder opacity-70" />}
                                title="Vehicle Exit & List"
                                description="Functionality to list currently parked vehicles and record their exit will be implemented here."
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </motion.div>
    );
};