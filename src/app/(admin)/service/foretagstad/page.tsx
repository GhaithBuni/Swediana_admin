// app/admin/foretagstad/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
import { authStorage } from "@/app/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  Building2,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Foretagstad {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  kvm: string;
  adress: string;
  postalcode: string;
  city: string;
  createdAt: string;
}

const ForetagstadPage = () => {
  const [contacts, setContacts] = useState<Foretagstad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Foretagstad | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const token = authStorage.getToken();

  const fetchContacts = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getForetagstad(token);

      if (!response.ok) {
        throw new Error("Failed to fetch företagsstädning contacts");
      }

      const data = await response.json();
      setContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Kunde inte hämta företagsstädning förfrågningar", {
        description: "Försök igen senare.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [token]);

  const handleDelete = async () => {
    if (!contactToDelete || !token) return;

    try {
      const response = await api.deleteForetagstad(token, contactToDelete);

      if (!response.ok) {
        throw new Error("Failed to delete contact");
      }

      setContacts((prev) => prev.filter((c) => c._id !== contactToDelete));

      toast.success("Förfrågan raderad", {
        description: "Företagsstädning förfrågan har tagits bort.",
      });

      setDeleteDialogOpen(false);
      setContactToDelete(null);

      if (selectedContact?._id === contactToDelete) {
        setSelectedContact(null);
      }
    } catch (error) {
      toast.error("Kunde inte radera förfrågan", {
        description: "Försök igen senare.",
      });
    }
  };

  const handleRefresh = () => {
    fetchContacts();
    toast.success("Uppdaterad", {
      description: "Listan har uppdaterats.",
    });
  };

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.subject.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      contact.city.toLowerCase().includes(query) ||
      contact.adress.toLowerCase().includes(query)
    );
  });

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Fel uppstod</CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Försök igen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-[#0c8a84]" />
            Företagsstädning
          </h1>
          <p className="text-muted-foreground">
            Hantera och granska företagsstädning förfrågningar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {contacts.length} förfrågningar
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök efter namn, e-post, stad, adress..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alla förfrågningar</CardTitle>
          <CardDescription>
            {filteredContacts.length} av {contacts.length} förfrågningar visas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Inga förfrågningar</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Inga förfrågningar matchade din sökning"
                  : "Inga företagsstädning förfrågningar har kommit in än"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kontaktperson</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Kvm</TableHead>
                    <TableHead>Stad</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact._id}>
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-[#0c8a84] hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.kvm} m²</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {contact.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(contact.createdAt), "d MMM yyyy", {
                            locale: sv,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedContact(contact)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setContactToDelete(contact._id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Contact Dialog */}
      <Dialog
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Företagsstädning Förfrågan</DialogTitle>
            <DialogDescription>
              Fullständig information om förfrågan
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Kontaktperson
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {selectedContact.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Datum
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {format(
                      new Date(selectedContact.createdAt),
                      "d MMMM yyyy, HH:mm",
                      { locale: sv }
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    E-post
                  </label>
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="text-lg font-semibold mt-1 text-[#0c8a84] hover:underline flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {selectedContact.email}
                  </a>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Telefon
                  </label>
                  <a
                    href={`tel:${selectedContact.phone}`}
                    className="text-lg font-semibold mt-1 hover:underline flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedContact.phone}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Kvadratmeter
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {selectedContact.kvm} m²
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ämne
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {selectedContact.subject}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Adress
                </label>
                <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#0c8a84]" />
                    {selectedContact.adress}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedContact.postalcode} {selectedContact.city}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Meddelande
                </label>
                <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedContact.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-[#0c8a84] hover:bg-[#0a6f6a]"
                  onClick={() =>
                    window.open(`mailto:${selectedContact.email}`, "_blank")
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Skicka e-post
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    window.open(`tel:${selectedContact.phone}`, "_blank")
                  }
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Ring
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Förfrågan kommer att raderas
              permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Radera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ForetagstadPage;
