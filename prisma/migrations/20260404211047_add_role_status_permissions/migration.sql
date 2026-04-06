-- CreateTable
CREATE TABLE "RoleStatusPermission" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "RoleStatusPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleStatusPermission_role_status_key" ON "RoleStatusPermission"("role", "status");
