-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "sdgFocusAreas" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
