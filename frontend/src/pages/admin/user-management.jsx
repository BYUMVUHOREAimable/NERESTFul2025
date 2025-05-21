import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Plus, Search, Edit, Trash2, MoreHorizontal as MoreHorizontalIcon, Check, Filter, ArrowUpDown, Users, ShieldAlert,
  ChevronLeft, ChevronRight // Icons for pagination
} from "lucide-react";
import {
  getAllUsers, createUser, updateUser, deleteUser, updateUserRole, getAllRoles,
} from "../../api/admin"; // Adjust path if necessary
import { useAuth } from "../../context/auth-context"; // Adjust path if necessary
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"; // Adjust path
import { Button } from "../../components/ui/button"; // Used for "Add User", Modal buttons etc. Adjust path
import { Input } from "../../components/ui/input"; // Adjust path
import { Label } from "../../components/ui/label"; // Adjust path
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"; // Adjust path
import { Badge } from "../../components/ui/badge"; // Adjust path
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"; // Adjust path
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "../../components/ui/dropdown-menu"; // Adjust path
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"; // Adjust path
import { Loader } from "../../components/ui/loader"; // Adjust path
import { EmptyState } from "../../components/ui/empty-state"; // Adjust path

const RoleName = { ADMIN: "ADMIN", USER: "USER" }; // Fallback if not imported from types
// const DEBUG_PREFIX = "[UserManagement DEBUG]"; // Uncomment for debugging

