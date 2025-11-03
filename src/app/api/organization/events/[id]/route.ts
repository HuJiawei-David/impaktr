import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { uploadToS3, FileSystemError } from '@/lib/aws';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner (same as events list API)
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);

    const event = await prisma.event.findFirst({
      where: {
        id,
        organizationId: { in: organizationIds }
      },
      include: {
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                impactScore: true,
                tier: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate event statistics
    const totalParticipants = event.participations.length;
    const verifiedParticipants = event.participations.filter((p: { status: string }) => p.status === 'VERIFIED').length;
    const pendingParticipants = event.participations.filter((p: { status: string }) => p.status === 'PENDING').length;
    const totalHours = event.participations.reduce((sum: number, p: { hours?: number | null }) => sum + (p.hours || 0), 0);
    const completionRate = totalParticipants > 0 ? (verifiedParticipants / totalParticipants) * 100 : 0;

    const stats = {
      totalParticipants,
      verifiedParticipants,
      pendingParticipants,
      totalHours,
      averageRating: 4.2, // Mock for now
      completionRate
    };

    // Type assertion for fields added via SQL
    const eventWithExtras = event as typeof event & {
      skills?: string[];
      intensity?: number;
      verificationType?: string;
      eventInstructions?: string;
      materialsNeeded?: string[];
      emergencyContact?: Record<string, unknown>;
      requiresApproval?: boolean;
      autoIssueCertificates?: boolean;
      registrationDeadline?: Date;
    };
    
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
    
    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate instanceof Date ? event.startDate.toISOString() : new Date(event.startDate).toISOString(),
        endDate: event.endDate ? (event.endDate instanceof Date ? event.endDate.toISOString() : new Date(event.endDate).toISOString()) : undefined,
        registrationDeadline: eventWithExtras.registrationDeadline ? (eventWithExtras.registrationDeadline instanceof Date ? eventWithExtras.registrationDeadline.toISOString() : new Date(eventWithExtras.registrationDeadline).toISOString()) : undefined,
        location,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        status: event.status,
        sdg: event.sdg,
        type: event.type,
        isPublic: event.isPublic,
        createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date(event.createdAt).toISOString(),
        imageUrl: event.imageUrl,
        skills: eventWithExtras.skills || [],
        intensity: eventWithExtras.intensity || 1.0,
        verificationType: eventWithExtras.verificationType || 'ORGANIZER',
        eventInstructions: eventWithExtras.eventInstructions,
        materialsNeeded: eventWithExtras.materialsNeeded || [],
        emergencyContact: eventWithExtras.emergencyContact,
        requiresApproval: eventWithExtras.requiresApproval || false,
        autoIssueCertificates: eventWithExtras.autoIssueCertificates !== false,
        attendanceCode: (event as any).attendanceCode || null,
        attendanceEnabled: (event as any).attendanceEnabled || false,
        attendanceEnabledAt: (event as any).attendanceEnabledAt ? ((event as any).attendanceEnabledAt instanceof Date ? (event as any).attendanceEnabledAt.toISOString() : new Date((event as any).attendanceEnabledAt).toISOString()) : null,
        attendanceDisabledAt: (event as any).attendanceDisabledAt ? ((event as any).attendanceDisabledAt instanceof Date ? (event as any).attendanceDisabledAt.toISOString() : new Date((event as any).attendanceDisabledAt).toISOString()) : null,
        participations: event.participations.map((p: any) => {
          // Parse registration info from feedback field
          let registrationInfo: {
            motivation?: string;
            skills?: string;
            notes?: string;
            hoursCommitted?: number;
          } | null = null;
          
          if (p.feedback) {
            try {
              // Try to parse as JSON first (new format)
              registrationInfo = JSON.parse(p.feedback);
            } catch {
              // Fallback to old format: "notes | motivation | skills"
              const parts = p.feedback.split(' | ');
              if (parts.length >= 1) registrationInfo = { notes: parts[0] || undefined };
              if (parts.length >= 2) registrationInfo = { ...registrationInfo, motivation: parts[1] };
              if (parts.length >= 3) registrationInfo = { ...registrationInfo, skills: parts[2] };
            }
          }
          
          return {
            id: p.id,
            userId: p.userId,
            status: p.status,
            joinedAt: p.joinedAt instanceof Date ? p.joinedAt.toISOString() : new Date(p.joinedAt).toISOString(),
            verifiedAt: p.verifiedAt ? (p.verifiedAt instanceof Date ? p.verifiedAt.toISOString() : new Date(p.verifiedAt).toISOString()) : undefined,
            hours: p.hours ?? null,
            feedback: p.feedback ?? null,
            registrationInfo, // Add parsed registration info
            user: p.user || null
          };
        })
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching event details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner (same as events list API)
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);

    const event = await prisma.event.findFirst({
      where: {
        id,
        organizationId: { in: organizationIds }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete the event (cascade will handle participations)
    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);

    const event = await prisma.event.findFirst({
      where: {
        id,
        organizationId: { in: organizationIds }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const organizationId = event.organizationId;

    // Try to parse as FormData first, then fall back to JSON
    let body: any;
    let imageFiles: File[] = [];
    let requestClone = request.clone();
    
    try {
      // Try FormData first
      const formData = await request.formData();
      const eventDataString = formData.get('eventData');
      
      if (eventDataString && typeof eventDataString === 'string') {
        console.log('Parsing FormData for PUT, eventData string:', eventDataString.substring(0, 100));
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
    
    // Handle upload errors
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
      
      // If all uploads failed due to file system errors (like in Vercel), allow event update without images
      if (imageUrls.length === 0 && imageFiles.length > 0 && fileSystemErrors.length > 0) {
        console.warn('All image uploads failed due to file system errors (likely read-only filesystem). Continuing without images.');
        console.warn('File system errors:', fileSystemErrors);
        // Continue event update without images - don't return error
      }
      
      // If some uploads failed but some succeeded, we'll continue but log warnings
      if (imageUrls.length > 0 && fileSystemErrors.length > 0) {
        console.warn(`Partial success: ${imageUrls.length} of ${imageFiles.length} images uploaded successfully. Some failed due to file system errors.`);
      }
    } else if (imageUrls.length > 0) {
      console.log(`Successfully uploaded ${imageUrls.length} image(s)`);
    }

    // Prepare update data
    const updateData: any = {
      title: body.title,
      description: body.description,
      startDate: new Date(body.startDate),
      location: JSON.stringify(body.location),
      sdg: Array.isArray(body.sdgTags) ? JSON.stringify(body.sdgTags) : body.sdgTags || '',
      type: body.type || event.type,
      isPublic: body.isPublic !== undefined ? body.isPublic : event.isPublic,
    };

    if (body.endDate) {
      updateData.endDate = new Date(body.endDate);
    }

    if (body.registrationDeadline) {
      updateData.registrationDeadline = new Date(body.registrationDeadline);
    }

    if (body.maxParticipants !== undefined) {
      updateData.maxParticipants = body.maxParticipants;
    }

    // Update extended fields if they exist
    if (body.skills !== undefined) {
      updateData.skills = body.skills;
    }

    if (body.intensity !== undefined) {
      updateData.intensity = body.intensity;
    }

    if (body.verificationType !== undefined) {
      updateData.verificationType = body.verificationType;
    }

    if (body.eventInstructions !== undefined) {
      updateData.eventInstructions = body.eventInstructions;
    }

    if (body.materialsNeeded !== undefined) {
      updateData.materialsNeeded = body.materialsNeeded;
    }

    if (body.emergencyContact !== undefined) {
      updateData.emergencyContact = body.emergencyContact ? JSON.stringify(body.emergencyContact) : null;
    }

    if (body.requiresApproval !== undefined) {
      updateData.requiresApproval = body.requiresApproval;
    }

    if (body.autoIssueCertificates !== undefined) {
      updateData.autoIssueCertificates = body.autoIssueCertificates;
    }

    // Update cover image if new images were uploaded
    if (imageUrls.length > 0) {
      updateData.imageUrl = imageUrls[0]; // Set first image as cover
      
      // Create EventImage records for all uploaded images
      await Promise.all(
        imageUrls.map((url, index) =>
          prisma.eventImage.create({
            data: {
              url,
              eventId: id,
              userId: user.id,
              category: index === 0 ? 'cover' : 'general',
            },
          })
        )
      );
    }

    // If event is DRAFT and has a startDate (either existing or being updated), auto-update status
    // This ensures events become visible to participants when admin sets startDate, registrationDeadline, attendance code, etc.
    if (event.status === 'DRAFT') {
      // Use the updated startDate if provided, otherwise use the existing one
      const startDateToCheck = updateData.startDate 
        ? (updateData.startDate instanceof Date ? updateData.startDate : new Date(updateData.startDate))
        : (event.startDate instanceof Date ? event.startDate : new Date(event.startDate));
      
      // Only auto-update status if we have a valid startDate
      if (startDateToCheck && !isNaN(startDateToCheck.getTime())) {
        const now = new Date();
        
        // Auto-update status based on startDate
        if (startDateToCheck > now) {
          // Event starts in the future - set to UPCOMING
          updateData.status = 'UPCOMING';
          // Ensure event is public when it becomes visible
          if (updateData.isPublic === undefined) {
            updateData.isPublic = true;
          }
        } else {
          // Event starts now or in the past - set to ACTIVE
          updateData.status = 'ACTIVE';
          // Ensure event is public when it becomes visible
          if (updateData.isPublic === undefined) {
            updateData.isPublic = true;
          }
        }
      }
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      event: updatedEvent,
      success: true
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
