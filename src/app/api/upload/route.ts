import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { FileSystemError, uploadToS3 } from '@/lib/aws';

export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^\w.-]/g, '-').replace(/-+/g, '-');

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');

    if (!fileEntry || !(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (fileEntry.size === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const mimeType = fileEntry.type || 'application/octet-stream';
    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const safeFileName = sanitizeFileName(fileEntry.name || 'upload.pdf');
    const objectKey = `applications/${session.user.id}/${Date.now()}-${safeFileName}`;

    const url = await uploadToS3(buffer, objectKey, mimeType);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    if (error instanceof FileSystemError) {
      return NextResponse.json(
        {
          error:
            'File storage is not available in the current environment. Please configure AWS S3 credentials.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.error('Error handling file upload:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}









