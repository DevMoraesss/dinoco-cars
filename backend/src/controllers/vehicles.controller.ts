import { Request, Response } from 'express';
import { prisma } from '../index';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// 4. Função para LISTAR os veículos (com lógica de paginação/busca)
const getAll = async (req: Request, res: Response) => {
  // Pegamos os parâmetros da URL, ex: /api/vehicles?page=1&search=Gol
  const { page, limit, search, orderBy, order } = req.query;

  // Se algum desses parâmetros existir, usamos a lógica de paginação.
  if (page || limit || search || orderBy || order) {
    try {
      return res.json(await getPaginatedVehicles(req.query));
    } catch (error) {
      return res.status(400).json({ message: error instanceof PrismaClientKnownRequestError ? error.message : "Erro inesperado" });
    }
  }

  // Caso contrário, simplesmente buscamos TODOS os veículos no banco.
  const allVehicles = await prisma.vehicle.findMany();
  return res.json({ data: allVehicles });
};

const create = async (req : Request, res : Response) => {
    try {
        const { licensePlate, brand, model, year, kilometers, price } = req.body
        const newVehicle = await prisma.vehicle.create({
            data: {
                licensePlate,
                brand,
                model,
                year,
                kilometers,
                price
            }
        });
        return res.status(201).json(newVehicle);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const getPaginatedVehicles = async (query: any) => {
  // Lógica para tratar e definir valores padrão para os parâmetros
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const search = (query.search as string) || '';

  // Lógica de busca em múltiplos campos
  const whereClause = {
    OR: [
      { brand: { contains: search, mode: 'insensitive' as const } },
      { model: { contains: search, mode: 'insensitive' as const } },
      { licensePlate: { contains: search, mode: 'insensitive' as const } },
    ],
  };

  // Fazemos 2 requisições ao banco ao mesmo tempo para mais eficiência
  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: whereClause,
      skip: (page - 1) * limit, // Pula os registros das páginas anteriores
      take: limit,             // Pega apenas a quantidade de registros desta página
    }),
    prisma.vehicle.count({ where: whereClause }), // Conta o total de registros que correspondem à busca
  ]);

  // Retorna um objeto estruturado que é perfeito para o frontend montar a paginação
  return {
    data: vehicles,
    total,
    page,
    lastPage: Math.ceil(total / limit),
  };
};


export default {
  getAll,
  create,
  getPaginatedVehicles,
}