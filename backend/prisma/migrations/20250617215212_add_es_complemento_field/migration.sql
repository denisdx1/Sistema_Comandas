-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "descripcion" TEXT;

-- AlterTable
ALTER TABLE "OrdenItem" ADD COLUMN     "esComplemento" BOOLEAN NOT NULL DEFAULT false;
