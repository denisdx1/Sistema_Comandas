/*
  Warnings:

  - Made the column `sucursalId` on table `Caja` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Caja" DROP CONSTRAINT "Caja_sucursalId_fkey";

-- AlterTable
ALTER TABLE "Caja" ALTER COLUMN "sucursalId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
