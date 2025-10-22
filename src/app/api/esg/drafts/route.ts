import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateDraftSchema = z.object({
  templateId: z.string(),
  participants: z.number().min(1),
  durationHours: z.number().min(1),
  scheduledDate: z.string().optional(),
  sdgs: z.array(z.string()),
  notes: z.string().optional(),
});

const CreateDraftsSchema = z.object({
  drafts: z.array(CreateDraftSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = CreateDraftsSchema.parse(body);
    
    // Create actual events in the Event page (not just drafts)
    const createdEvents = await Promise.all(
      validatedData.drafts.map(async (draft) => {
        // Get template info
        const template = await prisma.eventTemplate.findUnique({
          where: { id: draft.templateId },
        });
        
        if (!template) {
          throw new Error(`Template not found: ${draft.templateId}`);
        }
        
        // Create actual event
        const event = await prisma.event.create({
          data: {
            title: template.name,
            description: template.description || `Generated from suggestion engine`,
            startDate: draft.scheduledDate ? new Date(draft.scheduledDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            endDate: draft.scheduledDate ? new Date(new Date(draft.scheduledDate).getTime() + draft.durationHours * 60 * 60 * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + draft.durationHours * 60 * 60 * 1000),
            location: 'To be determined',
            maxParticipants: draft.participants,
            currentParticipants: 0,
            sdg: draft.sdgs[0] || 'SDG3', // Use first SDG as primary
            type: 'VOLUNTEERING',
            status: 'DRAFT',
            isPublic: true,
            skills: template.eligibilityRequirements,
            intensity: 1.0,
            verificationType: template.verificationRequired ? 'ORGANIZER' : 'SELF',
            eventInstructions: `Generated from suggestion engine. ${draft.notes || ''}`,
            materialsNeeded: [],
            requiresApproval: template.verificationRequired,
            autoIssueCertificates: true,
            organizationId: body.organizationId, // Associate with organization
          },
        });
        
        // Also create a draft record for tracking
        await prisma.eventDraft.create({
          data: {
            templateId: draft.templateId,
            participants: draft.participants,
            durationHours: draft.durationHours,
            scheduledDate: draft.scheduledDate ? new Date(draft.scheduledDate) : null,
            sdgs: draft.sdgs,
            notes: draft.notes,
            status: 'draft',
          },
        });
        
        return event;
      })
    );
    
    return NextResponse.json({
      success: true,
      data: {
        createdEvents,
        count: createdEvents.length,
      },
    });
  } catch (error) {
    console.error('Error creating events:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'draft';
    
    const drafts = await prisma.eventDraft.findMany({
      where: { status },
      include: {
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({
      success: true,
      data: drafts,
    });
  } catch (error) {
    console.error('Error fetching event drafts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
