import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Tag,
  DollarSign,
  ShoppingCart,
  BarChart2,
  Clock,
  ImageIcon,
} from "lucide-react";
// import { getMyVehicleById, deleteMyVehicle } from "../api/vehicles";
// import { getItemTransactions } from "../api/slot-requests";
import { useAuth } from "../context/auth-context";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Loader } from "../components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export const ItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Check permissions
  const canUpdateItem = user?.permissions?.includes("update_item");
  const canDeleteItem = user?.permissions?.includes("delete_item");
  const canViewTransactions = user?.permissions?.includes("read_transactions");

  // Fetch item details
  const {
    data: item,
    isLoading: isLoadingItem,
    isError: isItemError,
  } = useQuery(["item", id], () => getItemById(id), {
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to load item details"
      );
    },
  });

  // Fetch item transactions
  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
  } = useQuery(["item-transactions", id], () => getItemTransactions(id), {
    enabled: canViewTransactions && activeTab === "transactions",
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to load transaction history"
      );
    },
  });

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteItem(id);
      toast.success("Item deleted successfully");
      navigate("/items");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item");
    }
  };

  if (isLoadingItem) {
    return <Loader />;
  }

  if (isItemError || !item) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">
          Error loading item details. Please try again.
        </p>
        <Button onClick={() => navigate("/items")} className="mt-4">
          Back to Items
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/items")}
          className="hover:bg-gray-100 self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Items
        </Button>

        {(canUpdateItem || canDeleteItem) && (
          <div className="flex space-x-2">
            {canUpdateItem && (
              <Button
                onClick={() => navigate(`/items/${id}/edit`)}
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Item
              </Button>
            )}
            {canDeleteItem && (
              <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Item
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="details" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Item Details
          </TabsTrigger>
          {canViewTransactions && (
            <TabsTrigger value="transactions" className="flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Transaction History
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-2xl">{item.item_name}</CardTitle>
                <CardDescription>SKU: {item.SKU}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Unit Price</p>
                      <p className="font-medium">
                        ${Number.parseFloat(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Tag className="mr-2 h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Sale Price</p>
                      <p className="font-medium">
                        ${Number.parseFloat(item.sale_price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Package className="mr-2 h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Current Stock</p>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">
                          {item.current_stock}
                        </span>
                        <Badge
                          className={
                            item.current_stock <= 0
                              ? "bg-red-100 text-red-800"
                              : item.current_stock <= (item.reorder_point || 5)
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {item.current_stock <= 0
                            ? "Out of Stock"
                            : item.current_stock <= (item.reorder_point || 5)
                            ? "Low Stock"
                            : "In Stock"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-gray-600">
                    {item.description || "No description available."}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Additional Details</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span>{item.category || "Uncategorized"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Reorder Point:</span>
                        <span>{item.reorder_point || 5}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span>
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Last Updated:</span>
                        <span>
                          {new Date(item.updated_at).toLocaleDateString()}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Inventory Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Stock Level:</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              item.current_stock <= 0
                                ? "bg-red-500"
                                : item.current_stock <=
                                  (item.reorder_point || 5)
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (item.current_stock /
                                  (item.reorder_point * 2 || 10)) *
                                  100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      {item.current_stock <= (item.reorder_point || 5) &&
                        item.current_stock > 0 && (
                          <p className="text-sm text-yellow-600">
                            This item is below the reorder point. Consider
                            restocking soon.
                          </p>
                        )}
                      {item.current_stock <= 0 && (
                        <p className="text-sm text-red-600">
                          This item is out of stock. Restock immediately.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Item Image</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-6">
                {item.image_url ? (
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.item_name}
                    className="max-w-full max-h-64 object-contain rounded-md"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-md flex flex-col items-center justify-center">
                    <ImageIcon size={48} className="text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No image available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 px-6 py-3">
                <p className="text-xs text-gray-500 w-full text-center">
                  Last updated: {new Date(item.updated_at).toLocaleString()}
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {canViewTransactions && (
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  View all transactions related to this item
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="py-8 flex justify-center">
                    <Loader />
                  </div>
                ) : isTransactionsError ? (
                  <div className="py-8 text-center">
                    <p className="text-red-500">
                      Error loading transactions. Please try again.
                    </p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">
                      No transactions found for this item.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Recorded By</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow
                            key={transaction.id}
                            className="cursor-pointer"
                            onClick={() =>
                              navigate(`/transactions/${transaction.id}`)
                            }
                          >
                            <TableCell>
                              <div className="font-medium">
                                {new Date(
                                  transaction.transaction_date
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(
                                  transaction.transaction_date
                                ).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  transaction.transaction_type === "sale"
                                    ? "bg-blue-100 text-blue-800"
                                    : transaction.transaction_type ===
                                      "initial_stock"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.transaction_type ===
                                      "adjustment_increase"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-orange-100 text-orange-800"
                                }
                              >
                                {transaction.transaction_type === "sale"
                                  ? "Sale"
                                  : transaction.transaction_type ===
                                    "initial_stock"
                                  ? "Initial Stock"
                                  : transaction.transaction_type ===
                                    "adjustment_increase"
                                  ? "Adjustment (Increase)"
                                  : "Adjustment (Decrease)"}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaction.quantity}</TableCell>
                            <TableCell>
                              {transaction.recorded_by?.username || "System"}
                            </TableCell>
                            <TableCell>
                              {transaction.blockchain_tx_hash ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline">Processing</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              You are about to delete <strong>{item.item_name}</strong> (SKU:{" "}
              {item.SKU})
            </p>
            {item.current_stock > 0 && (
              <p className="mt-2 text-amber-600">
                Warning: This item has {item.current_stock} units in stock.
                Deleting it will remove all inventory records.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
