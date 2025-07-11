/*
  Warnings:

  - Added the required column `precio` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "precio" DECIMAL(10,2) NOT NULL;
