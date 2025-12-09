import { useState } from "react";
import { Search, Plus, Phone, Mail, Globe, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Company,
  useCompanies,
  useCreateCompany,
  useContacts,
  useDeals,
} from "@/hooks/useCRM";

export function CompaniesTab() {
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    document: "",
    phone: "",
    email: "",
    website: "",
    city: "",
    state: "",
    address: "",
    notes: "",
  });

  const { data: companies, isLoading } = useCompanies(search);
  const { data: contacts } = useContacts();
  const { data: deals } = useDeals();
  const createCompany = useCreateCompany();

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) return;
    await createCompany.mutateAsync({
      name: newCompany.name,
      document: newCompany.document || undefined,
      phone: newCompany.phone || undefined,
      email: newCompany.email || undefined,
      website: newCompany.website || undefined,
      city: newCompany.city || undefined,
      state: newCompany.state || undefined,
      address: newCompany.address || undefined,
      notes: newCompany.notes || undefined,
    });
    setNewCompany({
      name: "",
      document: "",
      phone: "",
      email: "",
      website: "",
      city: "",
      state: "",
      address: "",
      notes: "",
    });
    setShowNewDialog(false);
  };

  const getCompanyContacts = (companyId: string) => {
    return contacts?.filter((contact) => contact.company_id === companyId) || [];
  };

  const getCompanyDeals = (companyId: string) => {
    return deals?.filter((deal) => deal.company_id === companyId) || [];
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova empresa
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cidade/Estado</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : companies?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            ) : (
              companies?.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedCompany(company)}
                >
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.document || "-"}</TableCell>
                  <TableCell>
                    {company.city && company.state
                      ? `${company.city}/${company.state}`
                      : company.city || company.state || "-"}
                  </TableCell>
                  <TableCell>{company.phone || "-"}</TableCell>
                  <TableCell>
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Company Detail Sheet */}
      <Sheet open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedCompany && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCompany.name}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  {selectedCompany.document && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">CNPJ: </span>
                      {selectedCompany.document}
                    </div>
                  )}
                  {selectedCompany.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedCompany.email}
                    </div>
                  )}
                  {selectedCompany.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedCompany.phone}
                    </div>
                  )}
                  {selectedCompany.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedCompany.website}
                      </a>
                    </div>
                  )}
                  {(selectedCompany.city || selectedCompany.state || selectedCompany.address) && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {selectedCompany.address && <div>{selectedCompany.address}</div>}
                        {(selectedCompany.city || selectedCompany.state) && (
                          <div>
                            {selectedCompany.city}
                            {selectedCompany.city && selectedCompany.state && " - "}
                            {selectedCompany.state}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedCompany.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedCompany.notes}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Contatos</h4>
                  {getCompanyContacts(selectedCompany.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum contato</p>
                  ) : (
                    <div className="space-y-2">
                      {getCompanyContacts(selectedCompany.id).map((contact) => (
                        <div key={contact.id} className="p-2 border rounded text-sm">
                          <p className="font-medium">{contact.name}</p>
                          {contact.position && (
                            <p className="text-muted-foreground">{contact.position}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Negócios</h4>
                  {getCompanyDeals(selectedCompany.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum negócio</p>
                  ) : (
                    <div className="space-y-2">
                      {getCompanyDeals(selectedCompany.id).map((deal) => (
                        <div key={deal.id} className="p-2 border rounded text-sm">
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-muted-foreground">{deal.stage?.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Company Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={newCompany.document}
                onChange={(e) => setNewCompany({ ...newCompany, document: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Site</Label>
              <Input
                value={newCompany.website}
                onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                placeholder="https://empresa.com.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={newCompany.city}
                  onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={newCompany.state}
                  onChange={(e) => setNewCompany({ ...newCompany, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={newCompany.address}
                onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={newCompany.notes}
                onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })}
                placeholder="Notas sobre a empresa..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCompany}
                disabled={!newCompany.name.trim() || createCompany.isPending}
              >
                Criar empresa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
