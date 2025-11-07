import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ClickupTarefas() {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [filtroColaborador, setFiltroColaborador] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [tarefasRes, colaboradoresRes] = await Promise.all([
      supabase.from("informacoes_tasks_clickup").select("*"),
      supabase.from("colaborador").select("id_clickup, nome, sobrenome"),
    ]);

    if (tarefasRes.data) setTarefas(tarefasRes.data);
    if (colaboradoresRes.data) setColaboradores(colaboradoresRes.data);
  };

  const statusOptions = Array.from(new Set(tarefas.map((t) => t.status).filter(Boolean)));

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("pt-BR");
  };

  const filteredTarefas = tarefas.filter((tarefa) => {
    if (filtroColaborador && tarefa.id_colaborador_clickup !== filtroColaborador) return false;
    if (filtroStatus && tarefa.status !== filtroStatus) return false;
    return true;
  });

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: any = {
      urgent: "destructive",
      high: "warning",
      normal: "default",
      low: "secondary",
    };
    return variants[prioridade?.toLowerCase()] || "default";
  };

  const isOverdue = (dataEntrega: string | null, status: string | null) => {
    if (!dataEntrega || status === "Concluído") return false;

    const parsedDate = new Date(dataEntrega);
    if (Number.isNaN(parsedDate.getTime())) {
      return false;
    }

    return parsedDate < new Date();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas ClickUp</h1>
          <p className="text-muted-foreground">Visualize todas as tarefas do ClickUp</p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Select value={filtroColaborador} onValueChange={setFiltroColaborador}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por colaborador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {colaboradores.map((colab) => (
                <SelectItem key={colab.id_clickup} value={colab.id_clickup || ""}>
                  {colab.nome} {colab.sobrenome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Lista</TableHead>
                <TableHead>Pasta</TableHead>
                <TableHead>Data Entrega</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTarefas.map((tarefa) => (
                <TableRow
                  key={tarefa.id_subtask}
                  className={isOverdue(tarefa.data_entrega, tarefa.status) ? "bg-destructive/10" : ""}
                >
                  <TableCell className="font-medium">{tarefa.nome_subtask}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tarefa.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {tarefa.prioridade && (
                      <Badge variant={getPrioridadeBadge(tarefa.prioridade)}>
                        {tarefa.prioridade}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{tarefa.nome_colaborador}</TableCell>
                  <TableCell>{tarefa.nome_lista}</TableCell>
                  <TableCell>{tarefa.nome_pasta}</TableCell>
                  <TableCell>{formatDate(tarefa.data_entrega)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
