import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  fetchConversations,
  fetchConversationMessages,
  markConversationAsRead,
  sendTextMessage,
  sendFileMessage,
  sendImageMessage,
  sendButtonsMessage,
  sendListMessage,
  fetchStatus,
  fetchQrCode,
  reconnectSession,
  disconnectSession,
  ConversationSummary,
  ChatMessage,
  SessionStatus,
} from "@/integrations/zapi/api";
import { useZapiEvents } from "@/hooks/useZapiEvents";

const DEFAULT_DISPLAY_NAME = "Contato";

type MessageComposerType = "text" | "image" | "file" | "buttons" | "list";

type MessageEventPayload = {
  conversation: ConversationSummary;
  message: ChatMessage;
};

type ConversationEventPayload = {
  conversation: ConversationSummary;
};

function formatDate(value: string | null) {
  if (!value) return "";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch (error) {
    return value;
  }
}

function ensureNumber(value: string) {
  return value.replace(/\D/g, "");
}

function extractQrCodeValue(data: Record<string, unknown> | undefined | null) {
  if (!data) return null;
  if (typeof data.qrCode === "string" && data.qrCode) {
    return data.qrCode;
  }
  if (typeof data.image === "string" && data.image) {
    return data.image;
  }
  if (typeof data.base64 === "string" && data.base64) {
    const content = data.base64.startsWith("data:") ? data.base64 : `data:image/png;base64,${data.base64}`;
    return content;
  }
  return null;
}

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

