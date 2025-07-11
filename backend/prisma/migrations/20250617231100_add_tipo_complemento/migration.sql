-- CreateEnum
CREATE TYPE "TipoComplemento" AS ENUM ('NO_ES_COMPLEMENTO', 'BEBIDA_PARA_LICOR', 'OTRO_COMPLEMENTO');

-- AlterTable
ALTER TABLE "OrdenItem" ADD COLUMN     "productoAsociadoId" INTEGER,
ADD COLUMN     "tipoComplemento" "TipoComplemento" NOT NULL DEFAULT 'NO_ES_COMPLEMENTO';

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "tipoComplemento" "TipoComplemento" NOT NULL DEFAULT 'NO_ES_COMPLEMENTO';
