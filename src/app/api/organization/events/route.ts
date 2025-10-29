// home/ubuntu/impaktrweb/src/app/api/organization/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus, EventCategory } from '@/types/enums';
import { Prisma } from '@prisma/client';
import { uploadToS3, FileSystemError } from '@/lib/aws';

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  startDate: z.string().min(1, "Start date is required").transform((str) => new Date(str)),
  endDate: z.union([
    z.string().min(1).transform((str) => new Date(str)),
    z.undefined(),
    z.null()
  ]).optional().transform(val => {
    if (!val || val === null) return undefined;
    return val instanceof Date ? val : new Date(val);
  }),
  registrationDeadline: z.union([
    z.string().min(1).transform((str) => new Date(str)),
    z.undefined(),
    z.null()
  ]).optional().transform(val => {
    if (!val || val === null) return undefined;
    return val instanceof Date ? val : new Date(val);
  }),
  location: z.object({
    address: z.string().optional().default(''),
    city: z.string().optional().default(''),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional().nullable().transform(val => val === null ? undefined : val),
    isVirtual: z.boolean().default(false),
  }),
  maxParticipants: z.union([
    z.number().positive(),
    z.undefined(),
    z.null()
  ]).optional().transform(val => {
    if (!val || val === null) return undefined;
    return val;
  }),
  sdgTags: z.array(z.number().min(1).max(17)).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  intensity: z.number().min(0.8).max(1.2).default(1.0),
  verificationType: z.enum(['ORGANIZER', 'PEER', 'GPS', 'SELF']).default('ORGANIZER'),
  images: z.array(z.string()).optional(),
  certificateTemplate: z.string().optional(),
  autoIssueCertificates: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  eventInstructions: z.string().optional().default(''),
  materialsNeeded: z.array(z.string()).optional().default([]),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }).optional().nullable(),
});

