import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

// 1. Configuración Segura del Pool de Conexiones
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('❌ VARIABLE DE ENTORNO CRÍTICA FALTANTE: DATABASE_URL no está definida.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Inyección del Adaptador en el Prisma Client (Estándar v7)
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log('🌱 Iniciando proceso de seeding seguro...');

  // 1. Verificamos si el gerente inicial ya existe para ser idempotentes
  const existingManager = await prisma.user.findUnique({
    where: { email: 'gerente@metalurgia-erp.com' },
  });

  if (existingManager) {
    console.log('⚠️ El Gerente principal ya existe. Omitiendo creación.');
    return;
  }

  // 2. Hashing paranoico: Configuramos Argon2id
  console.log('🔐 Generando hash criptográfico para la contraseña...');
  
  
  const rawPassword = 'TempPassword2026!'; 
  const passwordHash = await argon2.hash(rawPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // Uso intensivo de RAM (mitiga ataques de GPU)
    timeCost: 3,         // Iteraciones de CPU
    parallelism: 1,
  });

  // 3. Inserción en Base de Datos
  const manager = await prisma.user.create({
    data: {
      email: 'gerente@metalurgia-erp.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'MANAGER',
    },
  });

  console.log(`✅ Seeding completado con éxito. Usuario MANAGER creado con ID: ${manager.id}`);
  console.log('⚠️ ATENCIÓN: El Gerente DEBE cambiar su contraseña en el primer inicio de sesión.');
}

main()
  .catch((e) => {
    console.error('❌ Error crítico durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cerramos el pool de conexiones de Prisma eficientemente
    await prisma.$disconnect();
  });