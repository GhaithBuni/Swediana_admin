"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, RefreshCw, Trash2 } from "lucide-react";
import { authStorage } from "@/app/lib/auth";

type PhoneEntry = {
  _id: string;
  phone: string;
  status: "Har Ringt" | "Ska ringa upp" | "Ingen status";
  service: string;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: "Ingen status", label: "Ingen status", color: "bg-gray-500" },
  { value: "Ska ringa upp", label: "Ska ringa upp", color: "bg-yellow-500" },
  { value: "Har Ringt", label: "Har Ringt", color: "bg-green-500" },
];

const SERVICE_OPTIONS = [
  { value: "all", label: "All Services" },
  { value: "Flyttstädning", label: "Flyttstädning" },
  { value: "Flytthjälp", label: "Flytthjälp" },
  { value: "Byggstädning", label: "Byggstädning" },
];

const PhoneServicePage = () => {
  const [phones, setPhones] = useState<PhoneEntry[]>([]);
  const [filteredPhones, setFilteredPhones] = useState<PhoneEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Get token from localStorage

  const fetchPhones = async () => {
    setIsLoading(true);
    setError(null);
    const token = authStorage.getToken();

    if (!token) {
      setError("No authentication token found. Please login.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.getPhone(token);

      if (!response.ok) {
        throw new Error("Failed to fetch phone numbers");
      }

      const data = await response.json();
      setPhones(data.data || data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load phone numbers");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (
    id: string,
    newStatus: "Har Ringt" | "Ska ringa upp" | "Ingen status"
  ) => {
    const token = authStorage.getToken();
    if (!token) {
      setError("No authentication token found. Please login.");
      return;
    }

    setUpdatingId(id);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/phone/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setPhones((prev) =>
        prev.map((phone) =>
          phone._id === id ? { ...phone, status: newStatus } : phone
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const deletePhone = async (id: string) => {
    const token = authStorage.getToken();
    if (!token) {
      setError("No authentication token found. Please login.");
      return;
    }

    if (!confirm("Are you sure you want to delete this phone record?")) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/phone/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete phone record");
      }

      // Remove from local state
      setPhones((prev) => prev.filter((phone) => phone._id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete phone record");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    return (
      <Badge className={`${statusOption?.color || "bg-gray-500"} text-white`}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Filter phones based on service and status
  useEffect(() => {
    let filtered = [...phones];

    if (serviceFilter !== "all") {
      filtered = filtered.filter((phone) => phone.service === serviceFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((phone) => phone.status === statusFilter);
    }

    setFilteredPhones(filtered);
  }, [phones, serviceFilter, statusFilter]);

  useEffect(() => {
    fetchPhones();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Phone className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Phone Service Management</h1>
        </div>
        <Button
          onClick={fetchPhones}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Service:</label>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Phones</p>
          <p className="text-2xl font-bold">{phones.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Filtered</p>
          <p className="text-2xl font-bold">{filteredPhones.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Ingen status</p>
          <p className="text-2xl font-bold">
            {phones.filter((p) => p.status === "Ingen status").length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Har Ringt</p>
          <p className="text-2xl font-bold text-green-600">
            {phones.filter((p) => p.status === "Har Ringt").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPhones.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No phone numbers found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPhones.map((phone) => (
                <TableRow key={phone._id}>
                  <TableCell className="font-medium">{phone.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {phone.service}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(phone.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(phone.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={phone.status}
                        onValueChange={(value) =>
                          updateStatus(
                            phone._id,
                            value as
                              | "Har Ringt"
                              | "Ska ringa upp"
                              | "Ingen status"
                          )
                        }
                        disabled={
                          updatingId === phone._id || deletingId === phone._id
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          {updatingId === phone._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deletePhone(phone._id)}
                        disabled={
                          deletingId === phone._id || updatingId === phone._id
                        }
                      >
                        {deletingId === phone._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default PhoneServicePage;
