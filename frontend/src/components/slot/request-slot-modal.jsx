"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { Car, Send, Clock, DollarSign, AlertCircle } from "lucide-react"; // Added Clock, DollarSign
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input"; // For duration
import { Loader } from "../ui/loader";
import { getAllMyVehicles } from "../../api/vehicles";
import { createUserSlotRequest } from "../../api/slot-requests";
import { useAuth } from "../../context/auth-context"; // To get user balance

export const RequestSlotModal = ({ isOpen, onClose, parkingSlot }) => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth(); // Get authenticated user for balance
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [expectedDuration, setExpectedDuration] = useState(1); // Default to 1 hour
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [formError, setFormError] = useState("");
  const [balanceError, setBalanceError] = useState("");

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery(
    "myVehiclesForRequestModal",
    () => getAllMyVehicles({ limit: 100 }),
    {
      enabled: isOpen,
      onError: () => toast.error("Could not load your vehicles."),
    }
  );
  const userVehicles = vehiclesData?.data || [];

  const createRequestMutation = useMutation(createUserSlotRequest, {
    onSuccess: () => {
      toast.success(`Slot request for ${parkingSlot?.slot_number} submitted!`);
      queryClient.invalidateQueries("mySlotRequests");
      queryClient.invalidateQueries("availableParkingSlots"); // Re-fetch slots, though status won't change until admin approval
      queryClient.invalidateQueries("userProfile"); // If balance is part of user profile data
      onClose();
    },
    onError: (error) => {
      const errorMsg =
        error.response?.data?.message || "Failed to submit request.";
      // Check for specific balance error from backend (e.g. if backend uses statusCode 402)
      if (
        error.response?.status === 402 ||
        errorMsg.toLowerCase().includes("insufficient balance")
      ) {
        setBalanceError(errorMsg + " Please top up.");
      } else {
        setFormError(errorMsg);
      }
      toast.error(errorMsg);
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedVehicleId("");
      setExpectedDuration(1);
      setFormError("");
      setBalanceError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (parkingSlot?.cost_per_hour && expectedDuration > 0) {
      const cost =
        parseFloat(parkingSlot.cost_per_hour) * parseInt(expectedDuration, 10);
      setCalculatedCost(cost);
    } else {
      setCalculatedCost(0);
    }
  }, [parkingSlot, expectedDuration]);

  const handleSubmitRequest = () => {
    if (!selectedVehicleId) {
      setFormError("Please select a vehicle.");
      return;
    }
    if (expectedDuration <= 0) {
      setFormError("Please enter a valid duration (min 1 hour).");
      return;
    }
    setFormError("");
    setBalanceError("");

    // Frontend balance check (optional, backend will do the authoritative check)
    if (authUser?.balance !== undefined && parkingSlot?.cost_per_hour) {
      const userBalance = parseFloat(authUser.balance);
      if (userBalance < calculatedCost) {
        setBalanceError(
          `Insufficient balance. Required: $${calculatedCost.toFixed(
            2
          )}, Available: $${userBalance.toFixed(
            2
          )}. Please top up your account.`
        );
        return;
      }
    }

    createRequestMutation.mutate({
      vehicle_id: selectedVehicleId,
      parking_slot_id: parkingSlot.id, // User is requesting THIS specific slot
      expected_duration_hours: parseInt(expectedDuration, 10),
    });
  };

  if (!isOpen || !parkingSlot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Send className="mr-2 h-5 w-5 text-brand-yellow" />
            Request Slot:{" "}
            <span className="font-semibold ml-1">
              {parkingSlot.slot_number}
            </span>
          </DialogTitle>
          <DialogDescription>
            Select your vehicle and desired parking duration. Cost:{" "}
            {parkingSlot.cost_per_hour
              ? `$${parseFloat(parkingSlot.cost_per_hour).toFixed(2)}/hour`
              : "Free"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-slate-50 p-3 rounded-md text-sm space-y-1 border border-theme-border-input">
            <p>
              <strong>Slot:</strong> {parkingSlot.slot_number}
            </p>
            <p>
              <strong>Size:</strong> {parkingSlot.size}
            </p>
            <p>
              <strong>Type:</strong> {parkingSlot.vehicle_type}
            </p>
            <p>
              <strong>Location:</strong> {parkingSlot.location || "N/A"}
            </p>
          </div>

          <div>
            <Label
              htmlFor="vehicle-select"
              className="text-sm font-medium text-text-main"
            >
              Vehicle *
            </Label>
            {isLoadingVehicles ? (
              <div className="flex items-center text-sm text-text-muted mt-1">
                <Loader size="h-4 w-4 border-2" className="mr-2" /> Loading...
              </div>
            ) : userVehicles.length === 0 ? (
              <p className="text-sm text-amber-600 mt-1">
                No vehicles registered. Please add one first.
              </p>
            ) : (
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
              >
                <SelectTrigger
                  id="vehicle-select"
                  className={`mt-1 ${
                    formError && !selectedVehicleId
                      ? "border-destructive"
                      : "border-theme-border-input"
                  }`}
                >
                  <SelectValue placeholder="Select your vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {userVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate_number} ({v.vehicle_type} - {v.size})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {formError && !selectedVehicleId && (
              <p className="text-xs text-destructive mt-1">{formError}</p>
            )}
          </div>

          <div>
            <Label
              htmlFor="expected_duration_hours"
              className="text-sm font-medium text-text-main"
            >
              Duration (hours) *
            </Label>
            <Input
              id="expected_duration_hours"
              type="number"
              min="1"
              step="1"
              value={expectedDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setExpectedDuration(val > 0 ? val : 1);
                setFormError(""); // Clear error on change
              }}
              className={`mt-1 bg-input-bg focus:bg-card-bg ${
                formError && expectedDuration <= 0
                  ? "border-destructive"
                  : "border-theme-border-input"
              }`}
            />
            {formError && expectedDuration <= 0 && (
              <p className="text-xs text-destructive mt-1">{formError}</p>
            )}
          </div>

          {parkingSlot.cost_per_hour && expectedDuration > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
              <div className="flex items-center justify-between font-medium">
                <span>Estimated Cost:</span>
                <span className="text-lg">${calculatedCost.toFixed(2)}</span>
              </div>
              {authUser?.balance !== undefined && (
                <p className="text-xs mt-1">
                  Your current balance: $
                  {parseFloat(authUser.balance).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {balanceError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-destructive text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {balanceError}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmitRequest}
            disabled={
              isLoadingVehicles ||
              createRequestMutation.isLoading ||
              userVehicles.length === 0 ||
              !selectedVehicleId ||
              expectedDuration <= 0
            }
            className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand"
          >
            {createRequestMutation.isLoading && (
              <Loader
                size="sm"
                className="mr-2"
                colorClassName="border-text-on-brand"
              />
            )}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
