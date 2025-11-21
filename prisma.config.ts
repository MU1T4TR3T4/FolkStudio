import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

// Carrega variáveis de ambiente do .env.local para desenvolvimento local
dotenv.config({ path: ".env.local" });

export default defineConfig({
  datasource: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!,
  },
});
