"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, MoreHorizontal, ArrowUpDown, ParkingSquare, DollarSign } from "lucide-react";
import { adminGetAllParkings, adminDeleteParking } from "../../api/admin-parkings"; // Adjust path
import { useAuth } from "../../context/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Loader } from "../../components/ui/loader";
import { Pagination } from "../../components/ui/pagination";
import { EmptyState } from "../../components/ui/empty-state";
import { Badge } from "../../components/ui/badge"; // If displaying occupancy status as badge

export const AdminParkingManagementPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedParking, setSelectedParking] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    const canManageParkings = user?.permissions?.includes("manage_parkings");

    const { data, isLoading, isError, refetch } = useQuery(
        ["adminParkingFacilities", searchQuery, sortBy, sortOrder, currentPage, pageSize],
        () => adminGetAllParkings({
            search: searchQuery.trim(), sortBy, order: sortOrder, page: currentPage, limit: pageSize,
        }),
        { keepPreviousData: true, enabled: !!canManageParkings, onError: (error) => toast.error(error.response?.data?.message || "Failed to load parking facilities"), }
    );

    const parkings = data?.data || [];
    const pagination = data?.pagination || { totalItems: 0, currentPage: 1, itemsPerPage: 10, totalPages: 1 };

    const handleSort = (column) => {
        if (sortBy === column) setSortOrder(prev => prev === "asc" ? "desc" : "asc");
        else { setSortBy(column); setSortOrder("asc"); }
        setCurrentPage(1);
    };

    const deleteMutation = useMutation(adminDeleteParking, {
        onSuccess: () => {
            toast.success("Parking facility deleted successfully");
            refetch();
            setIsDeleteDialogOpen(false);
            setSelectedParking(null);
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to delete parking facility"),
    });

    const handleDelete = () => {
        if (!selectedParking) return;
        deleteMutation.mutate(selectedParking.id);
    };

    const openDeleteDialog = (parking) => { setSelectedParking(parking); setIsDeleteDialogOpen(true); };
    const handlePageChange = (page) => setCurrentPage(page);

    const calculateAvailabilityPercentage = (parking) => {
        if (!parking || parking.total_spaces <= 0) return 0;
        const available = parking.total_spaces - parking.occupied_spaces;
        return Math.max(0, Math.round((available / parking.total_spaces) * 100));
    };


    if (!canManageParkings && !isLoading) {
        return (
            <div className="text-center py-10"><p className="text-destructive">No permission to manage parkings.</p>
                <Button onClick={() => navigate('/parkings')} className="mt-4 bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand">Go to Dashboard</Button>
            </div>
        );
    }
    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader size="default" /></div>;
    if (isError) return (<div className="text-center py-10 text-destructive">Error loading data. <Button onClick={() => refetch()} variant="outline">Retry</Button></div>);

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Card className="bg-card-bg border border-theme-border-default shadow-xl rounded-xl">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 pb-4 border-b border-theme-border-default">
                    <div>
                        <CardTitle className="text-2xl font-semibold text-text-main">Parking Facility Management</CardTitle>
                        <CardDescription className="text-text-muted mt-1">Add, edit, or remove parking areas and zones.</CardDescription>
                    </div>
                    <Button className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-medium shadow-sm hover:shadow-md" onClick={() => navigate("/admin/parkings/new")}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Facility
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-text-placeholder" size={18} />
                            <Input
                                placeholder="Search by Code, Name, or Location..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10 w-full bg-input-bg text-text-main placeholder-text-placeholder border-theme-border-input focus:bg-card-bg focus:ring-2 focus:ring-focus-brand focus:border-focus-brand rounded-lg"
                            />
                        </div>
                    </div>

                    {parkings.length === 0 && !searchQuery ? (
                        <EmptyState
                            icon={<ParkingSquare className="h-16 w-16 text-text-placeholder opacity-70" />}
                            title="No Parking Facilities"
                            description="Get started by adding your first parking facility or zone."
                            action={<Button className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand" onClick={() => navigate("/admin/parkings/new")}> <Plus className="mr-2 h-4 w-4" /> Add Facility </Button>}
                        />
                    ) : parkings.length === 0 && searchQuery ? (
                        <EmptyState icon={<ParkingSquare className="h-16 w-16 text-text-placeholder opacity-70" />} title="No Facilities Found" description="No parking facilities match your search criteria." />
                    ) : (
                        <>
                            <div className="rounded-lg border border-theme-border-default overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-input-bg/50">
                                        <TableRow>
                                            <TableHead className="text-text-main font-semibold cursor-pointer" onClick={() => handleSort("code")}>Code {sortBy === "code" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}</TableHead>
                                            <TableHead className="text-text-main font-semibold cursor-pointer" onClick={() => handleSort("name")}>Name {sortBy === "name" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}</TableHead>
                                            <TableHead className="text-text-main font-semibold cursor-pointer" onClick={() => handleSort("location")}>Location {sortBy === "location" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}</TableHead>
                                            <TableHead className="text-text-main font-semibold text-center cursor-pointer" onClick={() => handleSort("total_spaces")}>Total Spaces {sortBy === "total_spaces" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}</TableHead>
                                            <TableHead className="text-text-main font-semibold text-center cursor-pointer" onClick={() => handleSort("occupied_spaces")}>Occupied {sortBy === "occupied_spaces" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}</TableHead>
                                            <TableHead className="text-text-main font-semibold text-center">Availability</TableHead>
                                            <TableHead className="text-text-main font-semibold text-right cursor-pointer" onClick={() => handleSort("charge_per_hour")}>Charge/Hr {sortBy === "charge_per_hour" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}</TableHead>
                                            <TableHead className="text-right text-text-main font-semibold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parkings.map((p) => {
                                            const availability = calculateAvailabilityPercentage(p);
                                            let availabilityColor = "text-green-600";
                                            if (availability < 25) availabilityColor = "text-red-600";
                                            else if (availability < 60) availabilityColor = "text-amber-600";
                                            return (
                                                <TableRow key={p.id} className="hover:bg-input-bg/30 transition-colors">
                                                    <TableCell className="font-medium text-text-main py-3">{p.code}</TableCell>
                                                    <TableCell className="text-text-muted py-3">{p.name}</TableCell>
                                                    <TableCell className="text-text-muted py-3">{p.location || "N/A"}</TableCell>
                                                    <TableCell className="text-text-muted py-3 text-center">{p.total_spaces}</TableCell>
                                                    <TableCell className="text-text-muted py-3 text-center">{p.occupied_spaces}</TableCell>
                                                    <TableCell className={`font-semibold py-3 text-center ${availabilityColor}`}>
                                                        {availability}%
                                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 dark:bg-slate-700">
                                                            <div className={`h-1.5 rounded-full ${availability < 25 ? 'bg-red-500' : availability < 60 ? 'bg-amber-500' : 'bg-green-500'
                                                                }`} style={{ width: `${availability}%` }}></div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-text-main font-medium py-3 text-right">${parseFloat(p.charge_per_hour).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right py-3">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 text-text-muted hover:text-text-main"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-card-bg border-theme-border-default shadow-lg">
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/parkings/${p.id}/edit`)} className="hover:bg-input-bg cursor-pointer">
                                                                    <Edit className="mr-2 h-4 w-4 text-text-muted" /> <span className="text-text-main">Edit</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openDeleteDialog(p)} className="text-destructive hover:!bg-destructive/10 hover:!text-destructive cursor-pointer">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> <span>Delete</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md bg-card-bg border-theme-border-default">
                    <DialogHeader>
                        <DialogTitle className="text-text-main">Delete Parking Facility</DialogTitle>
                        <DialogDescription className="text-text-muted">
                            Are you sure you want to delete <strong>{selectedParking?.name || 'this facility'} ({selectedParking?.code})</strong>?
                            This action cannot be undone. Deletion may fail if vehicles are currently parked.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="text-text-main hover:bg-input-bg">Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isLoading}>
                            {deleteMutation.isLoading && <Loader size="sm" className="mr-2" />}
                            Delete Facility
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};