const querySchema = z.object({
  page: z.string().transform((str) => parseInt(str)).default('1'),
  limit: z.string().transform((str) => parseInt(str)).default('10'),
  search: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  sdg: z.string().transform((str) => parseInt(str)).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organizations where user is admin or owner
    const adminOrganizations = user.organizationMemberships.filter(
      membership => membership.role === 'admin' || membership.role === 'owner'
    );

    if (adminOrganizations.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    const organizationIds = adminOrganizations.map(m => m.organizationId);

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { page, limit, search, status, sdg, startDate, endDate } = querySchema.parse(params);

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      organizationId: { in: organizationIds },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (sdg) {
      where.sdg = sdg.toString(); // Convert number to string for sdg field
    }

    if (startDate) {
      where.startDate = { gte: startDate };
    }

    if (endDate) {
      where.startDate = { lte: endDate };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: true,
          participations: {
            include: {
              user: true
            }
          },
          images: {
            orderBy: { createdAt: 'asc' },
            take: 1, // Only get the first image (cover)
          },
          _count: {
            select: {
              participations: {
                where: { status: 'VERIFIED' }
              }
            }
          }
        },
      }),
      prisma.event.count({ where }),
    ]);

    // Parse location JSON strings and add calculated fields
    const eventsWithStats = events.map(event => {
      // Parse location JSON string to object
      let location = {
        address: '',
        city: '',
        isVirtual: false
      };
      
      try {
        if (event.location && typeof event.location === 'string') {
          location = JSON.parse(event.location);
        } else if (event.location && typeof event.location === 'object') {
          location = event.location as any;
        }
      } catch (error) {
        console.error('Error parsing location JSON:', error);
        // Keep default location values
      }
      
      // Ensure location fields are properly set
      // If isVirtual is true, ensure address and city are empty strings
      if (location.isVirtual) {
        location.address = '';
        location.city = '';
      }
      
      // Get cover image URL from EventImage or fallback to imageUrl field
      const coverImageUrl = event.images && event.images.length > 0 
        ? event.images[0].url 
        : event.imageUrl;
      
      return {
        ...event,
        location,
        coverImage: coverImageUrl,
        stats: {
          totalParticipants: 0, // We need to get this separately
          verifiedParticipants: 0, // We need to get this separately
          completionRate: 0, // We need to get this separately
          totalHours: 0, // We need to get this separately
        }
      };
    });

    return NextResponse.json({
      events: eventsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching organization events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to parse as FormData first, then fall back to JSON
    const contentType = request.headers.get('content-type');
    
    let body;
    let imageFiles: File[] = [];
    
    // Clone the request so we can try multiple parsing methods
    let requestClone = request.clone();
    
    try {
      // Try FormData first
      const formData = await request.formData();
      const eventDataString = formData.get('eventData');
      
      if (eventDataString && typeof eventDataString === 'string') {
        console.log('Parsing FormData, eventData string:', eventDataString.substring(0, 100));
        body = JSON.parse(eventDataString);
        
        // Collect image files
        let imageIndex = 0;
        while (formData.has(`image_${imageIndex}`)) {
          const file = formData.get(`image_${imageIndex}`) as File;
          if (file && file.size > 0) {
            imageFiles.push(file);
          }
          imageIndex++;
        }
        console.log('Received images from FormData:', imageFiles.length);
      } else {
        // No eventData in FormData, might be pure JSON request
        throw new Error('No eventData in FormData');
      }
    } catch (formDataError) {
      // If FormData parsing fails, try JSON
      console.log('FormData parsing failed, trying JSON:', formDataError);
      try {
        body = await requestClone.json();
        console.log('Successfully parsed as JSON');
      } catch (jsonError) {
        console.error('Both FormData and JSON parsing failed');
        throw new Error('Invalid request format');
      }
    }
    
    console.log('Received event data:', JSON.stringify(body, null, 2));
    console.log('Total images to upload:', imageFiles.length);
    
    const validatedData = createEventSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to create events for any organization
    const adminMembership = user.organizationMemberships.find(
      membership => membership.role === 'admin' || membership.role === 'owner'
    );

    if (!adminMembership) {
      return NextResponse.json(
        { error: 'No organization admin access' },
        { status: 403 }
      );
    }

    // Use the first admin organization (in a real app, this should be specified)
    const organizationId = adminMembership.organizationId;

    // Upload images to S3 if any
    const imageUrls: string[] = [];
    let uploadErrors: string[] = [];
    
    // Validate image types before upload
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      // Validate file type
      if (!allowedImageTypes.includes(file.type.toLowerCase())) {
        const errorMsg = `Unsupported image type: supported formats are jpeg, png, gif, or webp.`;
        uploadErrors.push(`Image ${i + 1} (${file.name}): ${errorMsg}`);
        console.error(`Invalid image type for ${file.name}: ${file.type}`);
        continue;
      }
      
      // Validate file size
      if (file.size > maxFileSize) {
        const errorMsg = `File too large: maximum size is 5MB.`;
        uploadErrors.push(`Image ${i + 1} (${file.name}): ${errorMsg}`);
        console.error(`File too large: ${file.name} (${file.size} bytes)`);
        continue;
      }
      
      try {
        console.log(`Uploading image ${i + 1}/${imageFiles.length}: ${file.name} (${file.size} bytes, type: ${file.type})`);
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `events/${organizationId}/${Date.now()}-${i}-${file.name}`;
        const url = await uploadToS3(buffer, fileName, file.type);
        imageUrls.push(url);
        console.log(`Successfully uploaded image ${i + 1}: ${url}`);
      } catch (uploadError) {
        console.error(`Error uploading image ${i + 1}:`, uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
        const isFileSystemError = uploadError instanceof FileSystemError || 
          errorMessage.includes('ENOENT') || 
          errorMessage.includes('EACCES') || 
          errorMessage.includes('EROFS') || 
          errorMessage.includes('read-only') ||
          errorMessage.includes('File system');
        
        if (isFileSystemError) {
          uploadErrors.push(`Image ${i + 1} (${file.name}): [FileSystemError] ${errorMessage}`);
        } else {
          uploadErrors.push(`Image ${i + 1} (${file.name}): ${errorMessage}`);
        }
        // Continue with other images even if one fails
      }
    }
    
    // Separate file system errors from validation errors
    const fileSystemErrors = uploadErrors.filter(err => 
      err.includes('[FileSystemError]') ||
      err.includes('ENOENT') || 
      err.includes('EACCES') || 
      err.includes('EROFS') || 
      err.includes('read-only') ||
      err.includes('File system')
    );
    const validationErrors = uploadErrors.filter(err => 
      !err.includes('[FileSystemError]') &&
      !err.includes('ENOENT') && 
      !err.includes('EACCES') && 
      !err.includes('EROFS') && 
      !err.includes('read-only') &&
      !err.includes('File system')
    );
    
    // Log upload summary and handle errors
    if (uploadErrors.length > 0) {
      console.warn(`Image upload completed with ${uploadErrors.length} error(s):`, uploadErrors);
      
      // If there are validation errors (format or size issues), return error
      if (validationErrors.length > 0) {
        console.error('Validation errors found:', validationErrors);
        return NextResponse.json(
          { 
            error: 'Image upload failed',
            details: validationErrors.join('; ')
          },
          { status: 400 }
        );
      }
      
      // If all uploads failed due to file system errors (like in Vercel), allow event creation without images
      if (imageUrls.length === 0 && imageFiles.length > 0 && fileSystemErrors.length > 0) {
        console.warn('All image uploads failed due to file system errors (likely read-only filesystem). Continuing without images.');
        console.warn('File system errors:', fileSystemErrors);
        // Continue event creation without images - don't return error
      }
      
      // If some uploads failed but some succeeded, we'll continue but log warnings
      if (imageUrls.length > 0 && fileSystemErrors.length > 0) {
        console.warn(`Partial success: ${imageUrls.length} of ${imageFiles.length} images uploaded successfully. Some failed due to file system errors.`);
      }
    } else if (imageUrls.length > 0) {
      console.log(`Successfully uploaded ${imageUrls.length} image(s)`);
    }

    // Prepare location data - if isVirtual is true, ensure address and city are empty
    const locationData = {
      address: validatedData.location.isVirtual ? '' : (validatedData.location.address || ''),
      city: validatedData.location.isVirtual ? '' : (validatedData.location.city || ''),
      coordinates: validatedData.location.coordinates || undefined,
      isVirtual: validatedData.location.isVirtual || false,
    };

    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate || validatedData.startDate,
        registrationDeadline: validatedData.registrationDeadline || validatedData.startDate,
        location: JSON.stringify(locationData),
        maxParticipants: validatedData.maxParticipants,
        organizerId: user.id,
        organizationId,
        status: EventStatus.DRAFT,
        type: EventCategory.VOLUNTEERING,
        sdg: JSON.stringify(validatedData.sdgTags || []),
        skills: validatedData.skills || [],
        intensity: validatedData.intensity,
        verificationType: validatedData.verificationType,
        eventInstructions: validatedData.eventInstructions || '',
        materialsNeeded: validatedData.materialsNeeded || [],
        emergencyContact: validatedData.emergencyContact ? JSON.stringify(validatedData.emergencyContact) : undefined,
        autoIssueCertificates: validatedData.autoIssueCertificates,
        requiresApproval: validatedData.requiresApproval,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : null, // Set first image as cover
      },
      include: {
        organization: true,
      },
    });

    // Create EventImage records for all uploaded images
    if (imageUrls.length > 0) {
      await Promise.all(
        imageUrls.map((url, index) =>
          prisma.eventImage.create({
            data: {
              url,
              eventId: event.id,
              userId: user.id,
              category: index === 0 ? 'cover' : 'general',
            },
          })
        )
      );
    }

    return NextResponse.json({ event }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid data', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        },
        { status: 400 }
      );
    }

    console.error('Error creating event:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}