"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, ParkingCircle, Send, DollarSign } from "lucide-react"; // Added DollarSign
import { getAvailableParkingSlots } from "../api/admin-parkings.js";
import { useAuth } from "../context/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Loader } from "../components/ui/loader";
import { Pagination } from "../components/ui/pagination";
import { EmptyState } from "../components/ui/empty-state";
import { Badge } from "../components/ui/badge";
import { RequestSlotModal } from "../components/slot/request-slot-modal";

export const AvailableSlotsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("slot_number");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedSlotForRequest, setSelectedSlotForRequest] = useState(null);

  const canViewAvailableSlots = user?.permissions?.includes(
    "view_available_parking_slots"
  );
  const canRequestSlot = user?.permissions?.includes("request_parking_slot");

  const { data, isLoading, isError, refetch } = useQuery(
    [
      "availableParkingSlots", // Query key
      searchQuery,
      sortBy,
      sortOrder,
      currentPage,
      pageSize,
    ],
    () =>
      getAvailableParkingSlots({
        search: searchQuery.trim(),
        sortBy,
        order: sortOrder,
        page: currentPage,
        limit: pageSize,
        // Backend filters to 'AVAILABLE' for non-admins
      }),
    {
      keepPreviousData: true,
      enabled: !!canViewAvailableSlots,
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
          "Failed to load available parking slots"
        );
      },
    }
  );

  const slots = data?.data || [];
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openRequestModal = (slot) => {
    if (!canRequestSlot) {
      toast.error("You don't have permission to request a slot.");
      return;
    }
    setSelectedSlotForRequest(slot);
    setIsRequestModalOpen(true);
  };

  const getStatusBadge = (status) => {
    if (status === "AVAILABLE") {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200">
          {status}
        </Badge>
      );
    }
    // Fallback for other statuses, though ideally only AVAILABLE are shown here.
    return <Badge variant="outline">{status}</Badge>;
  };

  // --- Permission Check, Loading, Error States (same as your provided code) ---
  if (!canViewAvailableSlots && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive"> {/* Using themed color */}
          You do not have permission to view available slots.
        </p>
        <Button onClick={() => navigate("/dashboard")} className="mt-4 bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="default" colorClassName="border-brand-yellow" /> {/* Themed page loader */}
      </div>
    );
  if (isError)
    return (
      <div className="text-center py-10 text-destructive"> {/* Themed color */}
        Error loading available parking slots.{" "}
        <Button onClick={() => refetch()} variant="outline">Retry</Button>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="container mx-auto py-6 px-4 sm:px-6 lg:px-8" // Added container for padding
    >
      <Card className="bg-card-bg border border-theme-border-default shadow-xl rounded-xl">
        <CardHeader className="pb-4 border-b border-theme-border-default">
          <CardTitle className="text-2xl font-semibold text-text-main">Available Parking Slots</CardTitle>
          <CardDescription className="text-text-muted">
            Browse available slots and request one for your vehicle. Your balance will be checked.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6"> {/* Consistent margin */}
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-text-placeholder"
                size={18}
              />
              <Input
                placeholder="Search by Slot #, Size, Type, Location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-full bg-input-bg text-text-main placeholder-text-placeholder border-theme-border-input focus:bg-card-bg focus:ring-2 focus:ring-focus-brand focus:border-focus-brand rounded-lg"
              />
            </div>
          </div>

          {slots.length === 0 && !searchQuery ? (
            <EmptyState
              icon={<ParkingCircle className="h-16 w-16 text-text-placeholder opacity-70" />}
              title="No Available Slots"
              description="Currently, there are no parking slots available that match your criteria. Please check back later or adjust your search."
            />
          ) : slots.length === 0 && searchQuery ? (
            <EmptyState
              icon={<ParkingCircle className="h-16 w-16 text-text-placeholder opacity-70" />}
              title="No Slots Found"
              description="No available parking slots match your search."
            />
          ) : (
            <>
              <div className="rounded-lg border border-theme-border-default overflow-x-auto">
                <Table>
                  <TableHeader className="bg-input-bg/50"> {/* Subtle header background */}
                    <TableRow>
                      <TableHead className="cursor-pointer text-text-main font-semibold" onClick={() => handleSort("slot_number")}>
                        Slot # {sortBy === "slot_number" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                      </TableHead>
                      <TableHead className="cursor-pointer text-text-main font-semibold" onClick={() => handleSort("size")}>
                        Size {sortBy === "size" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                      </TableHead>
                      <TableHead className="cursor-pointer text-text-main font-semibold" onClick={() => handleSort("vehicle_type")}>
                        Pref. Type {sortBy === "vehicle_type" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                      </TableHead>
                      <TableHead className="cursor-pointer text-text-main font-semibold" onClick={() => handleSort("location")}>
                        Location {sortBy === "location" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                      </TableHead>
                      <TableHead className="cursor-pointer text-text-main font-semibold" onClick={() => handleSort("cost_per_hour")}> {/* ADDED SORT FOR COST */}
                        Cost/Hour {sortBy === "cost_per_hour" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                      </TableHead>
                      <TableHead className="text-text-main font-semibold">Status</TableHead>
                      <TableHead className="text-right text-text-main font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id} className="hover:bg-input-bg/30 transition-colors">
                        <TableCell className="font-medium text-text-main">{slot.slot_number}</TableCell>
                        <TableCell className="text-text-muted">{slot.size}</TableCell>
                        <TableCell className="text-text-muted">{slot.vehicle_type}</TableCell>
                        <TableCell className="text-text-muted">{slot.location || "N/A"}</TableCell>
                        <TableCell className="font-semibold text-text-main"> {/* Display Cost */}
                          {slot.cost_per_hour !== null && slot.cost_per_hour !== undefined
                            ? `$${parseFloat(slot.cost_per_hour).toFixed(2)}`
                            : <Badge variant="secondary">Free</Badge>
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(slot.status)}</TableCell>
                        <TableCell className="text-right">
                          {slot.status === "AVAILABLE" && canRequestSlot && (
                            <Button
                              size="sm"
                              onClick={() => openRequestModal(slot)}
                              className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-medium py-1.5 px-3 rounded-md shadow-sm hover:shadow-md transition-all"
                            >
                              <Send className="mr-1.5 h-4 w-4" />
                              Request
                            </Button>
                          )}
                          {slot.status !== "AVAILABLE" && (
                            <span className="text-xs text-text-placeholder italic">
                              Not Requestable
                            </span>
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

      {/* Request Slot Modal */}
      <RequestSlotModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        parkingSlot={selectedSlotForRequest}
      />
    </motion.div>
  );
};