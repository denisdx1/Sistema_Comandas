-- CreateTable
CREATE TABLE "AsignacionTrabajo" (
    "id" SERIAL NOT NULL,
    "bartenderId" INTEGER NOT NULL,
    "mozoId" INTEGER,
    "cajaId" INTEGER NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsignacionTrabajo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AsignacionTrabajo" ADD CONSTRAINT "AsignacionTrabajo_bartenderId_fkey" FOREIGN KEY ("bartenderId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionTrabajo" ADD CONSTRAINT "AsignacionTrabajo_mozoId_fkey" FOREIGN KEY ("mozoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionTrabajo" ADD CONSTRAINT "AsignacionTrabajo_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
