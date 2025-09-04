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
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const validatedData = organizationRegistrationSchema.parse(data);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upload logo to S3 if provided
    let logoUrl: string | undefined;
    if (files.logo) {
      const logoKey = `organizations/logos/${user.id}/${Date.now()}-${files.logo.name}`;
      const logoBuffer = Buffer.from(await files.logo.arrayBuffer());
      logoUrl = await uploadToS3(logoBuffer, logoKey, files.logo.type);
    }

    // Upload verification documents if provided
    const verificationDocUrls: string[] = [];
    for (const [key, file] of Object.entries(files)) {
      if (key.startsWith('verificationDoc_')) {
        const docKey = `organizations/verification/${user.id}/${Date.now()}-${file.name}`;
        const docBuffer = Buffer.from(await file.arrayBuffer());
        const docUrl = await uploadToS3(docBuffer, docKey, file.type);
        verificationDocUrls.push(docUrl);
      }
    }

    // Create organization
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
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        userType: validatedData.profileType,
        isVerified: verificationDocUrls.length > 0, // Auto-verify if documents provided
      },
    });

    // Create organization member relationship
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

    // Initialize SDG badges for the organization
    const allBadges = await prisma.badge.findMany();
    const orgBadgePromises = validatedData.sdgFocus.map(async (sdgNumber) => {
      const sdgBadges = allBadges.filter(badge => badge.sdgNumber === sdgNumber);
      
      return Promise.all(sdgBadges.map(badge =>
        prisma.organizationBadge.create({
          data: {
            organizationId: organization.id,
            badgeId: badge.id,
            progress: 0,
          },
        })
      ));
    });

    await Promise.all(orgBadgePromises);

    // Send welcome email (implement email service)
    // await sendWelcomeEmail(user.email, validatedData.organizationName, validatedData.profileType);

    // Create initial achievement for completing registration
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

    return NextResponse.json({
      success: true,
      organization,
      message: 'Organization registered successfully',
      verificationPending: validatedData.profileType !== UserType.CORPORATE && verificationDocUrls.length === 0,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error registering organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}