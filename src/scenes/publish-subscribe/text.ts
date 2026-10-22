// Verbatim article fragments and Anypoint MQ diagram labels (design §4).
// Wrapping belongs in layout/view data; never shorten these identifiers.
import type { Lang } from "../catalogue";
import type { FlowPhaseId } from "./timeline";
export type PubSubText = {
  api: string; subtitle: string; mq: string; exchange: string; exchangeId: string;
  publish: string; binding: string; queue: string; subscriber: string;
  queueIds: readonly string[]; consumers: readonly string[];
  captions: Record<FlowPhaseId, string>;
};
export const text: Record<Lang, PubSubText> = {
  pt: {
    api: "API de pedidos", subtitle: "(aplicação Mule)", mq: "Anypoint MQ",
    exchange: "Message exchange", exchangeId: "order-created", publish: "Publish", binding: "binding", queue: "fila", subscriber: "Subscriber",
    queueIds: ["order-created-payment", "order-created-inventory", "order-created-invoice"],
    consumers: ["Consumidor de pagamento", "Consumidor de estoque", "Consumidor de nota fiscal"],
    captions: {
      publish: "A API de pedidos publica o evento no message exchange order-created.",
      fanOut: "por padrão, ele envia cada mensagem a todas as filas ligadas",
      consume: "Se o consumidor de nota fiscal falhar, a cópia dele volta para a fila order-created-invoice para nova entrega;",
      failure: "as cópias do pagamento e do estoque estão em outras filas e seguem normalmente",
      final: "A API de pedidos já recebeu a confirmação do Publish e não fica sabendo da falha.",
    },
  },
  en: {
    api: "Orders API", subtitle: "(Mule application)", mq: "Anypoint MQ",
    exchange: "Message exchange", exchangeId: "order-created", publish: "Publish", binding: "binding", queue: "queue", subscriber: "Subscriber",
    queueIds: ["order-created-payment", "order-created-inventory", "order-created-invoice"],
    consumers: ["Payment consumer", "Inventory consumer", "Invoice consumer"],
    captions: {
      publish: "The orders API publishes the event to the order-created message exchange.",
      fanOut: "by default, it sends each message to every bound queue",
      consume: "If the invoice consumer fails, its copy goes back to the order-created-invoice queue for redelivery;",
      failure: "the payment and inventory copies are on other queues and carry on normally",
      final: "The orders API has already received the Publish confirmation and never learns about the failure.",
    },
  },
};
