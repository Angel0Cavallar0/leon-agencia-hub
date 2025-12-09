import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Pipeline,
  Stage,
  Company,
  Contact,
  useCreateDeal,
  useCreateCompany,
  useCreateContact,
  useCompanies,
  useContacts,
  useOwners,
  useIsCRMAdmin,
} from "@/hooks/useCRM";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const dealSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  value: z.number().min(0, "Valor deve ser positivo"),
  pipeline_id: z.string().min(1, "Selecione um funil"),
  stage_id: z.string().min(1, "Selecione uma etapa"),
  company_id: z.string().optional(),
  contact_id: z.string().optional(),
  owner_id: z.string().min(1, "Selecione um dono"),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface NewDealDialogProps {
  pipelines: Pipeline[];
  stages: Stage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPipelineId?: string;
}

export function NewDealDialog({
  pipelines,
  stages,
  open,
  onOpenChange,
  defaultPipelineId,
}: NewDealDialogProps) {
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState(defaultPipelineId || "");

  const createDeal = useCreateDeal();
  const createCompany = useCreateCompany();
  const createContact = useCreateContact();
  const { data: companies } = useCompanies();
  const { data: contacts } = useContacts();
  const { data: owners } = useOwners();
  const isCRMAdmin = useIsCRMAdmin();
  const { user } = useAuth();

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      value: 0,
      pipeline_id: defaultPipelineId || "",
      stage_id: "",
      company_id: "",
      contact_id: "",
      owner_id: user?.id || "",
      notes: "",
    },
  });

  const filteredStages = stages.filter((s) => s.pipeline_id === selectedPipelineId);

  const handlePipelineChange = (value: string) => {
    setSelectedPipelineId(value);
    form.setValue("pipeline_id", value);
    form.setValue("stage_id", "");
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    const result = await createCompany.mutateAsync({ name: newCompanyName });
    form.setValue("company_id", result.id);
    setNewCompanyName("");
    setShowNewCompany(false);
  };

  const handleCreateContact = async () => {
    if (!newContactName.trim()) return;
    const result = await createContact.mutateAsync({
      name: newContactName,
      email: newContactEmail || undefined,
      company_id: form.getValues("company_id") || undefined,
    });
    form.setValue("contact_id", result.id);
    setNewContactName("");
    setNewContactEmail("");
    setShowNewContact(false);
  };

  const onSubmit = async (data: DealFormData) => {
    await createDeal.mutateAsync({
      title: data.title,
      value: data.value,
      pipeline_id: data.pipeline_id,
      stage_id: data.stage_id,
      owner_id: data.owner_id,
      company_id: data.company_id || null,
      contact_id: data.contact_id || null,
      notes: data.notes || null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Negócio</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do negócio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pipeline_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funil</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handlePipelineChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pipelines.map((pipeline) => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedPipelineId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <div className="flex gap-2">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione ou crie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewCompany(!showNewCompany)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showNewCompany && (
                <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
                  <Input
                    placeholder="Nome da empresa"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCompany}
                    disabled={!newCompanyName.trim()}
                  >
                    Criar
                  </Button>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato principal</FormLabel>
                    <div className="flex gap-2">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione ou crie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts?.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewContact(!showNewContact)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showNewContact && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <Input
                    placeholder="Nome do contato"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                  <Input
                    placeholder="Email (opcional)"
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateContact}
                    disabled={!newContactName.trim()}
                  >
                    Criar contato
                  </Button>
                </div>
              )}
            </div>

            {/* Owner */}
            {isCRMAdmin && owners && (
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dono do negócio</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {owners.map((owner) => (
                          <SelectItem key={owner.user_id} value={owner.user_id}>
                            {owner.nome} {owner.sobrenome || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre o negócio..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? "Criando..." : "Criar negócio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
