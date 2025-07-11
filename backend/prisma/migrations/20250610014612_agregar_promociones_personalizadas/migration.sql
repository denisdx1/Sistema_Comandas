-- AlterTable
ALTER TABLE "OrdenItem" ADD COLUMN     "esPromocionPersonalizada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nombre" TEXT,
ADD COLUMN     "precio" DECIMAL(10,2);
