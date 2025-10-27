#!/bin/bash

# ESG Validation System Quick Verification Script
# This script checks if all components are working correctly

echo "🧪 ESG Validation System Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Prisma Client
echo "1️⃣  Checking Prisma Client..."
if [ -d "node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✓${NC} Prisma Client is installed"
else
    echo -e "${RED}✗${NC} Prisma Client not found"
    echo "   Run: npx prisma generate"
fi
echo ""

# Check 2: Validation Engine Files
echo "2️⃣  Checking Validation System Files..."
files=(
    "src/lib/esg/validation/engine.ts"
    "src/lib/esg/validation/types.ts"
    "src/lib/esg/validation/validators/FormatValidator.ts"
    "src/lib/esg/validation/validators/ConsistencyValidator.ts"
    "src/lib/esg/validation/validators/TrendValidator.ts"
    "src/lib/esg/validation/validators/IndustryBenchmarkValidator.ts"
    "src/lib/esg/validation/validators/PublicDataValidator.ts"
    "src/lib/esg/validation/validators/AnomalyDetectionValidator.ts"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file NOT FOUND"
        all_files_exist=false
    fi
done
echo ""

# Check 3: API Routes
echo "3️⃣  Checking API Routes..."
api_routes=(
    "src/app/api/organizations/esg-validation/route.ts"
    "src/app/api/organizations/esg-metrics/route.ts"
    "src/app/api/organizations/user-organization/route.ts"
    "src/app/api/test-validation/route.ts"
)

for route in "${api_routes[@]}"; do
    if [ -f "$route" ]; then
        echo -e "${GREEN}✓${NC} $route"
    else
        echo -e "${RED}✗${NC} $route NOT FOUND"
    fi
done
echo ""

# Check 4: Frontend Pages
echo "4️⃣  Checking Frontend Pages..."
pages=(
    "src/app/organization/esg/data-entry/page.tsx"
    "src/app/test-validation/page.tsx"
)

for page in "${pages[@]}"; do
    if [ -f "$page" ]; then
        echo -e "${GREEN}✓${NC} $page"
    else
        echo -e "${RED}✗${NC} $page NOT FOUND"
    fi
done
echo ""

# Check 5: Form Components
echo "5️⃣  Checking Form Components..."
forms=(
    "src/app/organization/esg/data-entry/forms/EnvironmentalForm.tsx"
    "src/app/organization/esg/data-entry/forms/SocialForm.tsx"
    "src/app/organization/esg/data-entry/forms/GovernanceForm.tsx"
    "src/app/organization/esg/data-entry/forms/BatchUploadForm.tsx"
)

for form in "${forms[@]}"; do
    if [ -f "$form" ]; then
        echo -e "${GREEN}✓${NC} $form"
    else
        echo -e "${RED}✗${NC} $form NOT FOUND"
    fi
done
echo ""

# Check 6: Database Schema
echo "6️⃣  Checking Database Schema..."
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓${NC} prisma/schema.prisma found"
    
    # Check for required models
    if grep -q "model ESGMetric" prisma/schema.prisma; then
        echo -e "${GREEN}✓${NC} ESGMetric model exists"
    else
        echo -e "${RED}✗${NC} ESGMetric model not found in schema"
    fi
    
    if grep -q "model ValidationResult" prisma/schema.prisma; then
        echo -e "${GREEN}✓${NC} ValidationResult model exists"
    else
        echo -e "${RED}✗${NC} ValidationResult model not found in schema"
    fi
else
    echo -e "${RED}✗${NC} prisma/schema.prisma NOT FOUND"
fi
echo ""

# Check 7: Development Server
echo "7️⃣  Checking Development Server..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}✓${NC} Development server is running on port 3000"
    echo ""
    echo "📊 You can test the system at:"
    echo "   • Data Entry: http://localhost:3000/organization/esg/data-entry?tab=environmental"
    echo "   • Test Page:  http://localhost:3000/test-validation"
    echo "   • Test API:   http://localhost:3000/api/test-validation"
else
    echo -e "${YELLOW}⚠${NC}  Development server is NOT running"
    echo "   Start it with: npm run dev"
fi
echo ""

# Summary
echo "======================================"
echo "📋 Summary"
echo "======================================"

if [ "$all_files_exist" = true ]; then
    echo -e "${GREEN}✅ All validation system files are present${NC}"
else
    echo -e "${RED}❌ Some files are missing${NC}"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. Visit http://localhost:3000/test-validation"
echo "   3. Click 'Run All Tests' button"
echo "   4. Verify all 6 validators pass"
echo "   5. Test data entry at http://localhost:3000/organization/esg/data-entry"
echo ""

