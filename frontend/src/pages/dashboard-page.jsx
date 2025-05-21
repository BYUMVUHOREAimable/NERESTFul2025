import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
// import { getAllItems } from "../api/vehicles";
// import { getAllTransactions } from "../api/slot-requests";
import { getInventorySummary } from "../api/reports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Loader } from "../components/ui/loader";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/auth-context";

const DashboardPage = () => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState({
    totalItems: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalSales: 0,
    totalSalesValue: 0,
    recentTransactions: [],
  });

  const { data: itemsResponse, isLoading: isLoadingItems } = useQuery(
    "dashboard-items",
    getAllItems
  );
  const items = itemsResponse?.data || [];

  const { data: transactionsResponse, isLoading: isLoadingTransactions } =
    useQuery("dashboard-transactions", () =>
      getAllTransactions({
        sortBy: "transaction_date",
        order: "desc",
        limit: 10,
      })
    );
  const transactions = transactionsResponse?.data || [];

  const { data: inventorySummaryResponse, isLoading: isLoadingInventory } =
    useQuery("dashboard-inventory", getInventorySummary);
  const inventorySummary = inventorySummaryResponse?.data || [];
  const inventoryTotals = inventorySummaryResponse?.totals || {
    totalValue: 0,
    totalStock: 0,
    totalItems: 0,
  };

  useEffect(() => {
    if (items.length && transactions.length && inventorySummary.length) {
      const lowStock = items.filter(
        (item) =>
          item.current_stock > 0 &&
          item.current_stock <= (item.reorder_point || 5)
      ).length;

      const outOfStock = items.filter((item) => item.current_stock <= 0).length;

      const salesTransactions = transactions.filter(
        (t) => t.transaction_type === "sale"
      );
      const totalSales = salesTransactions.length;

      const totalSalesValue = salesTransactions.reduce((sum, t) => {
        return sum + Number(t.item?.sale_price || 0) * (t.quantity || 0);
      }, 0);

      setSummaryData({
        totalItems: inventoryTotals.totalItems,
        totalStock: inventoryTotals.totalStock,
        totalValue: inventoryTotals.totalValue,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
        totalSales,
        totalSalesValue,
        recentTransactions: transactions.slice(0, 5),
      });
    }
  }, [items, transactions, inventorySummary, inventoryTotals]);

  if (isLoadingItems || isLoadingTransactions || isLoadingInventory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard Overview
        </h2>
        <p className="text-gray-500">
          Welcome back, {user?.first_name}! Here's your inventory system
          overview.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {summaryData.totalItems}
            </div>
            <p className="text-sm text-blue-700">
              {summaryData.totalStock} units in stock
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              $
              {summaryData.totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-green-700">Total asset value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">
              Total Sales
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {summaryData.totalSales}
            </div>
            <p className="text-sm text-purple-700">
              $
              {summaryData.totalSalesValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              revenue
            </p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${
            summaryData.lowStockItems + summaryData.outOfStockItems > 0
              ? "from-red-50 to-red-100"
              : "from-gray-50 to-gray-100"
          } border-none shadow-md`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Stock Alerts
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                summaryData.lowStockItems + summaryData.outOfStockItems > 0
                  ? "text-red-700"
                  : "text-gray-700"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {summaryData.lowStockItems + summaryData.outOfStockItems}
            </div>
            <p
              className={`text-sm ${
                summaryData.lowStockItems + summaryData.outOfStockItems > 0
                  ? "text-red-700"
                  : "text-gray-700"
              }`}
            >
              {summaryData.outOfStockItems} out, {summaryData.lowStockItems} low
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest inventory movements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summaryData.recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.transaction_type === "sale"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {transaction.transaction_type === "sale" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.item?.item_name || "Unknown Item"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          transaction.transaction_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.quantity} units
                    </p>
                    <Badge
                      variant={
                        transaction.transaction_type === "sale"
                          ? "success"
                          : "default"
                      }
                    >
                      {transaction.transaction_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Analytics</CardTitle>
            <CardDescription>Stock levels and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-blue-100">
                    <BarChart2 className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Average Stock Level
                    </p>
                    <p className="text-xs text-gray-500">Across all items</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.round(
                    summaryData.totalStock / (summaryData.totalItems || 1)
                  )}{" "}
                  units
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-green-100">
                    <TrendingUp className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Stock Turnover Rate
                    </p>
                    <p className="text-xs text-gray-500">Sales velocity</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {(
                    (summaryData.totalSales / (summaryData.totalStock || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Users className="h-4 w-4 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Active Categories
                    </p>
                    <p className="text-xs text-gray-500">Product diversity</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Set(items.map((item) => item.category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
