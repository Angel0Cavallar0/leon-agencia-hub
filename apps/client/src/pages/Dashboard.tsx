import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao painel do cliente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Você está autenticado com o email <span className="font-medium text-foreground">{user?.email}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Em breve você encontrará aqui os dados e atalhos personalizados para sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
