"use client";

import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays } from 'date-fns'; // For date formatting and default dates

import {
    DollarSign, FileText, Users, ParkingSquare, Filter, CalendarDays, ArrowUpDown, Download, FilterX,
    Import
} from "lucide-react";
import {
    getExitedVehiclesReportApi,
    getEnteredVehiclesReportApi,
    getParkingFacilitiesForFilter, // To filter reports by parking
} from "../../api/reports"; // Adjust path
import { useAuth } from "../../context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"; // Shadcn UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Loader } from "../../components/ui/loader";
import { Pagination } from "../../components/ui/pagination";
import { EmptyState } from "../../components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";


// Helper to format date for API (YYYY-MM-DD)
const formatDateForApi = (date) => {
    if (!date) return undefined;
    return format(date, 'yyyy-MM-dd');
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Using toLocaleString for a more user-friendly format including time
    return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const ReportTable = ({ data, columns, isLoading, type }) => {
    if (isLoading) {
        return <div className="flex justify-center items-center py-10"><Loader /></div>;
    }
    if (!data || data.length === 0) {
        return (
            <EmptyState
                icon={<FileText className="h-12 w-12 text-text-placeholder opacity-70" />}
                title={`No ${type} Records Found`}
                description="No vehicle records match your current filter criteria for this period."
            />
        );
    }

    return (
        <div className="rounded-lg border border-theme-border-default overflow-x-auto">
            <Table>
                <TableHeader className="bg-input-bg/50">
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead key={col.accessor} className="text-text-main font-semibold py-3 px-4">
                                {col.Header}
                                {/* Add sorting indicators here if implementing table-level sort */}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, rowIndex) => (
                        <TableRow key={row.id || rowIndex} className="hover:bg-input-bg/30 transition-colors">
                            {columns.map((col) => (
                                <TableCell key={`${col.accessor}-${rowIndex}`} className="text-text-muted py-3 px-4 text-sm">
                                    {col.Cell ? col.Cell({ row }) : row[col.accessor]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};


export const AdminReportsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("exited"); // 'exited' or 'entered'

    // Common filters
    const [dateRange, setDateRange] = useState([subDays(new Date(), 7), new Date()]); // Default to last 7 days
    const [startDate, endDate] = dateRange;
    const [selectedParkingId, setSelectedParkingId] = useState(""); // For filtering by parking

    // Pagination state (could be separate for each tab if desired)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(15); // Report items per page

    // Sorting (could also be tab-specific)
    const [sortBy, setSortBy] = useState(activeTab === "exited" ? "exit_time" : "entry_time");
    const [sortOrder, setSortOrder] = useState("desc");

    const canViewReports = user?.permissions?.includes("view_system_reports");

    const { data: parkingsForFilter, isLoading: isLoadingParkingsFilter } = useQuery(
        "parkingsForReportFilter",
        getParkingFacilitiesForFilter,
        { staleTime: 5 * 60 * 1000 }
    );

    const commonQueryParams = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        order: sortOrder,
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
        parkingId: selectedParkingId || undefined,
    };

    // Query for Exited Vehicles Report
    const {
        data: exitedData,
        isLoading: isLoadingExited,
        isError: isErrorExited,
        refetch: refetchExited
    } = useQuery(
        ["exitedVehiclesReport", commonQueryParams],
        () => getExitedVehiclesReportApi(commonQueryParams),
        {
            enabled: !!canViewReports && activeTab === "exited", keepPreviousData: true,
            onError: (err) => toast.error(err.response?.data?.message || "Failed to load exited vehicles report")
        }
    );

    // Query for Entered Vehicles Report
    const {
        data: enteredData,
        isLoading: isLoadingEntered,
        isError: isErrorEntered,
        refetch: refetchEntered
    } = useQuery(
        ["enteredVehiclesReport", commonQueryParams],
        () => getEnteredVehiclesReportApi(commonQueryParams),
        {
            enabled: !!canViewReports && activeTab === "entered", keepPreviousData: true,
            onError: (err) => toast.error(err.response?.data?.message || "Failed to load entered vehicles report")
        }
    );

    useEffect(() => {
        // Reset sort when tab changes to a more appropriate default
        if (activeTab === "exited") setSortBy("exit_time");
        else setSortBy("entry_time");
        setSortOrder("desc");
        setCurrentPage(1); // Reset page on tab change
    }, [activeTab]);

    const handleApplyFilters = () => {
        setCurrentPage(1); // Reset to page 1 when filters change
        if (activeTab === "exited") refetchExited();
        if (activeTab === "entered") refetchEntered();
    };

    const handleClearFilters = () => {
        setDateRange([subDays(new Date(), 7), new Date()]);
        setSelectedParkingId("");
        setCurrentPage(1);
        // Refetch will be triggered by state change of filters
    };

    const exitedColumns = [
        { Header: "Plate #", accessor: "plate_number" },
        { Header: "Parking", Cell: ({ row }) => `${row.parking?.name || 'N/A'} (${row.parking?.code || 'N/A'})` },
        { Header: "Entry Time", Cell: ({ row }) => formatDate(row.entry_time) },
        { Header: "Exit Time", Cell: ({ row }) => formatDate(row.exit_time) },
        { Header: "Duration (min)", accessor: "calculated_duration_minutes", Cell: ({ row }) => row.calculated_duration_minutes || 'N/A' },
        { Header: "Charge/Hr", Cell: ({ row }) => row.parking?.charge_per_hour ? `$${parseFloat(row.parking.charge_per_hour).toFixed(2)}` : 'N/A' },
        { Header: "Amount Charged", accessor: "charged_amount", Cell: ({ row }) => row.charged_amount ? `$${parseFloat(row.charged_amount).toFixed(2)}` : '$0.00' },
        { Header: "Attendant", Cell: ({ row }) => `${row.recorded_by?.firstName || ''} ${row.recorded_by?.lastName || ''}`.trim() || 'N/A' },
    ];

    const enteredColumns = [
        { Header: "Plate #", accessor: "plate_number" },
        { Header: "Parking", Cell: ({ row }) => `${row.parking?.name || 'N/A'} (${row.parking?.code || 'N/A'})` },
        { Header: "Entry Time", Cell: ({ row }) => formatDate(row.entry_time) },
        { Header: "Status", Cell: ({ row }) => <Badge variant={row.status === "PARKED" ? "info" : "outline"}>{row.status}</Badge> }, // Example status badge
        { Header: "Ticket #", accessor: "ticket_number" },
        { Header: "Attendant", Cell: ({ row }) => `${row.recorded_by?.firstName || ''} ${row.recorded_by?.lastName || ''}`.trim() || 'N/A' },
    ];

    if (!canViewReports && !(isLoadingExited || isLoadingEntered)) {
        return (<div className="text-center py-10 container mx-auto"><p className="text-destructive">You do not have permission to view reports.</p> <Button onClick={() => navigate('/admin/dashboard')} className="mt-4 bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand">Back to Dashboard</Button></div>);
    }

    const currentReportData = activeTab === 'exited' ? exitedData : enteredData;
    const currentIsLoading = activeTab === 'exited' ? isLoadingExited : isLoadingEntered;
    const currentIsError = activeTab === 'exited' ? isErrorExited : isErrorEntered;
    const currentColumns = activeTab === 'exited' ? exitedColumns : enteredColumns;

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto py-6 px-4">
            <Card className="bg-card-bg border border-theme-border-default shadow-xl rounded-xl">
                <CardHeader className="pb-4 border-b border-theme-border-default">
                    <CardTitle className="text-2xl font-semibold text-text-main flex items-center">
                        <FileText className="mr-3 h-7 w-7 text-brand-yellow" />
                        System Reports
                    </CardTitle>
                    <CardDescription className="text-text-muted mt-1">
                        View vehicle entry and exit logs with financial summaries.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mb-6 bg-input-bg rounded-lg p-1">
                            <TabsTrigger value="exited" className="data-[state=active]:bg-brand-yellow data-[state=active]:text-text-on-brand data-[state=active]:shadow-md rounded-md text-text-muted">Exited Vehicles</TabsTrigger>
                            <TabsTrigger value="entered" className="data-[state=active]:bg-brand-yellow data-[state=active]:text-text-on-brand data-[state=active]:shadow-md rounded-md text-text-muted">Entered Vehicles</TabsTrigger>
                        </TabsList>

                        {/* Filter Section */}
                        <div className="mb-6 p-4 border border-theme-border-input rounded-lg bg-input-bg/30 space-y-4">
                            <h3 className="text-sm font-semibold text-text-main mb-2">Filters</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div>
                                    <Label htmlFor="startDate" className="text-xs font-medium text-text-muted">Start Date</Label>
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setDateRange([date, endDate])}
                                        // className prop is key here if you want *some* basic styling
                                        className="w-full mt-1 bg-input-bg text-text-main placeholder:text-text-placeholder-color border-2 border-border-theme-input focus:ring-2 focus:ring-brand-yellow focus:border-border-theme-focus rounded-md py-2 px-3"
                                        // ^ These classes apply directly to the input element generated by DatePicker
                                        dateFormat="MM/dd/yyyy"
                                        placeholderText="Start Date"
                                    // You can also use popperClassName to style the calendar popup container
                                    // popperClassName="your-custom-popper-class"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endDate" className="text-xs font-medium text-text-muted">End Date</Label>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setDateRange([startDate, date])}
                                        selectsEnd
                                        startDate={startDate}
                                        endDate={endDate}
                                        minDate={startDate}
                                        dateFormat="MM/dd/yyyy"
                                        className="w-full mt-1 bg-input-bg text-text-main placeholder-text-placeholder border-theme-border-input focus:ring-focus-brand rounded-md py-2 px-3 focus:border-focus-brand"
                                        placeholderText="End Date"
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <Label htmlFor="parkingFilter" className="text-xs font-medium text-text-muted">Parking Facility</Label>
                                    <Select value={selectedParkingId} onValueChange={setSelectedParkingId}>
                                        <SelectTrigger className="w-full mt-1 bg-input-bg text-text-main border-theme-border-input focus:ring-focus-brand rounded-md">
                                            <SelectValue placeholder="All Parkings" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="some">All Parkings</SelectItem>
                                            {isLoadingParkingsFilter ? <SelectItem value="some" disabled>Loading...</SelectItem> :
                                                parkingsForFilter?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex space-x-2 lg:pt-5">
                                    <Button onClick={handleApplyFilters} className="w-full lg:w-auto bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand" disabled={currentIsLoading}>
                                        <Filter size={16} className="mr-2" />Apply
                                    </Button>
                                    <Button variant="outline" onClick={handleClearFilters} className="w-full lg:w-auto text-text-main hover:bg-input-bg/70" disabled={currentIsLoading}>
                                        <FilterX size={16} className="mr-2" />Clear
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Section */}
                        {currentReportData?.summary && !currentIsLoading && (
                            <Card className="mb-6 bg-amber-50 border-brand-yellow/30 shadow rounded-lg">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-md font-semibold text-amber-700">Report Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="py-3 px-4 text-sm text-amber-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {activeTab === 'exited' && (
                                        <>
                                            <p><strong className="font-medium">Total Vehicles Exited:</strong> {currentReportData.summary.totalVehiclesExited}</p>
                                            <p><strong className="font-medium">Total Revenue:</strong> ${parseFloat(currentReportData.summary.totalRevenue).toFixed(2)}</p>
                                        </>
                                    )}
                                    {activeTab === 'entered' && (
                                        <p><strong className="font-medium">Total Vehicles Entered:</strong> {currentReportData.summary.totalVehiclesEntered}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <TabsContent value="exited" className="mt-0">
                            <ReportTable data={exitedData?.data} columns={exitedColumns} isLoading={isLoadingExited} type="Exited Vehicles" />
                            {exitedData?.pagination?.totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination currentPage={exitedData.pagination.currentPage} totalPages={exitedData.pagination.totalPages} onPageChange={(p) => { setCurrentPage(p); refetchExited(); }} />
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="entered" className="mt-0">
                            <ReportTable data={enteredData?.data} columns={enteredColumns} isLoading={isLoadingEntered} type="Entered Vehicles" />
                            {enteredData?.pagination?.totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination currentPage={enteredData.pagination.currentPage} totalPages={enteredData.pagination.totalPages} onPageChange={(p) => { setCurrentPage(p); refetchEntered(); }} />
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </motion.div>
    );
};