export const UserManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5); // Or your preferred page size

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", roleName: RoleName.USER });

  const canManageUsers = user?.permissions?.includes("manage_users") || user?.role?.name === "ADMIN";

  const { data: usersData, isLoading, isError, error: queryError, refetch } = useQuery(
    ["adminUsers", searchQuery, roleFilter, sortBy, sortOrder, currentPage, pageSize],
    () => getAllUsers({
      search: searchQuery.trim(),
      role: roleFilter === "ALL" || roleFilter === "" ? "" : roleFilter,
      sortBy,
      order: sortOrder,
      page: currentPage,
      limit: pageSize,
    }),
    {
      keepPreviousData: true,
      enabled: !!isAuthenticated && !!canManageUsers,
      onError: (error) => toast.error(error.response?.data?.message || "Failed to load users"),
    }
  );



  useEffect(() => {
    // Initial check for authentication, query's isLoading will handle during fetch
    if (!isAuthenticated && !isLoading) { // isLoading from useQuery hook
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate, isLoading]); // Added isLoading to dependency array



  const usersList = usersData?.data || [];
  const paginationData = usersData?.pagination
    ? { ...usersData.pagination } // Spread to ensure we get all properties
    : { totalItems: 0, currentPage: 1, itemsPerPage: pageSize, totalPages: 1 }; // Default fallback

  const { data: rolesData } = useQuery("adminRolesList", getAllRoles, { enabled: !!canManageUsers });
  const roles = rolesData || [];

  const commonMutationOptions = (actionType) => ({
    onSuccess: () => {
      toast.success(`User ${actionType} successfully`);
      queryClient.invalidateQueries("adminUsers");
      if (actionType.includes("create")) setIsCreateModalOpen(false);
      if (actionType.includes("update") || actionType.includes("edit")) setIsEditModalOpen(false);
      if (actionType.includes("delete")) setIsDeleteModalOpen(false);
      if (actionType.includes("role")) setIsRoleModalOpen(false);
      if (actionType.includes("create")) resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || `Failed to ${actionType.toLowerCase()} user`);
    },
  });

  const createUserMutation = useMutation(createUser, commonMutationOptions("created"));
  const updateUserMutation = useMutation(updateUser, commonMutationOptions("updated"));
  const deleteUserMutation = useMutation(deleteUser, commonMutationOptions("deleted"));
  const updateRoleMutation = useMutation(updateUserRole, commonMutationOptions("role updated for"));

  const resetForm = () => setFormData({ name: "", email: "", password: "", roleName: RoleName.USER });

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setFormData({ name: userToEdit.name, email: userToEdit.email, password: "", roleName: userToEdit.role?.name || RoleName.USER });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (userToDelete) => {
    setSelectedUser(userToDelete);
    setIsDeleteModalOpen(true);
  };

  const openRoleModal = (userToChangeRole) => {
    setSelectedUser(userToChangeRole);
    setFormData(prev => ({ ...prev, name: userToChangeRole.name, email: userToChangeRole.email, password: "", roleName: userToChangeRole.role?.name || RoleName.USER }));
    setIsRoleModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, roleName: value }));
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (selectedUser) updateUserMutation.mutate({ id: selectedUser.id, ...formData });
  };

  const handleDeleteUser = () => {
    if (selectedUser) deleteUserMutation.mutate(selectedUser.id);
  };

  const handleUpdateRole = (e) => {
    e.preventDefault();
    if (selectedUser) updateRoleMutation.mutate({ id: selectedUser.id, roleName: formData.roleName });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (paginationData.totalPages || 1) && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(column); setSortOrder("asc"); }
    setCurrentPage(1); // Reset to first page on sort
  };

  const getRoleBadgeColor = (roleName) => {
    const upperRoleName = roleName?.toUpperCase();
    switch (upperRoleName) {
      case "ADMIN": return "bg-red-500/10 text-red-700 border-red-500/30";
      case "USER": return "bg-sky-500/10 text-sky-700 border-sky-500/30";
      // Add more cases for other roles like VIEWER, BUYER if needed
      case "VIEWER": return "bg-indigo-500/10 text-indigo-700 border-indigo-500/30";
      case "BUYER": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
      default: return "bg-slate-500/10 text-slate-700 border-slate-500/30";
    }
  };

  const getStatusBadgeColor = (isVerified) => {
    return isVerified ? "bg-green-500/10 text-green-700 border-green-500/30" : "bg-amber-500/10 text-amber-700 border-amber-500/30";
  };

  // --- PAGINATION UI RENDERING LOGIC (FROM SCRATCH) ---
  const renderPaginationControls = () => {
    if (!paginationData || paginationData.totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 5;

      if (paginationData.totalPages <= maxPagesToShow) {
        for (let i = 1; i <= paginationData.totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        let start = Math.max(2, paginationData.currentPage - 1);
        let end = Math.min(paginationData.totalPages - 1, paginationData.currentPage + 1);
        if (paginationData.currentPage <= 2) end = 4;
        if (paginationData.currentPage >= paginationData.totalPages - 1) start = paginationData.totalPages - 3;
        if (start > 2) pageNumbers.push("ellipsis");
        for (let i = start; i <= end; i++) pageNumbers.push(i);
        if (end < paginationData.totalPages - 1) pageNumbers.push("ellipsis");
        pageNumbers.push(paginationData.totalPages);
      }
      return pageNumbers.filter((item, index, arr) => item !== "ellipsis" || arr[index - 1] !== "ellipsis");
    };

    const pageNumbersToDisplay = getPageNumbers();
    const baseButtonClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    const activeActionClasses = "bg-brand-yellow/80 text-white shadow hover:bg-brand-yellow/60";
    const outlineClasses = "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground";
    const pageNumberButtonSize = "h-9 w-9 px-3";
    const navButtonSize = "h-9 px-3";

    return (
      <div className="flex items-center justify-center space-x-2">
        <button
          type="button"
          onClick={() => handlePageChange(paginationData.currentPage - 1)}
          disabled={paginationData.currentPage === 1}
          className={`${baseButtonClasses} ${activeActionClasses} ${navButtonSize} hidden sm:inline-flex`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1">Previous</span>
        </button>
        <button
          type="button"
          onClick={() => handlePageChange(paginationData.currentPage - 1)}
          disabled={paginationData.currentPage === 1}
          className={`${baseButtonClasses} ${outlineClasses} ${pageNumberButtonSize} sm:hidden`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-1">
          {pageNumbersToDisplay.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className={`${baseButtonClasses} ${outlineClasses} ${pageNumberButtonSize} cursor-default opacity-50`}
                >
                  <MoreHorizontalIcon className="h-4 w-4" />
                </div>
              );
            }
            const isActive = paginationData.currentPage === page;
            return (
              <button
                type="button"
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={isActive}
                className={`${baseButtonClasses} ${pageNumberButtonSize} ${isActive ? activeActionClasses + " cursor-default" : outlineClasses
                  }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handlePageChange(paginationData.currentPage + 1)}
          disabled={paginationData.currentPage === paginationData.totalPages}
          className={`${baseButtonClasses} ${activeActionClasses} ${navButtonSize} hidden sm:inline-flex`}
        >
          <span className="mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handlePageChange(paginationData.currentPage + 1)}
          disabled={paginationData.currentPage === paginationData.totalPages}
          className={`${baseButtonClasses} ${outlineClasses} ${pageNumberButtonSize} sm:hidden`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };
  // --- END OF PAGINATION UI RENDERING LOGIC ---


  // Loading and Error States
  if (!isAuthenticated && isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader size="lg" colorClassName="border-brand-yellow" /></div>;
  }
  if (!canManageUsers && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6 bg-page-bg">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-text-main mb-2">Access Denied</h2>
        <p className="text-text-muted mb-6">You do not have permission to manage users.</p>
        <Button onClick={() => navigate('/dashboard')} className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand">Go to Dashboard</Button>
      </div>
    );
  }
  // This loader shows if the query is loading AND there's no existing usersData (e.g., first load or after cache clear)
  if (isLoading && !usersData) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader size="lg" colorClassName="border-brand-yellow" /></div>;
  }
  // This error shows if the query failed AND there's no existing usersData to display
  if (isError && !usersData) {
    return (
      <div className="p-6 text-center text-destructive bg-card-bg rounded-lg shadow-md">
        Error loading users. Please try again. {queryError?.message ? `Details: ${queryError.message}` : ""}
        <Button onClick={() => refetch()} variant="outline" className="ml-2 border-theme-border-input text-text-main hover:bg-input-bg">Retry</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">User Management</h1>
          <p className="text-sm text-text-muted mt-1">Administer user accounts, roles, and permissions.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand font-medium shadow-sm hover:shadow-lg px-5 py-2.5 rounded-lg">
          <Plus className="mr-2 h-5 w-5" /> Add User
        </Button>
      </div>

      <Card className="bg-card-bg border border-theme-border-default shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 border-b border-theme-border-default/50 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
          <div className="relative flex-grow w-full md:flex-grow-0 md:w-auto md:min-w-[250px] lg:min-w-[300px]">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-text-placeholder" size={16} />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-full h-10 bg-input-bg text-text-main placeholder-text-placeholder border-2 border-theme-border-input focus:bg-card-bg focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow rounded-md"
            />
          </div>
          <div className="w-full md:w-auto md:min-w-[180px]">
            <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full h-10 bg-input-bg text-text-main border-2 border-theme-border-input data-[placeholder]:text-text-placeholder focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow rounded-md">
                <Filter className="mr-2 h-3.5 w-3.5 text-text-placeholder" />
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent className="bg-card-bg border-theme-border-default text-text-main">
                <SelectItem value="none" className="hover:!bg-input-bg focus:!bg-input-bg">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id || role.name} value={role.name} className="hover:!bg-input-bg focus:!bg-input-bg">
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Loader specifically for when transitioning pages and usersList might be temporarily empty due to keepPreviousData */}
          {(isLoading && usersList.length === 0 && currentPage > 1 && usersData?.pagination?.totalItems > 0) ? (
            <div className="flex justify-center items-center h-60"><Loader colorClassName="border-brand-yellow" /></div>
          ) : usersList.length === 0 ? ( // Empty state for no users at all, or no search results
            <div className="p-10">
              <EmptyState
                icon={<Users className="h-16 w-16 text-text-placeholder opacity-30" />}
                title={searchQuery || roleFilter ? "No Users Found" : "No Users Yet"}
                description={searchQuery || roleFilter ? "Adjust your search or filter criteria." : "Create the first user to get started with management."}
                action={!searchQuery && !roleFilter && (
                  <Button className="mt-6 bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand" onClick={openCreateModal}>
                    <Plus className="mr-2 h-4 w-4" /> Add First User
                  </Button>
                )}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-input-bg/20">
                  <TableRow className="border-b-theme-border-default">
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-text-main uppercase tracking-wider sm:px-6 w-[50px]">#</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-text-main uppercase tracking-wider cursor-pointer hover:bg-input-bg/50 sm:px-6" onClick={() => handleSort("name")}>
                      Name {sortBy === "name" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 inline text-brand-yellow ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-text-main uppercase tracking-wider cursor-pointer hover:bg-input-bg/50 sm:px-6" onClick={() => handleSort("email")}>
                      Email {sortBy === "email" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 inline text-brand-yellow ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-text-main uppercase tracking-wider cursor-pointer hover:bg-input-bg/50 sm:px-6" onClick={() => handleSort("role")}>
                      Role {sortBy === "role" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 inline text-brand-yellow ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-text-main uppercase tracking-wider sm:px-6">Verification</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-text-main uppercase tracking-wider cursor-pointer hover:bg-input-bg/50 sm:px-6" onClick={() => handleSort("created_at")}>
                      Created At {sortBy === "created_at" && <ArrowUpDown className={`ml-1 h-3.5 w-3.5 inline text-brand-yellow ${sortOrder === "desc" ? "rotate-180" : ""}`} />}
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold text-text-main uppercase tracking-wider sm:px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card-bg divide-y divide-theme-border-default/20">
                  {usersList.map((userItem, index) => (
                    <TableRow key={userItem.id} className="hover:bg-input-bg/10 transition-colors duration-150">
                      <TableCell className="px-4 py-3.5 whitespace-nowrap text-sm text-text-muted sm:px-6">{(paginationData.currentPage - 1) * paginationData.itemsPerPage + index + 1}</TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-text-main sm:px-6">{userItem.name}</TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap text-sm text-text-muted sm:px-6">{userItem.email}</TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap text-sm sm:px-6">
                        <Badge className={getRoleBadgeColor(userItem.role?.name)} variant="outline" >
                          {userItem.role?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap text-sm sm:px-6">
                        <Badge className={getStatusBadgeColor(userItem.email_verified)} variant="outline">
                          {userItem.email_verified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap text-sm text-text-muted sm:px-6">{new Date(userItem.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium sm:px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-text-muted hover:text-text-main data-[state=open]:bg-input-bg/30 rounded-md"><MoreHorizontalIcon className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card-bg border-theme-border-default shadow-lg rounded-md p-1">
                            <DropdownMenuItem onClick={() => openEditModal(userItem)} className="text-text-main hover:!bg-input-bg focus:!bg-input-bg cursor-pointer rounded text-sm p-2"><Edit className="mr-2 h-4 w-4 text-text-muted" /> Edit User</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRoleModal(userItem)} className="text-text-main hover:!bg-input-bg focus:!bg-input-bg cursor-pointer rounded text-sm p-2"><Check className="mr-2 h-4 w-4 text-text-muted" /> Change Role</DropdownMenuItem>
                            {user?.id !== userItem.id &&
                              <DropdownMenuItem onClick={() => openDeleteModal(userItem)} className="text-destructive hover:!bg-destructive/10 hover:!text-destructive focus:!bg-destructive/10 focus:!text-destructive cursor-pointer rounded text-sm p-2"><Trash2 className="mr-2 h-4 w-4" /> Delete User</DropdownMenuItem>
                            }
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {paginationData.totalPages > 1 && (
          <CardFooter className="border-t border-theme-border-default/50 px-4 sm:px-6 py-3 bg-input-bg/10 flex justify-center">
            {renderPaginationControls()}
          </CardFooter>
        )}
      </Card>

      {/* --- MODALS --- */}
      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-card-bg border-theme-border-default sm:max-w-lg rounded-lg shadow-xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-theme-border-default/30">
            <DialogTitle className="text-text-main text-xl font-semibold">Create New User</DialogTitle>
            <DialogDescription className="text-text-muted text-sm mt-1">Enter details and assign a role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-5 p-6">
              <div>
                <Label htmlFor="create-name" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Name</Label>
                <Input id="create-name" name="name" value={formData.name} onChange={handleChange} required className="h-10 bg-input-bg border-2 border-theme-border-input focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow rounded-md" />
              </div>
              <div>
                <Label htmlFor="create-email" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Email</Label>
                <Input id="create-email" name="email" type="email" value={formData.email} onChange={handleChange} required className="h-10 bg-input-bg border-2 border-theme-border-input focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow rounded-md" />
              </div>
              <div>
                <Label htmlFor="create-password" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Password</Label>
                <Input id="create-password" name="password" type="password" value={formData.password} onChange={handleChange} required className="h-10 bg-input-bg border-2 border-theme-border-input focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow rounded-md" />
              </div>
              <div>
                <Label htmlFor="create-role" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Role</Label>
                <Select value={formData.roleName} onValueChange={handleRoleSelectChange}>
                  <SelectTrigger id="create-role" className="w-full h-10 bg-input-bg border-2 border-theme-border-input data-[placeholder]:text-text-placeholder focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow rounded-md">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-card-bg border-theme-border-default text-text-main">
                    {roles.map((role) => (<SelectItem key={role.id || role.name} value={role.name} className="hover:!bg-input-bg focus:!bg-input-bg">{role.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="px-6 pt-4 pb-6 border-t border-theme-border-default/30 bg-input-bg/20 rounded-b-lg">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="border-theme-border-input text-text-main hover:bg-input-bg">Cancel</Button>
              <Button type="submit" disabled={createUserMutation.isLoading} className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand">
                {createUserMutation.isLoading && <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" />} Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card-bg border-theme-border-default sm:max-w-lg rounded-lg shadow-xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-theme-border-default/30">
            <DialogTitle className="text-text-main text-xl font-semibold">Edit User: {selectedUser?.name}</DialogTitle>
            <DialogDescription className="text-text-muted text-sm mt-1">Update details. Password is optional.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="grid gap-5 p-6">
              <div><Label htmlFor="edit-name" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Name</Label><Input id="edit-name" name="name" value={formData.name} onChange={handleChange} required className="h-10 bg-input-bg border-2 border-theme-border-input focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow rounded-md" /></div>
              <div><Label htmlFor="edit-email" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">Email</Label><Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleChange} required className="h-10 bg-input-bg border-2 border-theme-border-input focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow rounded-md" /></div>
              <div><Label htmlFor="edit-password" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">New Password <span className="text-text-muted normal-case text-xs font-normal">(Optional)</span></Label><Input id="edit-password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" className="h-10 bg-input-bg border-2 border-theme-border-input focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow rounded-md" /></div>
            </div>
            <DialogFooter className="px-6 pt-4 pb-6 border-t border-theme-border-default/30 bg-input-bg/20 rounded-b-lg">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-theme-border-input text-text-main hover:bg-input-bg">Cancel</Button>
              <Button type="submit" disabled={updateUserMutation.isLoading} className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand">
                {updateUserMutation.isLoading && <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" />} Update User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-card-bg border-theme-border-default sm:max-w-md rounded-lg shadow-xl">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-destructive text-xl font-semibold">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-text-muted text-sm mt-1">Delete <strong className="text-text-main">{selectedUser?.name}</strong> ({selectedUser?.email})?</DialogDescription>
          </DialogHeader>
          <div className="p-6 text-sm text-text-muted">This action cannot be undone and will permanently remove the user.</div>
          <DialogFooter className="px-6 pt-4 pb-6 border-t border-theme-border-default/30 bg-input-bg/20 rounded-b-lg">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="border-theme-border-input text-text-main hover:bg-input-bg">Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteUser} disabled={deleteUserMutation.isLoading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {deleteUserMutation.isLoading && <Loader size="sm" className="mr-2" colorClassName="border-destructive-foreground" />} Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="bg-card-bg border-theme-border-default sm:max-w-md rounded-lg shadow-xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-theme-border-default/30">
            <DialogTitle className="text-text-main text-xl font-semibold">Change User Role</DialogTitle>
            <DialogDescription className="text-text-muted text-sm mt-1">
              Update role for <strong className="text-text-main">{selectedUser?.name}</strong>.
              Current: <Badge className={getRoleBadgeColor(selectedUser?.role?.name)} variant="outline">{selectedUser?.role?.name}</Badge>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRole}>
            <div className="p-6">
              <Label htmlFor="change-role" className="block text-xs font-semibold text-text-main mb-1.5 tracking-wide uppercase">New Role</Label>
              <Select value={formData.roleName} onValueChange={handleRoleSelectChange}>
                <SelectTrigger id="change-role" className="w-full h-10 bg-input-bg border-2 border-theme-border-input data-[placeholder]:text-text-placeholder focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow rounded-md">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent className="bg-card-bg border-theme-border-default text-text-main">
                  {roles.map((role) => (<SelectItem key={role.id || role.name} value={role.name} className="hover:!bg-input-bg focus:!bg-input-bg">{role.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="px-6 pt-4 pb-6 border-t border-theme-border-default/30 bg-input-bg/20 rounded-b-lg">
              <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)} className="border-theme-border-input text-text-main hover:bg-input-bg">Cancel</Button>
              <Button type="submit" disabled={updateRoleMutation.isLoading} className="bg-brand-yellow hover:bg-brand-yellow-hover text-text-on-brand">
                {updateRoleMutation.isLoading && <Loader size="sm" className="mr-2" colorClassName="border-text-on-brand" />} Update Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};