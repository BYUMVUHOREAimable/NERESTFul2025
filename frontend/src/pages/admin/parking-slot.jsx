import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  ParkingCircle,
 
} from "lucide-react";
import {
  adminGetAllParkingSlots,
  adminDeleteParkingSlot,
  
} from "../../api/admin-parkings.js"; 
import { useAuth } from "../../context/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Loader } from "../../components/ui/loader";
import { Pagination } from "../../components/ui/pagination";
import { EmptyState } from "../../components/ui/empty-state";
import { Badge } from "../../components/ui/badge";
import { ParkingSlotForm } from "../../components/admin/AdminParkingFormPage.jsx.jsx";

export const AdminParkingSlotsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
 

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("slot_number");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  
  const [isSlotFormOpen, setIsSlotFormOpen] = useState(false);
  const [editingSlotData, setEditingSlotData] = useState(null); 

  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);

  const canManageSlots = user?.permissions?.includes("manage_parking_slots");

  const { data, isLoading, isError, refetch } = useQuery(
    [
      "adminParkingSlots",
      searchQuery,
      sortBy,
      sortOrder,
      currentPage,
      pageSize,
    ],
    () =>
      adminGetAllParkingSlots({
        search: searchQuery.trim(),
        sortBy,
        order: sortOrder,
        page: currentPage,
        limit: pageSize,
        showAll: true, 
      }),
    {
      keepPreviousData: true,
      enabled: !!canManageSlots,
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to load parking slots"
        );
      },
    }
  );

  const slots = data?.data || [];
  console.log(slots)
  const pagination = data?.pagination || {
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
  };

  const handleSort = (column) => {
    if (sortBy === column)
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSlot) return;
    try {
      await adminDeleteParkingSlot(selectedSlot.id);
      toast.success("Parking slot deleted successfully");
      refetch(); // Refetch after delete
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete parking slot"
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSlot(null);
    }
  };

  const openDeleteDialog = (slot) => {
    setSelectedSlot(slot);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenSlotForm = (slotToEdit = null) => {
    setEditingSlotData(slotToEdit); // null for new, slot object for edit
    setIsSlotFormOpen(true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFormSuccess = () => {
    refetch();
    setIsSlotFormOpen(false);
    setEditingSlotData(null);
    // Also close bulk form if it was open and successful
    setIsBulkFormOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            {status}
          </Badge>
        );
      case "UNAVAILABLE":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            {status}
          </Badge>
        );
      case "MAINTENANCE":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!canManageSlots && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">
          You do not have permission to manage parking slots.
        </p>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  if (isError)
    return (
      <div className="text-center py-10 text-red-500">
        Error loading parking slots.{" "}
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle>Parking Slot Management</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {/* <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setIsBulkFormOpen(true)}
            >
              <GridIcon className="mr-2 h-4 w-4" />
              Bulk Add Slots
            </Button> */}
            <Button
              className="bg-brand-yellow/80 hover:bg-brand-yellow/60"
              onClick={() => handleOpenSlotForm()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search by Slot Number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {slots.length === 0 && !searchQuery ? (
            <EmptyState
              icon={<ParkingCircle className="h-12 w-12 text-gray-400" />}
              title="No parking slots defined"
              description="Get started by adding parking slots to the system."
              action={
                <Button
                  className="bg-brand-yellow/80 hover:bg-brand-yellow/60"
                  onClick={() => handleOpenSlotForm()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slot
                </Button>
              }
            />
          ) : slots.length === 0 && searchQuery ? (
            <EmptyState
              icon={<ParkingCircle className="h-12 w-12 text-gray-400" />}
              title="No slots found"
              description="No parking slots match your search."
            />
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("slot_number")}
                      >
                        <div className="flex items-center">
                          Slot #{" "}
                          {sortBy === "slot_number" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""
                                }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("size")}
                      >
                        <div className="flex items-center">
                          Size{" "}
                          {sortBy === "size" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""
                                }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("vehicle_type")}
                      >
                        <div className="flex items-center">
                          Pref. Type{" "}
                          {sortBy === "vehicle_type" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""
                                }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("location")}
                      >
                        <div className="flex items-center">
                          Location{" "}
                          {sortBy === "location" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""
                                }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center">
                          Status{" "}
                          {sortBy === "status" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""
                                }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center">
                          Created{" "}
                          {sortBy === "created_at" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""
                                }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">
                          {slot.slot_number}
                        </TableCell>
                        <TableCell>{slot.size}</TableCell>
                        <TableCell>{slot.vehicle_type}</TableCell>
                        <TableCell>{slot.location || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(slot.status)}</TableCell>
                        <TableCell>
                          {new Date(slot.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleOpenSlotForm(slot)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(slot)}
                                className="text-red-600 hover:!bg-red-50 hover:!text-red-700"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ParkingSlotForm
        isOpen={isSlotFormOpen}
        onClose={() => {
          setIsSlotFormOpen(false);
          setEditingSlotData(null);
        }}
        onSuccess={handleFormSuccess}
        initialData={editingSlotData}
      />

      {/* <BulkParkingSlotForm
        isOpen={isBulkFormOpen}
        onClose={() => setIsBulkFormOpen(false)}
        onSuccess={handleFormSuccess} // Refetch and close
      /> */}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Parking Slot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this parking slot? This cannot be
              undone. If the slot is in use, consider changing its status first.
            </DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="py-2">
              Deleting slot: <strong>{selectedSlot.slot_number}</strong>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
