-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO');

-- AlterTable
ALTER TABLE "MovimientoCaja" ADD COLUMN     "metodoPago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO';
