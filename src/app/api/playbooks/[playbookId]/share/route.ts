import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';
import { PrismaClient, Role, Playbook as PrismaPlaybook, Process as PrismaProcess, Node as PrismaNode, ProcessParameter as PrismaProcessParameter, DocumentImage as PrismaDocumentImage } from '@prisma/client';
import { createSupabaseAdminClient } from '@/lib/supabase/server'; // Updated import path

interface ShareRequestItem {
  email: string;
  shareType: 'IMPLEMENTOR' | 'COLLABORATOR';
  collaboratorRole?: Role; // Only if shareType is COLLABORATOR
  targetUserId: string; // Added after email validation by frontend, or fetched here
}

interface ShareRequestBody {
  shares: ShareRequestItem[];
}

interface ShareParams {
  params: {
    playbookId: string;
  };
}

async function deepCopyPlaybook(
    tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    originalPlaybookId: string,
    newOwnerId: string,
    sharedByUserId: string
): Promise<PrismaPlaybook> {
    const originalPlaybook = await tx.playbook.findUnique({
        where: { id: originalPlaybookId, isDeleted: false },
        include: {
            Process: {
                include: {
                    Node: {
                        include: {
                            ProcessParameter: true,
                            DocumentImage: true,
                        }
                    },
                    ProcessParameter: true,
                    DocumentImage: true,
                }
            },
            DocumentImage: true, // Playbook-level images
        }
    });

    if (!originalPlaybook) {
        throw new Error('Original playbook not found or has been deleted.');
    }

    const newPlaybookId = crypto.randomUUID();
    const copiedPlaybook = await tx.playbook.create({
        data: {
            id: newPlaybookId,
            name: `Copy of ${originalPlaybook.name}`,
            ownerId: newOwnerId,
            shortDescription: originalPlaybook.shortDescription,
            documentContent: originalPlaybook.documentContent || undefined,
            status: originalPlaybook.status,
            sourcePlaybookId: originalPlaybook.id,
        }
    });

    if (originalPlaybook.DocumentImage.length > 0) {
        await tx.documentImage.createMany({
            data: originalPlaybook.DocumentImage.map(img => ({
                id: crypto.randomUUID(),
                url: img.url, alt: img.alt, caption: img.caption,
                playbookId: copiedPlaybook.id,
            }))
        });
    }

    for (const originalProcess of originalPlaybook.Process) {
        const newProcessId = crypto.randomUUID();
        await tx.process.create({
            data: {
                id: newProcessId,
                name: originalProcess.name,
                playbookId: copiedPlaybook.id,
                shortDescription: originalProcess.shortDescription,
                documentContent: originalProcess.documentContent || undefined,
                bpmnId: originalProcess.bpmnId,
                bpmnXml: originalProcess.bpmnXml,
            }
        });

        if (originalProcess.DocumentImage.length > 0) {
            await tx.documentImage.createMany({
                data: originalProcess.DocumentImage.map(img => ({
                    id: crypto.randomUUID(),
                    url: img.url, alt: img.alt, caption: img.caption,
                    processId: newProcessId,
                }))
            });
        }
        if (originalProcess.ProcessParameter.length > 0) {
            await tx.processParameter.createMany({
                data: originalProcess.ProcessParameter.map(param => ({
                    id: crypto.randomUUID(),
                    name: param.name, processId: newProcessId, type: param.type,
                    mandatory: param.mandatory, options: param.options,
                }))
            });
        }

        for (const originalNode of originalProcess.Node) {
            const newNodeId = crypto.randomUUID();
            await tx.node.create({
                data: {
                    id: newNodeId,
                    name: originalNode.name, type: originalNode.type, processId: newProcessId,
                    documentContent: originalNode.documentContent || undefined,
                    shortDescription: originalNode.shortDescription, bpmnId: originalNode.bpmnId,
                }
            });

            if (originalNode.DocumentImage.length > 0) {
                await tx.documentImage.createMany({
                    data: originalNode.DocumentImage.map(img => ({
                        id: crypto.randomUUID(),
                        url: img.url, alt: img.alt, caption: img.caption,
                        nodeId: newNodeId,
                    }))
                });
            }
            if (originalNode.ProcessParameter.length > 0) {
                await tx.processParameter.createMany({
                    data: originalNode.ProcessParameter.map(param => ({
                        id: crypto.randomUUID(),
                        name: param.name, nodeId: newNodeId, type: param.type,
                        mandatory: param.mandatory, options: param.options,
                    }))
                });
            }
        }
    }

    await tx.playbookShareLog.create({
        data: {
            id: crypto.randomUUID(),
            originalPlaybookId: originalPlaybook.id,
            copiedPlaybookId: copiedPlaybook.id,
            sharedByUserId: sharedByUserId,
            sharedWithUserId: newOwnerId,
        }
    });
    return copiedPlaybook;
}


