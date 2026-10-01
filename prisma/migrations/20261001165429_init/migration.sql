-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('clarify', 'feature', 'solution', 'eval', 'redteam');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "currentStage" "Stage" NOT NULL DEFAULT 'clarify',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageOutput" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stage" "Stage" NOT NULL,
    "content" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresetCase" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresetCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_updatedAt_idx" ON "Project"("updatedAt");

-- CreateIndex
CREATE INDEX "StageOutput_projectId_stage_idx" ON "StageOutput"("projectId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "StageOutput_projectId_stage_version_key" ON "StageOutput"("projectId", "stage", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PresetCase_slug_key" ON "PresetCase"("slug");

-- AddForeignKey
ALTER TABLE "StageOutput" ADD CONSTRAINT "StageOutput_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
