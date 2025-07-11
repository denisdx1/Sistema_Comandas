import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Crear rol de ADMIN si no existe
  const adminRole = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' },
    update: {},
    create: {
      nombre: 'ADMIN',
    },
  });

  // Crear rol de BARTENDER si no existe
  const bartenderRole = await prisma.rol.upsert({
    where: { nombre: 'BARTENDER' },
    update: {},
    create: {
      nombre: 'BARTENDER',
    },
  });

  // Crear rol de MOZO si no existe
  const mozoRole = await prisma.rol.upsert({
    where: { nombre: 'MOZO' },
    update: {},
    create: {
      nombre: 'MOZO',
    },
  });

  // Crear categoría Tragos si no existe
  const categoriaTragos = await prisma.categoria.upsert({
    where: { nombre: 'Tragos' },
    update: {},
    create: {
      nombre: 'Tragos',
    },
  });

  // Crear categoría Comidas si no existe
  const categoriaComidas = await prisma.categoria.upsert({
    where: { nombre: 'Comidas' },
    update: {},
    create: {
      nombre: 'Comidas',
    },
  });

  // Crear usuario administrador si no existe
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@sistema.com',
      password: adminPassword,
      rolId: adminRole.id,
    },
  });

  // Crear usuario bartender si no existe
  const bartenderPassword = await bcrypt.hash('bartender123', 10);
  const bartenderUser = await prisma.usuario.upsert({
    where: { email: 'bartender@sistema.com' },
    update: {},
    create: {
      nombre: 'Bartender',
      email: 'bartender@sistema.com',
      password: bartenderPassword,
      rolId: bartenderRole.id,
    },
  });

  // Crear algunos productos de ejemplo
  const producto1 = await prisma.producto.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Cerveza Corona',
      precio: 25.00,
      categoriaId: categoriaTragos.id,
    },
  });

  const producto2 = await prisma.producto.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nombre: 'Mojito',
      precio: 45.00,
      categoriaId: categoriaTragos.id,
    },
  });

  const producto3 = await prisma.producto.upsert({
    where: { id: 3 },
    update: {},
    create: {
      nombre: 'Hamburguesa Clásica',
      precio: 85.00,
      categoriaId: categoriaComidas.id,
    },
  });

  const producto4 = await prisma.producto.upsert({
    where: { id: 4 },
    update: {},
    create: {
      nombre: 'Margarita',
      precio: 55.00,
      categoriaId: categoriaTragos.id,
    },
  });

  console.log({
    adminRole,
    bartenderRole,
    mozoRole,
    categoriaTragos,
    categoriaComidas,
    adminUser,
    bartenderUser,
    productos: [producto1, producto2, producto3, producto4]
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });