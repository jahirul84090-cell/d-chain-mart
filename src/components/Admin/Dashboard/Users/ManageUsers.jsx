// components/user-manager.jsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash, SquareArrowOutUpRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDebounce } from "@/lib/useDebounce";
import { useRouter } from "next/navigation";

export default function UserManager() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500); // Debounce the search term
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [userToUpdateRole, setUserToUpdateRole] = useState(null);
  const [newRole, setNewRole] = useState("");

  const router = useRouter();
  useEffect(() => {
    // The search function now depends on the debounced value.
    fetchUsers();
  }, [page, debouncedSearch, roleFilter]); // Update dependency array to use debouncedSearch

  const fetchUsers = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page,
      role: roleFilter,
      search: debouncedSearch, // Use the debounced value in the API call
    }).toString();

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load user data.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmChangeRole = (userId, currentRole, targetRole) => {
    if (session.user.id === userId) {
      toast.error("You cannot change your own role.");
      return;
    }

    setUserToUpdateRole({
      id: userId,
      currentRole,
      name: users.find((u) => u.id === userId)?.name,
    });
    setNewRole(targetRole);
    setShowRoleDialog(true);
  };

  const handleUpdateRole = async () => {
    if (!userToUpdateRole || !newRole) return;

    const userId = userToUpdateRole.id;
    setLoadingStates((prev) => ({ ...prev, [userId]: true }));
    setShowRoleDialog(false);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        toast.success("User role updated successfully.");
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update user role.");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const confirmDeleteUser = (user) => {
    if (session.user.id === user.id) {
      toast.error("You cannot delete your own account.");
      return;
    }

    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setLoadingStates((prev) => ({ ...prev, [userToDelete.id]: true }));
    setShowDeleteDialog(false);

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      if (res.ok) {
        toast.success("User deleted successfully.");
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [userToDelete.id]: false }));
      setUserToDelete(null);
    }
  };

  const handleViewDetails = (userId) => {
    router.push(`/dashboard/users/${userId}`);
  };

  const totalPages = Math.ceil(total / 10);

  const getRoleColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-500 hover:bg-purple-600";
      case "ADMIN":
        return "bg-blue-500 hover:bg-blue-600";
      case "USER":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-gray-400 hover:bg-gray-500";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mx-auto py-10">
      <ToastContainer position="bottom-right" />
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">User Management</CardTitle>
          <CardDescription>
            View, filter, and manage user accounts and roles. Only Super Admins
            can make changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:max-w-sm"
            />
            <Select
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
              value={roleFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={user.image || "/placeholder-avatar.png"}
                          />
                          <AvatarFallback>
                            {user.name
                              ? user.name.slice(0, 2).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) =>
                            confirmChangeRole(user.id, user.role, value)
                          }
                          value={user.role}
                          disabled={
                            loadingStates[user.id] ||
                            session?.user?.id === user.id ||
                            session?.user?.role !== "SUPER_ADMIN"
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">
                              Super Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewDetails(user.id)}
                          disabled={!session?.user?.id}
                        >
                          <SquareArrowOutUpRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => confirmDeleteUser(user)}
                          disabled={
                            loadingStates[user.id] ||
                            session?.user?.id === user.id ||
                            session?.user?.role !== "SUPER_ADMIN"
                          }
                        >
                          {loadingStates[user.id] ? (
                            "Deleting..."
                          ) : (
                            <>
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              user <strong>{userToDelete?.name}</strong> and their data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={loadingStates[userToDelete?.id] || false}
            >
              {loadingStates[userToDelete?.id] ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the role of{" "}
              <strong>{userToUpdateRole?.name}</strong>
              from **{userToUpdateRole?.currentRole}** to **{newRole}**?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={loadingStates[userToUpdateRole?.id] || false}
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
