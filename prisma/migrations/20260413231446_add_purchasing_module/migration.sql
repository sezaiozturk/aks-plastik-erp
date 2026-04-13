-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "contactName" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasingRequest" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "requestedBy" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "category" TEXT NOT NULL DEFAULT 'General',
    "estimatedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "budgetCode" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Request',
    "budgetApproved" BOOLEAN NOT NULL DEFAULT false,
    "budgetNotes" TEXT NOT NULL DEFAULT '',
    "rejectionReason" TEXT NOT NULL DEFAULT '',
    "poCreatedDate" TEXT,
    "shippingCompany" TEXT NOT NULL DEFAULT '',
    "trackingNumber" TEXT NOT NULL DEFAULT '',
    "qcResult" TEXT NOT NULL DEFAULT '',
    "qcDate" TEXT,
    "qcNotes" TEXT NOT NULL DEFAULT '',
    "invoiceNo" TEXT NOT NULL DEFAULT '',
    "invoiceDate" TEXT,
    "invoiceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiceMatched" BOOLEAN NOT NULL DEFAULT false,
    "paymentDueDate" TEXT,
    "paymentDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasingQuotation" (
    "id" TEXT NOT NULL,
    "quotationNo" TEXT NOT NULL DEFAULT '',
    "quotationDate" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "vat" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "deliveryDays" INTEGER,
    "paymentTerms" TEXT NOT NULL DEFAULT '',
    "warranty" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "supplierName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,
    "supplierId" TEXT,

    CONSTRAINT "PurchasingQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasingRequest_code_key" ON "PurchasingRequest"("code");

-- AddForeignKey
ALTER TABLE "PurchasingQuotation" ADD CONSTRAINT "PurchasingQuotation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PurchasingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasingQuotation" ADD CONSTRAINT "PurchasingQuotation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
