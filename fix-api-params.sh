#!/bin/bash

# Files to fix
files=(
  "src/app/api/verifications/[id]/route.ts"
  "src/app/api/social/[id]/comments/route.ts"
  "src/app/api/social/[id]/like/route.ts"
  "src/app/api/events/[id]/route.ts"
  "src/app/api/organizations/certificates/templates/[id]/toggle/route.ts"
  "src/app/api/organizations/certificates/[id]/revoke/route.ts"
  "src/app/api/organization/members/[id]/role/route.ts"
  "src/app/api/organization/members/[id]/route.ts"
  "src/app/api/organization/events/[id]/duplicate/route.ts"
  "src/app/api/organization/events/[id]/status/route.ts"
  "src/app/api/organization/events/[id]/certificates/bulk-issue/route.ts"
)

# Fix params type in all files
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file"
    # Replace { params: { id: string } } with { params: Promise<{ id: string }> }
    sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"
    # Add await params where needed
    sed -i 's/const { id } = params/const { id } = await params/g' "$file"
    sed -i 's/params\.id/id/g' "$file"
  fi
done

echo "API parameter types fixed!"
