import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Heart, Loader2 } from "lucide-react";

// Google and Apple SDK types
interface GoogleAccounts {
  accounts: {
    id: {
      initialize: (config: any) => void;
      renderButton: (element: HTMLElement, config: any) => void;
      prompt: () => void;
    };
  };
}

interface AppleAuth {
  auth: {
    init: (config: any) => void;
    signIn: () => Promise<any>;
  };
}

function getGoogleAccounts(): GoogleAccounts | undefined {
  return (window as any).google;
}

function getAppleID(): AppleAuth | undefined {
  return (window as any).AppleID;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch } = useAppAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Bem-vindo ao Wedding Manager!");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message || "Credenciais inválidas"),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message || "Erro ao criar conta"),
  });

  const googleLoginMutation = trpc.auth.googleLogin.useMutation({
    onSuccess: async () => {
      setSocialLoading(null);
      await refetch();
      toast.success("Login com Google realizado com sucesso!");
      navigate("/dashboard");
    },
    onError: (err) => {
      setSocialLoading(null);
      toast.error(err.message || "Erro ao fazer login com Google");
    },
  });

  const appleLoginMutation = trpc.auth.appleLogin.useMutation({
    onSuccess: async () => {
      setSocialLoading(null);
      await refetch();
      toast.success("Login com Apple realizado com sucesso!");
      navigate("/dashboard");
    },
    onError: (err) => {
      setSocialLoading(null);
      toast.error(err.message || "Erro ao fazer login com Apple");
    },
  });

  // Google Sign-In callback
  const handleGoogleCallback = useCallback((response: any) => {
    if (response.credential) {
      setSocialLoading("google");
      googleLoginMutation.mutate({
        credential: response.credential,
        clientId: GOOGLE_CLIENT_ID,
      });
    }
  }, [googleLoginMutation]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      const google = getGoogleAccounts();
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    // Try immediately, or wait for script to load
    const google = getGoogleAccounts();
    if (google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        const g = getGoogleAccounts();
        if (g?.accounts?.id) {
          initGoogle();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCallback]);

  // Handle Google button click
  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Login com Google não configurado. Configure o VITE_GOOGLE_CLIENT_ID.");
      return;
    }
    const google = getGoogleAccounts();
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      toast.error("Google Sign-In ainda não carregou. Tente novamente.");
    }
  };

  // Handle Apple Sign-In
  const handleAppleLogin = async () => {
    if (!APPLE_CLIENT_ID) {
      toast.error("Login com Apple não configurado. Configure o VITE_APPLE_CLIENT_ID.");
      return;
    }

    try {
      setSocialLoading("apple");

      const appleAuth = getAppleID();
      if (!appleAuth) {
        toast.error("Apple Sign-In ainda não carregou. Tente novamente.");
        setSocialLoading(null);
        return;
      }

      appleAuth.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: window.location.origin + "/login",
        usePopup: true,
      });

      const response = await appleAuth.auth.signIn();

      if (response?.authorization?.id_token) {
        const userData = response.user ? {
          name: response.user.name
            ? `${response.user.name.firstName || ""} ${response.user.name.lastName || ""}`.trim()
            : undefined,
          email: response.user.email || undefined,
        } : undefined;

        appleLoginMutation.mutate({
          idToken: response.authorization.id_token,
          user: userData,
        });
      } else {
        toast.error("Resposta inválida do Apple Sign-In.");
        setSocialLoading(null);
      }
    } catch (error: any) {
      console.error("Apple Sign-In error:", error);
      if (error?.error !== "popup_closed_by_user") {
        toast.error("Erro ao fazer login com Apple.");
      }
      setSocialLoading(null);
    }
  };

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onLogin = (data: LoginForm) => loginMutation.mutate(data);
  const onRegister = (data: RegisterForm) => registerMutation.mutate({
    name: data.name,
    email: data.email,
    password: data.password,
  });

  const SocialButtons = () => (
    <div className="mt-6 space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
        </div>
      </div>

      {/* Google Login */}
      <Button
        variant="outline"
        className="w-full h-11"
        onClick={handleGoogleLogin}
        disabled={socialLoading !== null || !GOOGLE_CLIENT_ID}
        type="button"
      >
        {socialLoading === "google" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {socialLoading === "google" ? "Entrando com Google..." : "Continuar com Google"}
      </Button>

      {/* Apple Login */}
      <Button
        variant="outline"
        className="w-full h-11"
        onClick={handleAppleLogin}
        disabled={socialLoading !== null || !APPLE_CLIENT_ID}
        type="button"
      >
        {socialLoading === "apple" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
        )}
        {socialLoading === "apple" ? "Entrando com Apple..." : "Continuar com Apple"}
      </Button>

      {/* Hidden Google button for rendering */}
      <div ref={googleBtnRef} className="hidden" />
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.50 0.14 10) 0%, oklch(0.65 0.12 30) 50%, oklch(0.75 0.08 45) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 200 + 50}px`,
                height: `${Math.random() * 200 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: "rgba(255,255,255,0.3)",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center text-white px-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Heart className="w-12 h-12" fill="white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Wedding Manager</h1>
          <p className="text-lg sm:text-xl opacity-90 font-light leading-relaxed">
            Gerencie seus casamentos com elegância e precisão
          </p>
          <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-4 sm:gap-6 text-left">
            {[
              { label: "Agendamentos", desc: "Controle completo de eventos" },
              { label: "Financeiro", desc: "Cobranças e contratos" },
              { label: "Dashboard", desc: "Indicadores em tempo real" },
              { label: "Multi-usuário", desc: "Perfis Admin e User" },
            ].map((item) => (
              <div key={item.label} className="bg-white/15 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <p className="font-semibold text-xs sm:text-sm">{item.label}</p>
                <p className="text-xs opacity-80 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <Heart className="w-7 h-7 text-primary" fill="currentColor" />
            <span className="text-xl font-bold gradient-text">Wedding Manager</span>
          </div>

          <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">
                {mode === "login" ? "Entrar na conta" : "Criar conta"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Acesse o sistema de gestão de casamentos"
                  : "Preencha os dados para criar sua conta"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mode === "login" ? (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      {...loginForm.register("email")}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
                    ) : "Entrar"}
                  </Button>

                  <SocialButtons />
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" placeholder="Seu nome" {...registerForm.register("name")} />
                    {registerForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">E-mail</Label>
                    <Input id="reg-email" type="email" placeholder="seu@email.com" {...registerForm.register("email")} />
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        {...registerForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="Repita a senha"
                      {...registerForm.register("confirmPassword")}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</>
                    ) : "Criar conta"}
                  </Button>

                  <SocialButtons />
                </form>
              )}

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>Não tem conta?{" "}
                    <button onClick={() => setMode("register")} className="text-primary font-medium hover:underline">
                      Cadastre-se
                    </button>
                  </>
                ) : (
                  <>Já tem conta?{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                      Entrar
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
