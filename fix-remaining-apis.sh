#!/bin/bash

# Files that need the await params fix
files=(
  "src/app/api/verifications/[id]/route.ts"
  "src/app/api/organizations/certificates/templates/[id]/toggle/route.ts"
  "src/app/api/organizations/certificates/[id]/revoke/route.ts"
  "src/app/api/organization/events/[id]/duplicate/route.ts"
  "src/app/api/organization/events/[id]/status/route.ts"
  "src/app/api/organization/events/[id]/certificates/bulk-issue/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file"
    
    # Add const { id } = await params; after session/auth checks
    # Look for patterns after session check and before first prisma call
    sed -i '/const session = await getServerSession/,/}$/{
      /const session = await getServerSession/,/return NextResponse\.json.*Unauthorized/ {
        /return NextResponse\.json.*Unauthorized/a\
\
    const { id } = await params;
      }
    }' "$file"
    
    # Also handle getSession pattern
    sed -i '/const session = await getSession/,/}$/{
      /const session = await getSession/,/return NextResponse\.json.*Unauthorized/ {
        /return NextResponse\.json.*Unauthorized/a\
\
    const { id } = await params;
      }
    }' "$file"
    
    # Fix any remaining "where: { id: id }" to "where: { id }"
    sed -i 's/where: { id: id }/where: { id }/g' "$file"
    
  fi
done

echo "Remaining API fixes applied!"
