// home/ubuntu/impaktrweb/src/app/api/organizations/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToS3 } from '@/lib/aws';
import { z } from 'zod';
import { UserType, OrganizationTier } from '@prisma/client';

const organizationRegistrationSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  registrationNumber: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  type: z.string().min(1, 'Organization type is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required'),
  contactPersonName: z.string().min(1, 'Contact person name is required'),
  contactPersonRole: z.string().min(1, 'Contact person role is required'),
  contactPersonEmail: z.string().email('Valid email is required'),
  contactPersonPhone: z.string().optional(),
  sdgFocus: z.string().transform((str) => JSON.parse(str)).pipe(z.array(z.number().min(1).max(17))),
  profileType: z.nativeEnum(UserType),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[Registration] Starting organization registration...');
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Registration] Parsing form data...');
    const formData = await request.formData();
    
    // Extract form fields
    const data: any = {};
    const files: { [key: string]: File } = {};
    
    formData.forEach((value, key) => {
      if (value instanceof File) {
        files[key] = value;
      } else {
        data[key] = value;
      }
    });

    // Validate the data
    console.log('[Registration] Validating data...');
    const validatedData = organizationRegistrationSchema.parse(data);

    // Check if user exists
    console.log('[Registration] Checking user...');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upload logo to S3 if provided
    let logoUrl: string | undefined;
    if (files.logo) {
      console.log('[Registration] Uploading logo to S3...');
      const logoKey = `organizations/logos/${user.id}/${Date.now()}-${files.logo.name}`;
      const logoBuffer = Buffer.from(await files.logo.arrayBuffer());
      logoUrl = await uploadToS3(logoBuffer, logoKey, files.logo.type);
      console.log('[Registration] Logo uploaded successfully');
    }

    // Upload verification documents if provided
    const verificationDocUrls: string[] = [];
    for (const [key, file] of Object.entries(files)) {
      if (key.startsWith('verificationDoc_')) {
        console.log(`[Registration] Uploading verification document: ${file.name}...`);
        const docKey = `organizations/verification/${user.id}/${Date.now()}-${file.name}`;
        const docBuffer = Buffer.from(await file.arrayBuffer());
        const docUrl = await uploadToS3(docBuffer, docKey, file.type);
        verificationDocUrls.push(docUrl);
        console.log('[Registration] Document uploaded successfully');
      }
    }

    // Create organization
    console.log('[Registration] Creating organization record...');
    const organization = await prisma.organization.create({
      data: {
        ownerId: user.id,
        name: validatedData.organizationName,
        type: validatedData.profileType,
        tier: OrganizationTier.REGISTERED,
        isVerified: false,
        impaktrScore: 0,
      },
    });

    // Update user profile with organization data
    console.log('[Registration] Updating user profile...');
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        organizationName: validatedData.organizationName,
        registrationNumber: validatedData.registrationNumber,
        industry: validatedData.industry,
        companySize: validatedData.companySize,
        description: validatedData.description,
        logo: logoUrl,
        website: validatedData.website || undefined,
        location: {
          city: validatedData.city,
          country: validatedData.country,
        },
        contactPerson: {
          name: validatedData.contactPersonName,
          role: validatedData.contactPersonRole,
          email: validatedData.contactPersonEmail,
          phone: validatedData.contactPersonPhone,
        },
        sdgFocus: validatedData.sdgFocus,
      },
      update: {
        organizationName: validatedData.organizationName,
        registrationNumber: validatedData.registrationNumber,
        industry: validatedData.industry,
        companySize: validatedData.companySize,
        description: validatedData.description,
        logo: logoUrl,
        website: validatedData.website || undefined,
        location: {
          city: validatedData.city,
          country: validatedData.country,
        },
        contactPerson: {
          name: validatedData.contactPersonName,
          role: validatedData.contactPersonRole,
          email: validatedData.contactPersonEmail,
          phone: validatedData.contactPersonPhone,
        },
        sdgFocus: validatedData.sdgFocus,
      },
    });

    // Update user type
    console.log('[Registration] Updating user type...');
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        userType: validatedData.profileType,
        isVerified: verificationDocUrls.length > 0, // Auto-verify if documents provided
      },
    });

    // Create organization member relationship
    console.log('[Registration] Creating organization member relationship...');
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: 'owner',
      },
    });

    // Store verification documents metadata
    if (verificationDocUrls.length > 0) {
      // This would typically go in a separate verification documents table
      // For now, we'll store in the organization's metadata
      // In a real implementation, create a separate VerificationDocument model
    }

    // Initialize SDG badges for the organization (optimized query)
    if (validatedData.sdgFocus.length > 0) {
      console.log('[Registration] Initializing SDG badges...');
      const sdgBadges = await prisma.badge.findMany({
        where: {
          sdgNumber: {
            in: validatedData.sdgFocus
          }
        }
      });
      
      if (sdgBadges.length > 0) {
        await prisma.organizationBadge.createMany({
          data: sdgBadges.map(badge => ({
            organizationId: organization.id,
            badgeId: badge.id,
            progress: 0,
          })),
          skipDuplicates: true,
        });
        console.log(`[Registration] Created ${sdgBadges.length} badge entries`);
      }
    }

    // Send welcome email (implement email service)
    // await sendWelcomeEmail(user.email, validatedData.organizationName, validatedData.profileType);

    // Create initial achievement for completing registration
    console.log('[Registration] Creating achievement...');
    await prisma.achievement.create({
      data: {
        userId: user.id,
        type: 'organization_registered',
        name: 'Organization Registered',
        description: `Successfully registered ${validatedData.organizationName} on Impaktr`,
        icon: '/icons/organization.svg',
        data: {
          organizationType: validatedData.profileType,
          organizationName: validatedData.organizationName,
          sdgFocus: validatedData.sdgFocus,
        },
      },
    });

    console.log('[Registration] Registration completed successfully!');
    return NextResponse.json({
      success: true,
      organization,
      message: 'Organization registered successfully',
      verificationPending: validatedData.profileType !== UserType.CORPORATE && verificationDocUrls.length === 0,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Registration] Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Registration] Error registering organization:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}