import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

const DEFAULT_N8N_URL = "https://n8n.camaleon.com.br/";
const STORAGE_KEY = "n8n-url";

export default function N8N() {
  const [n8nUrl, setN8nUrl] = useState(DEFAULT_N8N_URL);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUrl = async () => {
      const storedUrl = localStorage.getItem(STORAGE_KEY);
      if (storedUrl) {
        setN8nUrl(storedUrl);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("global_settings")
          .select("value")
          .eq("key", "n8n_url")
          .maybeSingle();

        if (error) throw error;

        const resolvedUrl =
          typeof data?.value === "string"
            ? data.value
            : typeof (data?.value as { url?: string })?.url === "string"
              ? (data?.value as { url?: string }).url
              : DEFAULT_N8N_URL;

        setN8nUrl(resolvedUrl || DEFAULT_N8N_URL);
        localStorage.setItem(STORAGE_KEY, resolvedUrl || DEFAULT_N8N_URL);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        await logger.error("Erro ao carregar URL do n8n", "N8N_URL_LOAD", {
          errorMessage,
          errorStack,
        });
        toast.error("Não foi possível carregar o link do n8n. Usando o padrão.");
        setN8nUrl(DEFAULT_N8N_URL);
      } finally {
        setIsLoading(false);
      }
    };

    loadUrl();
  }, []);

  return (
    <Layout noPadding>
      <div className="flex h-full flex-col">
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">n8n</h1>
              <p className="text-muted-foreground">
                Acesse seus fluxos do n8n diretamente dentro da plataforma.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
                className="w-80"
                aria-label="URL do n8n"
              />
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY, n8nUrl);
                  toast.success("Link do n8n atualizado para esta sessão.");
                }}
                disabled={isLoading}
              >
                Atualizar link
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-muted/30">
          <Card className="m-6 h-[calc(100%-3rem)] overflow-hidden">
            <CardHeader>
              <CardTitle>Navegador interno</CardTitle>
              <CardDescription>O link é carregado dentro do painel para maior segurança.</CardDescription>
            </CardHeader>
            <CardContent className="h-full p-0">
              <iframe
                title="n8n"
                src={n8nUrl || DEFAULT_N8N_URL}
                className="h-full w-full border-0"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