export async function POST(req: Request, { params }: ShareParams) {
  const supabase = createSupabaseAdminClient(); // Use the new client
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sharedByUserId = authUser.id;

  try {
    const { playbookId } = params;
    const body: ShareRequestBody = await req.json();
    const { shares } = body;

    if (!Array.isArray(shares) || shares.length === 0) {
      return NextResponse.json({ error: 'Shares array is required and cannot be empty' }, { status: 400 });
    }

    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId, isDeleted: false },
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found or has been deleted' }, { status: 404 });
    }
    
    // Note: Email to User ID resolution should ideally happen on the frontend 
    // or be re-verified here if critical. For this example, we trust `targetUserId`.

    const results = [];

    for (const share of shares) {
      if (!share.targetUserId) {
        results.push({ email: share.email, success: false, message: 'Target user ID not provided.' });
        continue;
      }
      if (share.shareType === 'COLLABORATOR') {
        try {
          const existingCollaborator = await prisma.playbookCollaborator.findUnique({
            where: { playbookId_userId: { playbookId, userId: share.targetUserId } },
          });

          if (existingCollaborator) {
            if (!share.collaboratorRole || existingCollaborator.role === share.collaboratorRole) {
              results.push({ email: share.email, success: false, message: `User is already a ${existingCollaborator.role.toLowerCase()} on this playbook.` });
              continue;
            }
          }
          
          const collaboratorRole = share.collaboratorRole || Role.COLLABORATOR; // Default to COLLABORATOR if not specified
          if (!Object.values(Role).includes(collaboratorRole)) {
            results.push({ email: share.email, success: false, message: `Invalid collaborator role: ${collaboratorRole}` });
            continue;
          }

          const collaborator = await prisma.playbookCollaborator.upsert({
            where: { playbookId_userId: { playbookId, userId: share.targetUserId } },
            update: { role: collaboratorRole },
            create: {
              id: crypto.randomUUID(), playbookId, userId: share.targetUserId, role: collaboratorRole,
            },
          });
          results.push({ email: share.email, success: true, message: `Shared as ${collaboratorRole.toLowerCase()}.`, collaboratorId: collaborator.id });
        } catch (error: any) {
          results.push({ email: share.email, success: false, message: `Error sharing as collaborator: ${error.message}` });
        }
      } else if (share.shareType === 'IMPLEMENTOR') {
        try {
          const existingShareLog = await prisma.playbookShareLog.findFirst({
            where: {
              originalPlaybookId: playbookId,
              sharedWithUserId: share.targetUserId,
            },
          });

          if (existingShareLog) {
            results.push({ email: share.email, success: false, message: 'Playbook has already been shared with this user as an implementor.' });
            continue;
          }

          const copiedPlaybook = await prisma.$transaction(async (tx) => {
            return deepCopyPlaybook(tx, playbookId, share.targetUserId, sharedByUserId);
          });
          results.push({ email: share.email, success: true, message: 'Shared as a copy (Implementor).', copiedPlaybookId: copiedPlaybook.id });
        } catch (error: any) {
          results.push({ email: share.email, success: false, message: `Error sharing as copy: ${error.message}` });
        }
      } else {
        results.push({ email: share.email, success: false, message: `Invalid share type: ${share.shareType}` });
      }
    }

    return NextResponse.json({ results }, { status: 200 });

  } catch (error: any) {
    return handleApiError(error, `Error processing share for playbook ${params.playbookId}`);
  }
}
