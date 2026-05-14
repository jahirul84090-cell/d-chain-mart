"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Lucide React Icons
import { Loader2, Star, Camera, FileText } from "lucide-react";

// Shadcn UI Components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Custom Hooks
import { useDebounce } from "@/lib/useDebounce";

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce the search term
  const itemsPerPage = 10;

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const filterParam = filter === "all" ? "" : `&filter=${filter}`;
      const emailParam = debouncedSearchTerm
        ? `&email=${encodeURIComponent(debouncedSearchTerm)}`
        : "";
      const res = await fetch(
        `/api/reviews?page=${currentPage}&limit=${itemsPerPage}${filterParam}${emailParam}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await res.json();
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error("Error fetching reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, filter, debouncedSearchTerm]);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await fetch(`/api/reviews/${id}`, { method: "PATCH" });
      if (filter === "pending") {
        setReviews(reviews.filter((review) => review.id !== id));
      } else {
        setReviews(
          reviews.map((review) =>
            review.id === id ? { ...review, isApproved: true } : review
          )
        );
      }
      toast.success("Review approved successfully!");
    } catch (err) {
      toast.error("Failed to approve review.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      setReviews(reviews.filter((review) => review.id !== id));
      toast.success("Review deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset page to 1 when search term changes
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-purple-600">
              Review Manager
            </CardTitle>
            <CardDescription>
              Manage and moderate customer reviews for your products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <label
                  htmlFor="review-filter"
                  className="text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  Filter by Status:
                </label>
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reviews</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <label
                  htmlFor="email-search"
                  className="text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  Search by Email:
                </label>
                <Input
                  id="email-search"
                  type="email"
                  placeholder="Enter email to search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full md:w-[250px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-[50px] w-full" />
                <Skeleton className="h-[50px] w-full" />
                <Skeleton className="h-[50px] w-full" />
                <Skeleton className="h-[50px] w-full" />
                <Skeleton className="h-[50px] w-full" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg">No reviews found for this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Product</TableHead>
                      <TableHead className="w-[120px]">User</TableHead>
                      <TableHead className="w-[180px]">Email</TableHead>
                      <TableHead className="w-[150px]">Review Title</TableHead>
                      <TableHead>Review Content</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="w-[180px] inline-block truncate">
                                {review.product.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{review.product.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{review.user.name}</TableCell>
                        <TableCell className="truncate">
                          {review.user.email}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="w-[130px] inline-block truncate">
                                {review.title || "No Title"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{review.title || "No Title"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>View Content</TooltipContent>
                            </Tooltip>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Content</DialogTitle>
                              </DialogHeader>
                              <div className="p-4 text-sm text-gray-700">
                                <p>{review.content}</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-4 w-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              review.isApproved
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {review.isApproved ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {review.images && review.images.length > 0 ? (
                            <Dialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Camera className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>View Image</TooltipContent>
                              </Tooltip>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Review Images for "{review.product.name}"
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                                  {review.images.map((image, index) => (
                                    <img
                                      key={index}
                                      src={image.url}
                                      alt={`Review image ${index + 1}`}
                                      className="rounded-md object-cover w-full h-auto"
                                    />
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-gray-400">No images</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {!review.isApproved && (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(review.id)}
                                disabled={approvingId !== null}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                {approvingId === review.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Approve
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deletingId !== null}
                                >
                                  {deletingId === review.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you absolutely sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete this review and its
                                    associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(review.id)}
                                  >
                                    Continue
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-8 flex justify-end items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default ReviewManager;
