"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query"; // Added useQueryClient
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, MoreHorizontal, ArrowUpDown, Car, ShieldAlert } from "lucide-react";
import { getAllMyVehicles, deleteMyVehicle } from "../api/vehicles";
import { useAuth } from "../context/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Dialog } from "../components/ui/dialog";
import { Loader } from "../components/ui/loader";
import { Pagination } from "../components/ui/pagination";
import { EmptyState } from "../components/ui/empty-state";
import { Badge } from "../components/ui/badge"; // For potential vehicle status/tags


export const MyVehiclesPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("plate_number");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const canManageVehicles = user?.permissions?.includes("manage_own_vehicles");
  const canListVehicles = user?.permissions?.includes("list_own_vehicles");

  const { data, isLoading, isError, refetch } = useQuery(
    ["my-vehicles", searchQuery, sortBy, sortOrder, currentPage, pageSize],
    () => getAllMyVehicles({
      search: searchQuery.trim(), sortBy, order: sortOrder, page: currentPage, limit: pageSize,
    }),
    {
      keepPreviousData: true,
      enabled: !!isAuthenticated && !!canListVehicles,
      onError: (error) => toast.error(error.response?.data?.message || "Failed to load your vehicles"),
    }
  );

  const vehicles = data?.data || [];
  const paginationInfo = data?.pagination || { totalItems: 0, currentPage: 1, itemsPerPage: 10, totalPages: 1 };


  const deleteVehicleMutation = useMutation(deleteMyVehicle, {
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      queryClient.invalidateQueries("my-vehicles"); // Refetch the list
      setIsDeleteDialogOpen(false);
      setSelectedVehicle(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
    }
  });


  const handleSort = (column) => {
    if (sortBy === column) setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    else { setSortBy(column); setSortOrder("asc"); }
    setCurrentPage(1);
  };

  const handleDelete = () => {
    if (!selectedVehicle) return;
    deleteVehicleMutation.mutate(selectedVehicle.id);
  };

  const openDeleteDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  if (!isAuthenticated && !isLoading) { // Redirect if not authenticated (though ProtectedRoute should handle)
    navigate("/login");
    return <Loader />;
  }

  if (!canListVehicles && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6 bg-page-bg">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-text-main mb-2">Access Denied</h2>
        <p className="text-text-muted mb-6">You do not have permission to view this page.</p>
        <Button onClick={() => navigate('/dashboard')} className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><Loader size="lg" /></div>;

  if (isError) return (
    <div className="text-center py-10 text-destructive"> Error loading vehicles. <Button variant="outline" onClick={() => refetch()}>Retry</Button> </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">My Vehicles</h1>
          <p className="text-sm text-text-muted mt-1">Manage your registered vehicles for parking requests.</p>
        </div>
        {canManageVehicles && (
          <Button
            className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-medium shadow-sm hover:shadow-lg transition-all duration-150 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => navigate("/my-vehicles/new")}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Vehicle
          </Button>
        )}
      </div>

      <Card className="bg-card-bg border border-theme-border-default shadow-lg overflow-hidden rounded-xl">
        <CardHeader className="px-6 py-5 border-b border-theme-border-default/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-text-placeholder" size={18} />
            <Input
              placeholder="Search Plate, Type..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-full bg-input-bg text-text-main placeholder-text-placeholder border-theme-border-input focus:bg-card-bg focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow rounded-lg py-2.5"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0"> {/* Remove padding if table has its own */}
          {vehicles.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Car className="h-16 w-16 text-text-placeholder opacity-50" />}
                title={searchQuery ? "No Vehicles Found" : "No Vehicles Registered"}
                description={searchQuery ? "No vehicles match your search." : "Add your vehicles to start requesting parking slots."}
                action={
                  canManageVehicles && !searchQuery && (
                    <Button className="mt-4 bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand" onClick={() => navigate("/my-vehicles/new")}>
                      <Plus className="mr-2 h-4 w-4" /> Add First Vehicle
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-input-bg/50">
                  <TableRow className="border-b-theme-border-default">
                    {/* Table Headers Updated for Vehicles */}
                    {["Plate Number", "Type", "Size", "Other attributes", "Added On"].map((header, idx) => {
                      const sortKey = header.toLowerCase().replace(" ", "_").replace("#", "number");
                      return (
                        <TableHead key={header} className="px-6 py-3 text-left text-xs font-bold text-text-main uppercase tracking-wider cursor-pointer hover:bg-input-bg" onClick={() => handleSort(sortKey)}>
                          <div className="flex items-center">
                            {header}
                            {sortBy === sortKey && <ArrowUpDown className={`ml-2 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                          </div>
                        </TableHead>
                      );
                    })}
                    <TableHead className="px-6 py-3 text-right text-xs font-bold text-text-main uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card-bg divide-y divide-theme-border-default/50">
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} className="hover:bg-input-bg/30 transition-colors">
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">{vehicle.plate_number}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{vehicle.vehicle_type}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{vehicle.size}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{JSON.stringify(vehicle.other_attributes)}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{new Date(vehicle.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canManageVehicles && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-text-muted hover:text-text-main data-[state=open]:bg-input-bg">
                                <span className="sr-only">Open menu</span> <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-card-bg border-theme-border-default shadow-lg rounded-md">
                              <DropdownMenuItem onClick={() => navigate(`/my-vehicles/${vehicle.id}/edit`)} className="text-text-main hover:!bg-input-bg cursor-pointer">
                                <Edit className="mr-2 h-4 w-4 text-text-muted" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(vehicle)} className="text-destructive hover:!bg-destructive/10 hover:!text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {vehicles.length > 0 && paginationInfo.totalPages > 1 && (
          <CardFooter className="border-t border-theme-border-default/50 px-6 py-4">
            <Pagination
              currentPage={paginationInfo.currentPage}
              totalPages={paginationInfo.totalPages}
              onPageChange={handlePageChange}
            />
          </CardFooter>
        )}
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card-bg border-theme-border-default rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-text-main text-lg font-semibold">Delete Vehicle</DialogTitle>
            <DialogDescription className="text-text-muted mt-1">
              Are you sure you want to delete vehicle <strong className="text-text-main">{selectedVehicle?.plate_number}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-theme-border-input text-text-main hover:bg-input-bg">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteVehicleMutation.isLoading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {deleteVehicleMutation.isLoading && <Loader size="sm" className="mr-2" />}
              Delete Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};