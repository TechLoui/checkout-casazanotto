import dotenv from "dotenv";

dotenv.config();

const required = ["ARTAX_CLIENT_ID", "ARTAX_CLIENT_SECRET", "REDE_PV", "REDE_TOKEN"];

export const config = {
  port: Number(process.env.PORT) || 8080,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  artax: {
    baseUrl: (process.env.ARTAX_BASE_URL || "https://artaxnet.com/pms-api/v1").replace(/\/$/, ""),
    clientId: process.env.ARTAX_CLIENT_ID || "",
    clientSecret: process.env.ARTAX_CLIENT_SECRET || "",
    webhookToken: process.env.ARTAX_WEBHOOK_TOKEN || "",
    // Como interpretar o "price" retornado na disponibilidade:
    //   "total"     -> preço já é o total da estadia (padrão, igual ao exemplo da doc)
    //   "per_night" -> preço é por diária; multiplicamos pelo nº de noites
    priceMode: process.env.ARTAX_PRICE_MODE === "per_night" ? "per_night" : "total"
  },

  rede: {
    baseUrl: (process.env.REDE_BASE_URL || "https://api.userede.com.br/desenvolvedores/v1").replace(/\/$/, ""),
    pv: process.env.REDE_PV || "",
    token: process.env.REDE_TOKEN || "",
    softDescriptor: process.env.REDE_SOFT_DESCRIPTOR || "CasaZanotto",
    maxInstallments: Number(process.env.MAX_INSTALLMENTS) || 6
  }
};

/** Logs a warning for any credential that is still missing so deploys fail loudly. */
export const assertConfig = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.warn(
      `[config] Variáveis de ambiente ausentes: ${missing.join(", ")}. ` +
        "Preencha o .env antes de processar pagamentos reais."
    );
  }
};
