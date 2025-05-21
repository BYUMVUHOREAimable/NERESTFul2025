"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
    Search, ArrowUpDown, LogOut as VehicleExitIcon, CheckCircle, DownloadCloud, CalendarDays, FilterX, ParkingSquare
} from "lucide-react";
import { listVehicleEntriesApi, recordVehicleExitApi } from "../../api/vehicle-entries"; // Adjust path
import { useAuth } from "../../context/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Loader } from "../../components/ui/loader";
import { Pagination } from "../../components/ui/pagination";
import { EmptyState } from "../../components/ui/empty-state";
import { Badge } from "../../components/ui/badge";
import { Label } from "../ui/label";


export const VehicleExitPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState(""); // For plate number
    const [entryDateFrom, setEntryDateFrom] = useState(""); // YYYY-MM-DD
    const [entryDateTo, setEntryDateTo] = useState("");   // YYYY-MM-DD
    const [sortBy, setSortBy] = useState("entry_time");
    const [sortOrder, setSortOrder] = useState("desc"); // Show newest entries first
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    const [lastExitResult, setLastExitResult] = useState(null);

    // Attendant needs 'view_current_parked_vehicles' and 'record_vehicle_exit'
    const canViewParked = user?.permissions?.includes("view_current_parked_vehicles");
    const canRecordExit = user?.permissions?.includes("record_vehicle_exit");

    const queryKey = ["parkedVehicles", searchQuery, entryDateFrom, entryDateTo, sortBy, sortOrder, currentPage, pageSize];

    const { data: parkedVehiclesData, isLoading, isError, refetch } = useQuery(
        queryKey,
        () => listVehicleEntriesApi({
            status: "PARKED", // Always fetch PARKED vehicles for this page
            plate_number_search: searchQuery.trim(),
            entryDateFrom: entryDateFrom || undefined, // Send undefined if empty
            entryDateTo: entryDateTo || undefined,
            sortBy,
            order: sortOrder,
            page: currentPage,
            limit: pageSize,
        }),
        {
            keepPreviousData: true,
            enabled: !!canViewParked,
            onError: (error) => toast.error(error.response?.data?.message || "Failed to load parked vehicles"),
        }
    );

    const parkedVehicles = parkedVehiclesData?.data || [];
    const pagination = parkedVehiclesData?.pagination || { totalItems: 0, currentPage: 1, itemsPerPage: 10, totalPages: 1 };

    const exitMutation = useMutation(recordVehicleExitApi, {
        onSuccess: (data) => {
            toast.success(data.message || "Vehicle exit recorded!");
            setLastExitResult(data);
            refetch(); // Refetch the list of parked vehicles
            queryClient.invalidateQueries("adminParkingFacilities"); // To update occupied_spaces
            queryClient.invalidateQueries("attendantViewAllParkingFacilities");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to record exit."),
    });

    const handleSort = (column) => { /* ... */ };
    const handlePageChange = (page) => setCurrentPage(page);
    const handleRecordExit = (vehicleEntryId) => {
        if (!canRecordExit) { toast.error("No permission to record exit."); return; }
        setLastExitResult(null);
        exitMutation.mutate(vehicleEntryId);
    };
    const clearFilters = () => {
        setSearchQuery("");
        setEntryDateFrom("");
        setEntryDateTo("");
        setCurrentPage(1); // Reset to first page
        // refetch(); // Not strictly needed as queryKey change will trigger it
    };


    if (!canViewParked && !isLoading) { /* ... Permission denied message ... */ }
    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader size="default" /></div>;
    if (isError) return (<div className="text-center py-10 container mx-auto text-destructive">Error loading data. <Button onClick={() => refetch()} variant="outline">Retry</Button></div>);

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto py-6 px-4">
            <Card className="bg-card-bg border border-theme-border-default shadow-xl rounded-xl">
                <CardHeader className="pb-4 border-b border-theme-border-default">
                    <CardTitle className="text-2xl font-semibold text-text-main">Record Vehicle Exit</CardTitle>
                    <CardDescription className="text-text-muted mt-1">Find currently parked vehicles to record their exit and generate a bill.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {/* Filters Section */}
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="relative">
                            <Label htmlFor="searchPlate" className="text-xs font-semibold text-text-main">Search Plate #</Label>
                            <Search className="absolute left-3 bottom-2.5 text-text-placeholder" size={18} />
                            <Input id="searchPlate" placeholder="e.g., ABC-123" value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value.toUpperCase()); setCurrentPage(1); }}
                                className="pl-10 mt-1 w-full bg-input-bg text-text-main placeholder-text-placeholder border-theme-border-input focus:ring-focus-brand rounded-lg"
                            />
                        </div>
                        <div>
                            <Label htmlFor="entryDateFrom" className="text-xs font-semibold text-text-main">Entry From</Label>
                            <Input id="entryDateFrom" type="date" value={entryDateFrom}
                                onChange={(e) => { setEntryDateFrom(e.target.value); setCurrentPage(1); }}
                                className="mt-1 w-full bg-input-bg text-text-main placeholder-text-placeholder border-theme-border-input focus:ring-focus-brand rounded-lg"
                            />
                        </div>
                        <div>
                            <Label htmlFor="entryDateTo" className="text-xs font-semibold text-text-main">Entry To</Label>
                            <Input id="entryDateTo" type="date" value={entryDateTo}
                                onChange={(e) => { setEntryDateTo(e.target.value); setCurrentPage(1); }}
                                className="mt-1 w-full bg-input-bg text-text-main placeholder-text-placeholder border-theme-border-input focus:ring-focus-brand rounded-lg"
                            />
                        </div>
                        <Button variant="outline" onClick={clearFilters} className="text-text-main hover:bg-input-bg h-10">
                            <FilterX size={16} className="mr-2" /> Clear Filters
                        </Button>
                    </div>

                    {/* Display Last Exit Result */}
                    {lastExitResult && lastExitResult.vehicleEntry && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-blue-50 border border-blue-300/50 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-semibold text-blue-700 flex items-center">
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    Exit Recorded: #{lastExitResult.vehicleEntry.ticket_number} (Plate: {lastExitResult.vehicleEntry.plate_number})
                                </h3>
                                {lastExitResult.billDownloadUrl && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(lastExitResult.billDownloadUrl, '_blank')}
                                        className="border-blue-600 text-blue-600 hover:bg-blue-100"
                                    >
                                        <DownloadCloud className="mr-1.5 h-4 w-4" /> Download Bill
                                    </Button>
                                )}
                            </div>
                            <div className="text-xs text-blue-800 mt-2 space-y-0.5">
                                <p><strong>Duration:</strong> {lastExitResult.vehicleEntry.calculated_duration_minutes} mins</p>
                                <p className="font-semibold"><strong>Amount Charged:</strong> ${parseFloat(lastExitResult.vehicleEntry.charged_amount).toFixed(2)}</p>
                                <p className="text-xs mt-1">{lastExitResult.parkingStatus}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Table of Parked Vehicles */}
                    {parkedVehicles.length === 0 ? (
                        <EmptyState icon={<ParkingSquare className="h-16 w-16 text-text-placeholder opacity-70" />}
                            title="No Vehicles Currently Parked"
                            description={searchQuery || entryDateFrom || entryDateTo ? "No parked vehicles match your filters." : "All parking spots are currently available or no vehicles have entered."} />
                    ) : (
                        <>
                            <div className="rounded-lg border border-theme-border-default overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-input-bg/50">
                                        <TableRow>
                                            <TableHead className="text-text-main font-semibold cursor-pointer" onClick={() => handleSort("plate_number")}>Plate #{sortBy === "plate_number" && <ArrowUpDown className="ml-1 h-3.5 w-3.5" />}</TableHead>
                                            <TableHead className="text-text-main font-semibold cursor-pointer" onClick={() => handleSort("parking.code")}>Parking {sortBy === "parking.code" && <ArrowUpDown className="ml-1 h-3.5 w-3.5" />}</TableHead> {/* Sorting by related field needs backend support */}
                                            <TableHead className="text-text-main font-semibold cursor-pointer" onClick={() => handleSort("entry_time")}>Entry Time {sortBy === "entry_time" && <ArrowUpDown className="ml-1 h-3.5 w-3.5" />}</TableHead>
                                            <TableHead className="text-text-main font-semibold">Ticket #</TableHead>
                                            <TableHead className="text-right text-text-main font-semibold">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parkedVehicles.map((entry) => (
                                            <TableRow key={entry.id} className="hover:bg-input-bg/30">
                                                <TableCell className="font-medium text-text-main py-3">{entry.plate_number}</TableCell>
                                                <TableCell className="text-text-muted py-3">{entry.parking.name} ({entry.parking.code})</TableCell>
                                                <TableCell className="text-text-muted py-3">{new Date(entry.entry_time).toLocaleString()}</TableCell>
                                                <TableCell className="text-text-muted py-3 font-mono text-xs">{entry.ticket_number}</TableCell>
                                                <TableCell className="text-right py-3">
                                                    {canRecordExit && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleRecordExit(entry.id)}
                                                            disabled={exitMutation.isLoading && exitMutation.variables === entry.id}
                                                            className="bg-red-500 hover:bg-red-600 text-white"
                                                        >
                                                            {exitMutation.isLoading && exitMutation.variables === entry.id
                                                                ? <Loader size="sm" colorClassName="border-white" />
                                                                : <VehicleExitIcon className="mr-1.5 h-4 w-4" />
                                                            }
                                                            Record Exit
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {pagination.totalPages > 1 && (<></>)}
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};