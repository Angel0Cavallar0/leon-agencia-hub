import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { logoUrl, secondaryLogoUrl } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(18,153,144,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(17,24,39,0.9),_rgba(2,6,23,0.95))]" />
      <Card className="relative w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo principal"
                className="h-12 w-auto drop-shadow-lg"
              />
            )}
            {secondaryLogoUrl && (
              <img
                src={secondaryLogoUrl}
                alt="Logo secundária"
                className="h-8 w-auto opacity-90 drop-shadow"
              />
            )}
          </div>
          <CardTitle className="text-2xl text-center text-white">Bem-vindo</CardTitle>
          <CardDescription className="text-center text-slate-200">
            Entre com suas credenciais para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-white/10 bg-white/10 text-white placeholder:text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-white/10 bg-white/10 text-white placeholder:text-slate-300"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
