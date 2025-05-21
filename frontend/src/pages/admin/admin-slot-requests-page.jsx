"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  SendToBack,
  Edit,
  Eye,
  MessageSquare,
  Calendar,
  ParkingCircle,
} from "lucide-react";
import {
  adminGetAllSlotRequests,
  adminResolveSlotRequest,
} from "../../api/slot-requests";
import { getAvailableParkingSlots } from "../../api/admin-parkings.js";
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
  CardDescription,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Loader } from "../../components/ui/loader";
import { Pagination } from "../../components/ui/pagination";
import { EmptyState } from "../../components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";

export const AdminSlotRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("requested_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedRequestToResolve, setSelectedRequestToResolve] =
    useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [manualSlotId, setManualSlotId] = useState("");
  const [resolveFormError, setResolveFormError] = useState("");

  const canManageRequests = user?.permissions?.includes(
    "manage_all_slot_requests"
  );

  const {
    data: requestsData,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    [
      "adminAllSlotRequests",
      searchQuery,
      statusFilter,
      sortBy,
      sortOrder,
      currentPage,
      pageSize,
    ],
    () =>
      adminGetAllSlotRequests({
        search: searchQuery.trim(),
        status: statusFilter === "ALL" ? "" : statusFilter,
        sortBy,
        order: sortOrder,
        page: currentPage,
        limit: pageSize,
      }),
    {
      keepPreviousData: true,
      enabled: !!canManageRequests,
      onError: (error) =>
        toast.error(
          error.response?.data?.message || "Failed to load slot requests"
        ),
    }
  );

  const requests = requestsData?.data || [];
  const pagination = requestsData?.pagination || {
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
  };

  const { data: availableSlotsData, isLoading: isLoadingAvailableSlots } =
    useQuery(
      [
        "availableSlotsForManualAssignment",
        selectedRequestToResolve?.vehicle?.size,
        selectedRequestToResolve?.vehicle?.vehicle_type,
      ],
      () =>
        getAvailableParkingSlots({
          limit: 200,
          ...(selectedRequestToResolve?.vehicle?.size && {
            size: selectedRequestToResolve.vehicle.size,
          }),
          ...(selectedRequestToResolve?.vehicle?.vehicle_type && {
            vehicle_type: selectedRequestToResolve.vehicle.vehicle_type,
          }),
          status: "AVAILABLE",
        }),
      {
        enabled:
          !!isResolveDialogOpen &&
          resolutionStatus === "APPROVED" &&
          !!selectedRequestToResolve,
        // Refetch if the selected request (and thus its vehicle info) changes while dialog is open for approval
      }
    );
  const availableSlotsForSelection = availableSlotsData?.data || [];

  const resolveMutation = useMutation(
    ({ requestId, data }) => adminResolveSlotRequest(requestId, data),
    {
      onSuccess: () => {
        toast.success("Slot request resolved successfully!");
        refetch();
        queryClient.invalidateQueries("availableParkingSlots");
        queryClient.invalidateQueries("admin-parkingSlots"); // Also refetch admin slot list
        setIsResolveDialogOpen(false);
      },
      onError: (error) =>
        toast.error(
          error.response?.data?.message || "Failed to resolve request."
        ),
    }
  );

  useEffect(() => {
    if (!isResolveDialogOpen) {
      setSelectedRequestToResolve(null);
      setAdminNotes("");
      setManualSlotId("");
      setResolutionStatus("");
      setResolveFormError("");
    }
  }, [isResolveDialogOpen]);

  const handleSort = (column) => {
    if (sortBy === column)
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const openResolveDialog = (request, initialStatus) => {
    setSelectedRequestToResolve(request);
    setResolutionStatus(initialStatus);
    setAdminNotes(request.admin_notes || "");
    // If already approved and has a slot, pre-select it, otherwise clear manualSlotId
    setManualSlotId(
      request.status === "APPROVED" && request.parking_slot_id
        ? request.parking_slot_id
        : ""
    );
    setIsResolveDialogOpen(true);
  };

  const handleResolveSubmit = () => {
    if (!selectedRequestToResolve || !resolutionStatus) return;
    setResolveFormError(""); // Clear previous error

    const resolveData = {
      status: resolutionStatus,
      admin_notes: adminNotes,
    };

    if (resolutionStatus === "APPROVED") {
      if (!manualSlotId) {
        setResolveFormError(
          "Please select a parking slot to assign for approval."
        );
        return;
      }
      resolveData.parking_slot_id_manual = manualSlotId;
    }
    resolveMutation.mutate({
      requestId: selectedRequestToResolve.id,
      data: resolveData,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            {status}
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            {status}
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            {status}
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!canManageRequests && !isLoading) {
    /* ... no change ... */
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
        Error loading slot requests.{" "}
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
        <CardHeader>
          <CardTitle>Manage Slot Requests</CardTitle>
          <CardDescription>
            Review, approve, or reject parking slot requests from users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter UI - no change */}
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search by User, Email, or Plate..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value === "ALL" ? "" : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Display - no structural change, only button logic in cells */}
          {requests.length === 0 ? (
            <EmptyState
              icon={<SendToBack className="h-12 w-12 text-gray-400" />}
              title="No Slot Requests Found"
              description={
                searchQuery || statusFilter
                  ? "No requests match your current filters."
                  : "There are currently no slot requests in the system."
              }
            />
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("user_name")}
                      >
                        User{" "}
                        {sortBy === "user_name" && (
                          <ArrowUpDown
                            className={`ml-1 h-3 w-3 ${sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                          />
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("vehicle_plate")}
                      >
                        Vehicle{" "}
                        {sortBy === "vehicle_plate" && (
                          <ArrowUpDown
                            className={`ml-1 h-3 w-3 ${sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                          />
                        )}
                      </TableHead>
                      <TableHead>Assigned Slot</TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("requested_at")}
                      >
                        Requested On{" "}
                        {sortBy === "requested_at" && (
                          <ArrowUpDown
                            className={`ml-1 h-3 w-3 ${sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                          />
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        Status{" "}
                        {sortBy === "status" && (
                          <ArrowUpDown
                            className={`ml-1 h-3 w-3 ${sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                          />
                        )}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div>{req.user.name}</div>
                          <div className="text-xs text-gray-500">
                            {req.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{req.vehicle.plate_number}</div>
                          <div className="text-xs text-gray-500">
                            {req.vehicle.vehicle_type} - {req.vehicle.size}
                          </div>
                        </TableCell>
                        <TableCell>
                          {req.parking_slot
                            ? `${req.parking_slot.slot_number} (${req.parking_slot.location || "N/A"
                            })`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {new Date(req.requested_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-right">
                          {req.status === "PENDING" ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() =>
                                  openResolveDialog(req, "APPROVED")
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="mr-1 h-4 w-4" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  openResolveDialog(req, "REJECTED")
                                }
                              >
                                <XCircle className="mr-1 h-4 w-4" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline">
                              Already resolved
                            </Button>
                          )}
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

      {/* Resolve Request Dialog (Simplified) */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              Resolve Slot Request:{" "}
              {selectedRequestToResolve?.vehicle.plate_number}
            </DialogTitle>
            <DialogDescription>
              {selectedRequestToResolve?.status === "PENDING"
                ? `Review and ${resolutionStatus === "APPROVED"
                  ? "approve by assigning a slot"
                  : "reject"
                } this request.`
                : `Viewing resolved request. You can modify the notes or re-assign slot if it was approved.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1 bg-gray-50 p-3 rounded-md">
              <p>
                <span className="font-medium">User:</span>{" "}
                {selectedRequestToResolve?.user.name} (
                {selectedRequestToResolve?.user.email})
              </p>
              <p>
                <span className="font-medium">Vehicle:</span>{" "}
                {selectedRequestToResolve?.vehicle.plate_number} (
                {selectedRequestToResolve?.vehicle.vehicle_type} /{" "}
                {selectedRequestToResolve?.vehicle.size})
              </p>
              <p>
                <span className="font-medium">Requested:</span>{" "}
                {selectedRequestToResolve?.requested_at
                  ? new Date(
                    selectedRequestToResolve.requested_at
                  ).toLocaleString()
                  : "N/A"}
              </p>
              {selectedRequestToResolve?.status !== "PENDING" &&
                selectedRequestToResolve?.parking_slot && (
                  <p>
                    <span className="font-medium">Currently Assigned:</span>{" "}
                    {selectedRequestToResolve.parking_slot.slot_number}{" "}
                  </p>
                )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolutionStatus">Action</Label>
              <Select
                value={resolutionStatus}
                onValueChange={setResolutionStatus}
                disabled={
                  selectedRequestToResolve?.status !== "PENDING" &&
                  selectedRequestToResolve?.status !==
                  "APPROVED" /* Allow changing approved to rejected */
                }
              >
                <SelectTrigger id="resolutionStatus">
                  {" "}
                  <SelectValue placeholder="Select action" />{" "}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approve</SelectItem>
                  <SelectItem value="REJECTED">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resolutionStatus === "APPROVED" && (
              <div className="space-y-2">
                <Label htmlFor="manualSlotId">Assign Parking Slot *</Label>
                {isLoadingAvailableSlots ? (
                  <p className="text-sm text-gray-500">
                    Loading available slots...
                  </p>
                ) : (
                  <Select value={manualSlotId} onValueChange={setManualSlotId}>
                    <SelectTrigger
                      id="manualSlotId"
                      className={
                        resolveFormError && !manualSlotId
                          ? "border-red-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select a slot to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlotsForSelection.length === 0 && (
                        <SelectItem value="none" disabled>
                          No compatible slots available
                        </SelectItem>
                      )}
                      {availableSlotsForSelection.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.slot_number} ({slot.size} / {slot.vehicle_type}{" "}
                          / {slot.location || "N/A"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {resolveFormError && !manualSlotId && (
                  <p className="text-xs text-red-500 mt-1">
                    {resolveFormError}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  You must select an available slot to approve the request.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Reason for approval/rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResolveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleResolveSubmit}
              disabled={resolveMutation.isLoading}
              className={
                resolutionStatus === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {resolveMutation.isLoading && (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm {resolutionStatus}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
