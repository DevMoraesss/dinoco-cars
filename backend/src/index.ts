// Importações de bibliotecas e de nossas próprias peças
import express from 'express';
import 'express-async-errors'; // Essencial para o tratamento de erros em rotas async
import cors from 'cors';
import dotenv from 'dotenv';
import vehicleRouter from './routes/vehicles.routes'; // <-- Ponto de atenção 1: Importando o router com o novo nome
import { PrismaClient } from '@prisma/client';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// --- Instâncias e Variáveis ---
export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// --- Função Principal de Inicialização ---
async function main() {
  // Ponto de atenção 2: Garante a conexão com o banco ANTES de tudo
  await prisma.$connect();
  console.log("✅ Database connection established successfully.");

  // --- Middlewares (Plugins que rodam em todas as requisições) ---
  app.use(cors());          // Permite que o frontend acesse a API
  app.use(express.json());  // Permite que o servidor entenda corpos de requisição em JSON

  // --- Rotas ---
  // Ponto de atenção 3: Qualquer requisição para /api será gerenciada pelo nosso vehicleRouter
  app.use('/api', vehicleRouter);

  // --- Middlewares de Tratamento de Erro (SEMPRE no final) ---
  // Se nenhuma rota for encontrada, responde com 404
  app.all('*', (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
  });

  // Nosso "Hospital" de Erros. Se qualquer rota acima der um erro, ele será ativado.
  //app.use(errorHandler);

  // --- Inicialização do Servidor ---
  app.listen(PORT, () => {
    console.log(`🚀 Server is running successfully on port ${PORT}`);
  });
}

// --- Execução da Função Principal ---
main()
  .catch(async (e) => {
    console.error("❌ Error during server startup:", e);
    await prisma.$disconnect();
    process.exit(1); // Encerra o processo se houver um erro fatal na inicialização
  });