export default function Whatsapp() {
  const { user, userRole } = useAuth();
  const allowed = userRole === "admin" || userRole === "supervisor";
  const agentId = user?.id || "";
  const agentName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.nome as string | undefined) ||
    user?.email ||
    "Agente";

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messagesByNumber, setMessagesByNumber] = useState<Record<string, ChatMessage[]>>({});
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessagesNumber, setLoadingMessagesNumber] = useState<string | null>(null);
  const [composerType, setComposerType] = useState<MessageComposerType>("text");
  const [textMessage, setTextMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileMessage, setFileMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [buttonsTitle, setButtonsTitle] = useState("");
  const [buttonsText, setButtonsText] = useState("");
  const [listTitle, setListTitle] = useState("");
  const [listItemsText, setListItemsText] = useState("");
  const [newConversationNumber, setNewConversationNumber] = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingQrCode, setLoadingQrCode] = useState(false);
  const [sessionAction, setSessionAction] = useState<"reconnect" | "disconnect" | null>(null);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.contactNumber === selectedNumber) || null,
    [conversations, selectedNumber]
  );

  const messagesForSelectedConversation = selectedNumber
    ? messagesByNumber[selectedNumber] || []
    : [];

  const messageCount = messagesForSelectedConversation.length;

  useEffect(() => {
    if (!allowed) {
      return;
    }

    const loadInitialData = async () => {
      setLoadingConversations(true);
      try {
        const [{ conversations: list }, statusResponse, qrCodeResponse] = await Promise.all([
          fetchConversations(),
          fetchStatus().catch(() => null),
          fetchQrCode().catch(() => null),
        ]);

        setConversations(list);
        if (statusResponse?.status) {
          setSessionStatus(statusResponse.status);
        }
        if (qrCodeResponse?.qrCode) {
          const qrValue = extractQrCodeValue(qrCodeResponse.qrCode as Record<string, unknown>);
          if (qrValue) {
            setQrCode(qrValue);
          }
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Não foi possível carregar as conversas"));
      } finally {
        setLoadingConversations(false);
      }
    };

    loadInitialData();
  }, [allowed]);

  useEffect(() => {
    if (!selectedNumber) {
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedNumber, messageCount]);

  const upsertConversation = useCallback((conversation: ConversationSummary) => {
    setConversations((prev) => {
      const existingIndex = prev.findIndex((item) => item.contactNumber === conversation.contactNumber);
      const updated = existingIndex >= 0 ? [...prev] : [...prev, conversation];
      if (existingIndex >= 0) {
        updated[existingIndex] = { ...updated[existingIndex], ...conversation };
      }
      return updated.sort((a, b) => {
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
    });
  }, []);

  const appendMessage = useCallback((contactNumber: string, message: ChatMessage) => {
    setMessagesByNumber((prev) => {
      const currentMessages = prev[contactNumber] || [];
      const withoutDuplicate = currentMessages.filter((item) => item.id !== message.id);
      const merged = sortMessages([...withoutDuplicate, message]);
      return {
        ...prev,
        [contactNumber]: merged,
      };
    });
  }, []);

  useZapiEvents<MessageEventPayload, SessionStatus>({
    onMessage: (payload) => {
      if (!payload || !payload.conversation || !payload.message) {
        return;
      }
      upsertConversation(payload.conversation);
      appendMessage(payload.conversation.contactNumber, payload.message);
    },
    onConversation: (payload: ConversationEventPayload) => {
      if (!payload?.conversation) return;
      upsertConversation(payload.conversation);
    },
    onStatus: (payload) => {
      setSessionStatus(payload);
    },
    onError: () => {
      toast.warning("Conexão com eventos em tempo real perdida. Tentando reconectar...");
    },
  }, { enabled: allowed });

  const handleSelectConversation = useCallback(
    async (conversation: ConversationSummary) => {
      const numero = conversation.contactNumber;
      setSelectedNumber(numero);

      if (!messagesByNumber[numero]) {
        setLoadingMessagesNumber(numero);
        try {
          const { messages } = await fetchConversationMessages(numero);
          setMessagesByNumber((prev) => ({
            ...prev,
            [numero]: sortMessages(messages),
          }));
        } catch (error: unknown) {
          toast.error(getErrorMessage(error, "Não foi possível carregar as mensagens"));
        } finally {
          setLoadingMessagesNumber(null);
        }
      }

      try {
        await markConversationAsRead(numero);
        setConversations((prev) =>
          prev.map((item) =>
            item.contactNumber === numero ? { ...item, unreadCount: 0 } : item
          )
        );
      } catch (error) {
        // Apenas registra; o backend fará nova tentativa pelo webhook
        console.warn("Falha ao marcar conversa como lida", error);
      }
    },
    [messagesByNumber]
  );

  const handleCreateConversation = useCallback(() => {
    const sanitizedNumber = ensureNumber(newConversationNumber);
    if (!sanitizedNumber) {
      toast.error("Informe um número válido para iniciar a conversa");
      return;
    }

    if (conversations.some((item) => item.contactNumber === sanitizedNumber)) {
      setSelectedNumber(sanitizedNumber);
      setNewConversationNumber("");
      return;
    }

    const conversation: ConversationSummary = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      contactNumber: sanitizedNumber,
      displayName: sanitizedNumber,
      lastMessagePreview: null,
      lastMessageAt: null,
      unreadCount: 0,
      lastAgentName: null,
    };

    setConversations((prev) => [conversation, ...prev]);
    setSelectedNumber(sanitizedNumber);
    setNewConversationNumber("");
  }, [conversations, newConversationNumber]);

  const handleRefreshStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const { status } = await fetchStatus();
      setSessionStatus(status);
      toast.success("Status atualizado com sucesso");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar o status"));
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const handleRefreshQrCode = useCallback(async () => {
    setLoadingQrCode(true);
    try {
      const { qrCode: qrCodeData } = await fetchQrCode();
      const value = extractQrCodeValue(qrCodeData as Record<string, unknown>);
      if (value) {
        setQrCode(value);
        toast.success("QR Code atualizado");
      } else {
        toast.warning("Nenhum QR Code disponível no momento");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Não foi possível carregar o QR Code"));
    } finally {
      setLoadingQrCode(false);
    }
  }, []);

  const handleSessionAction = useCallback(
    async (action: "reconnect" | "disconnect") => {
      setSessionAction(action);
      try {
        if (action === "reconnect") {
          await reconnectSession();
          toast.success("Solicitação de reconexão enviada");
        } else {
          await disconnectSession();
          toast.success("Sessão desconectada");
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Não foi possível executar a ação"));
      } finally {
        setSessionAction(null);
      }
    },
    []
  );

  const resetComposer = () => {
    setTextMessage("");
    setImageUrl("");
    setImageCaption("");
    setFileUrl("");
    setFileMessage("");
    setFileName("");
    setButtonsTitle("");
    setButtonsText("");
    setListTitle("");
    setListItemsText("");
  };

  const handleSendMessage = useCallback(async () => {
    if (!selectedNumber) {
      toast.error("Selecione uma conversa antes de enviar");
      return;
    }

    if (!agentId) {
      toast.error("Não foi possível identificar o usuário logado");
      return;
    }

    setSending(true);
    try {
      const payloadBase = {
        numero: selectedNumber,
        agentId,
        agentName,
        displayName: selectedConversation?.displayName || selectedNumber,
      };

      let response:
        | Awaited<ReturnType<typeof sendTextMessage>>
        | Awaited<ReturnType<typeof sendImageMessage>>
        | Awaited<ReturnType<typeof sendFileMessage>>
        | Awaited<ReturnType<typeof sendButtonsMessage>>
        | Awaited<ReturnType<typeof sendListMessage>>
        | null = null;

      if (composerType === "text") {
        if (!textMessage.trim()) {
          toast.error("Digite uma mensagem de texto");
          return;
        }
        response = await sendTextMessage({ ...payloadBase, mensagem: textMessage.trim() });
      } else if (composerType === "image") {
        if (!imageUrl.trim()) {
          toast.error("Informe a URL ou carregue uma imagem");
          return;
        }
        response = await sendImageMessage({
          ...payloadBase,
          imagemUrl: imageUrl.trim(),
          caption: imageCaption.trim() || undefined,
        });
      } else if (composerType === "file") {
        if (!fileUrl.trim()) {
          toast.error("Informe a URL ou carregue um arquivo");
          return;
        }
        response = await sendFileMessage({
          ...payloadBase,
          arquivoUrl: fileUrl.trim(),
          mensagem: fileMessage.trim() || undefined,
          fileName: fileName.trim() || undefined,
        });
      } else if (composerType === "buttons") {
        const buttons = buttonsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        if (!buttonsTitle.trim() || buttons.length === 0) {
          toast.error("Informe um título e pelo menos um botão");
          return;
        }
        response = await sendButtonsMessage({ ...payloadBase, titulo: buttonsTitle.trim(), botoes: buttons });
      } else if (composerType === "list") {
        const items = listItemsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [title, description] = line.split("|");
            return {
              title: title?.trim() || line,
              description: description?.trim() || undefined,
            };
          });

        if (items.length === 0) {
          toast.error("Adicione pelo menos um item na lista");
          return;
        }

        response = await sendListMessage({
          ...payloadBase,
          titulo: listTitle.trim() || undefined,
          listaDeItens: items,
        });
      }

      if (response?.conversation && response?.message) {
        upsertConversation(response.conversation);
        appendMessage(response.conversation.contactNumber, response.message);
      }

      resetComposer();
      toast.success("Mensagem enviada com sucesso");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Falha ao enviar mensagem"));
    } finally {
      setSending(false);
    }
  }, [
    agentId,
    agentName,
    appendMessage,
    buttonsText,
    buttonsTitle,
    composerType,
    fileMessage,
    fileName,
    fileUrl,
    imageCaption,
    imageUrl,
    listItemsText,
    listTitle,
    selectedConversation?.displayName,
    selectedNumber,
    textMessage,
    upsertConversation,
  ]);

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString();
      if (result) {
        setImageUrl(result);
        setImageCaption(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString();
      if (result) {
        setFileUrl(result);
        setFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const connectionStatusLabel = sessionStatus?.connected === false
    ? "Desconectado"
    : sessionStatus?.connected === true
    ? "Conectado"
    : sessionStatus?.state || "Indefinido";

  return (
    <Layout>
      {!allowed ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
          <p className="max-w-md text-muted-foreground">
            O módulo de atendimento via WhatsApp está disponível apenas para administradores e supervisores.
          </p>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-6rem)] min-h-[600px] gap-6">
        <aside className="flex w-80 flex-col rounded-lg border bg-card text-card-foreground">
          <div className="border-b p-4">
            <h1 className="text-xl font-semibold">WhatsApp - Z-API</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie conversas em tempo real sem perder o controle do atendimento.
            </p>
          </div>

          <div className="flex flex-col gap-4 border-b p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={sessionStatus?.connected ? "default" : "secondary"}>
                {connectionStatusLabel}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStatus}
                disabled={loadingStatus}
              >
                {loadingStatus ? "Atualizando..." : "Atualizar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshQrCode}
                disabled={loadingQrCode}
              >
                {loadingQrCode ? "Carregando..." : "QR Code"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSessionAction("reconnect")}
                disabled={sessionAction === "reconnect"}
              >
                {sessionAction === "reconnect" ? "Reconectando..." : "Reconectar"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleSessionAction("disconnect")}
                disabled={sessionAction === "disconnect"}
              >
                {sessionAction === "disconnect" ? "Desconectando..." : "Desconectar"}
              </Button>
            </div>
            {qrCode && (
              <div className="rounded-md border bg-background p-2 text-center">
                <p className="mb-2 text-xs text-muted-foreground">Escaneie para iniciar sessão</p>
                <img src={qrCode} alt="QR Code de conexão" className="mx-auto h-32 w-32 object-contain" />
              </div>
            )}
          </div>

          <div className="border-b p-4">
            <p className="text-sm font-medium">Iniciar conversa</p>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Número com DDD"
                value={newConversationNumber}
                onChange={(event) => setNewConversationNumber(event.target.value)}
              />
              <Button onClick={handleCreateConversation}>Abrir</Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 p-2">
                {loadingConversations ? (
                  <p className="px-2 text-sm text-muted-foreground">Carregando conversas...</p>
                ) : conversations.length === 0 ? (
                  <p className="px-2 text-sm text-muted-foreground">Nenhuma conversa registrada.</p>
                ) : (
                  conversations.map((conversation) => {
                    const isActive = conversation.contactNumber === selectedNumber;
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={cn(
                          "w-full rounded-md p-3 text-left transition hover:bg-muted",
                          isActive ? "bg-muted" : "bg-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {conversation.displayName || conversation.contactNumber}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="secondary">{conversation.unreadCount}</Badge>
                          )}
                        </div>
                        {conversation.lastMessagePreview && (
                          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                            {conversation.lastMessagePreview}
                          </p>
                        )}
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {conversation.lastAgentName
                              ? `Atendido por ${conversation.lastAgentName}`
                              : "Aguardando agente"}
                          </span>
                          <span>{formatDate(conversation.lastMessageAt)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>

        <section className="flex flex-1 flex-col rounded-lg border bg-card text-card-foreground">
          {selectedConversation ? (
            <>
              <header className="flex items-center justify-between border-b p-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedConversation.displayName || selectedConversation.contactNumber || DEFAULT_DISPLAY_NAME}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Conversa com {selectedConversation.contactNumber}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Última atualização</p>
                  <p className="font-medium">{formatDate(selectedConversation.lastMessageAt)}</p>
                </div>
              </header>

              <div className="flex-1 overflow-hidden">
                {loadingMessagesNumber === selectedConversation.contactNumber ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Carregando mensagens...
                  </div>
                ) : (
                  <ScrollArea className="h-full px-6 py-4">
                    <div className="space-y-4">
                      {messagesForSelectedConversation.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                          Nenhuma mensagem nesta conversa ainda. Envie uma mensagem para iniciar o atendimento.
                        </p>
                      ) : (
                        messagesForSelectedConversation.map((message) => {
                          const isOutgoing = message.direction === "outgoing";
                          return (
                            <div
                              key={message.id}
                              className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}
                            >
                              <div
                                className={cn(
                                  "max-w-[70%] rounded-lg px-4 py-3 shadow-sm",
                                  isOutgoing
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide">
                                    {isOutgoing
                                      ? message.agentName || agentName
                                      : message.agentName || selectedConversation.displayName || DEFAULT_DISPLAY_NAME}
                                  </span>
                                  <span className="text-[10px] opacity-80">
                                    {format(new Date(message.timestamp), "HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                                <div className="mt-2 space-y-2 text-sm">
                                  {message.type === "image" && message.mediaUrl && (
                                    <img
                                      src={message.mediaUrl}
                                      alt={message.caption || "Imagem"}
                                      className="max-h-56 w-full rounded-md object-cover"
                                    />
                                  )}
                                  {message.type === "file" && message.mediaUrl && (
                                    <a
                                      href={message.mediaUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={cn(
                                        "inline-flex items-center rounded-md border px-3 py-2 text-xs font-medium transition",
                                        isOutgoing
                                          ? "border-primary-foreground/50 hover:bg-primary-foreground/10"
                                          : "border-border hover:bg-background"
                                      )}
                                    >
                                      {message.fileName || "Baixar arquivo"}
                                    </a>
                                  )}
                                  {message.type === "buttons" && message.buttons && (
                                    <div className="flex flex-wrap gap-2">
                                      {message.buttons.map((button) => (
                                        <span
                                          key={button}
                                          className={cn(
                                            "rounded-full border px-3 py-1 text-xs",
                                            isOutgoing
                                              ? "border-primary-foreground/50"
                                              : "border-border"
                                          )}
                                        >
                                          {button}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {message.type === "list" && message.listItems && (
                                    <div className="space-y-2 text-xs">
                                      {message.listItems.map((item, index) => (
                                        <div key={`${message.id}-${index}`} className="rounded-md border border-dashed p-2">
                                          <p className="font-semibold">{item.title as string}</p>
                                          {item.description && (
                                            <p className="text-muted-foreground">{item.description as string}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {message.content && (
                                    <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div ref={bottomRef} />
                  </ScrollArea>
                )}
              </div>

              <footer className="border-t bg-muted/40 p-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Tipo de mensagem</label>
                    <Select value={composerType} onValueChange={(value) => setComposerType(value as MessageComposerType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="file">Arquivo</SelectItem>
                        <SelectItem value="buttons">Botões</SelectItem>
                        <SelectItem value="list">Lista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {composerType === "text" && (
                    <Textarea
                      value={textMessage}
                      onChange={(event) => setTextMessage(event.target.value)}
                      placeholder="Digite sua mensagem"
                      rows={3}
                    />
                  )}

                  {composerType === "image" && (
                    <div className="grid gap-3">
                      <Input
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                        placeholder="URL da imagem ou carregue um arquivo"
                      />
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <input type="file" accept="image/*" onChange={handleImageFileChange} />
                        <span>Formatos suportados: JPG, PNG, GIF</span>
                      </div>
                      <Input
                        value={imageCaption}
                        onChange={(event) => setImageCaption(event.target.value)}
                        placeholder="Legenda opcional"
                      />
                    </div>
                  )}

                  {composerType === "file" && (
                    <div className="grid gap-3">
                      <Input
                        value={fileUrl}
                        onChange={(event) => setFileUrl(event.target.value)}
                        placeholder="URL do arquivo ou carregue um arquivo"
                      />
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <input type="file" onChange={handleFileChange} />
                        <span>Arquivos grandes podem demorar para enviar</span>
                      </div>
                      <Input
                        value={fileName}
                        onChange={(event) => setFileName(event.target.value)}
                        placeholder="Nome do arquivo (opcional)"
                      />
                      <Textarea
                        value={fileMessage}
                        onChange={(event) => setFileMessage(event.target.value)}
                        placeholder="Mensagem adicional"
                        rows={2}
                      />
                    </div>
                  )}

                  {composerType === "buttons" && (
                    <div className="grid gap-3">
                      <Input
                        value={buttonsTitle}
                        onChange={(event) => setButtonsTitle(event.target.value)}
                        placeholder="Título da mensagem"
                      />
                      <Textarea
                        value={buttonsText}
                        onChange={(event) => setButtonsText(event.target.value)}
                        placeholder={`Um botão por linha. Exemplo:\nSim\nNão\nTalvez`}
                        rows={3}
                      />
                    </div>
                  )}

                  {composerType === "list" && (
                    <div className="grid gap-3">
                      <Input
                        value={listTitle}
                        onChange={(event) => setListTitle(event.target.value)}
                        placeholder="Título da lista (opcional)"
                      />
                      <Textarea
                        value={listItemsText}
                        onChange={(event) => setListItemsText(event.target.value)}
                        placeholder={`Um item por linha. Use | para adicionar descrição. Exemplo:\nPlano Básico|R$ 100,00\nPlano Premium|R$ 200,00`}
                        rows={4}
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleSendMessage} disabled={sending}>
                      {sending ? "Enviando..." : "Enviar mensagem"}
                    </Button>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-muted-foreground">
              <h2 className="text-2xl font-semibold text-foreground">Selecione uma conversa</h2>
              <p className="max-w-md">
                Escolha um contato na lista ao lado ou inicie uma nova conversa inserindo o número com DDD para começar o atendimento.
              </p>
            </div>
          )}
        </section>
        </div>
      )}
    </Layout>
  );
}
