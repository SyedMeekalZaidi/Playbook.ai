import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { processId, processName, shortDescription, nodeList, processParameters } = await req.json();
    
    console.log("Updating process:", processId);
    console.log("Nodes received:", JSON.stringify(nodeList, null, 2));

    if (!processId || !processName) {
      return NextResponse.json({ message: "Process ID and name are required" }, { status: 400 });
    }
    
    // First check if process exists
    const existingProcess = await prisma.process.findUnique({
      where: { id: processId }
    });
    
    if (!existingProcess) {
      return NextResponse.json({ message: "Process not found" }, { status: 404 });
    }
    
    // Update the process basic information
    const updatedProcess = await prisma.process.update({
      where: { id: processId },
      data: {
        name: processName,
        shortDescription
      }
    });
    
    // Handle process parameters
    if (processParameters && Array.isArray(processParameters)) {
      // Delete existing process parameters
      await prisma.processParameter.deleteMany({
        where: { 
          processId,
          nodeId: null // Only delete parameters directly attached to the process, not nodes
        }
      });
      
      // Create new process parameters
      if (processParameters.length > 0) {
        await prisma.processParameter.createMany({
          data: processParameters.map(param => ({
            name: param.name,
            type: param.type,
            mandatory: param.mandatory,
            options: param.options || [],
            processId,
            nodeId: null
          }))
        });
      }
    }
    
    // Handle nodes and their parameters
    if (nodeList && Array.isArray(nodeList)) {
      // Get existing nodes for this process
      const existingNodes = await prisma.node.findMany({
        where: { processId },
        include: { parameters: true }
      });
      
      console.log("Existing nodes:", existingNodes.length);
      
      // Delete all existing nodes and their parameters
      // Note: This will cascade delete parameters due to the DB relationship
      const deleteResult = await prisma.node.deleteMany({
        where: { processId }
      });
      console.log("Deleted nodes:", deleteResult.count);
      
      // Create all new nodes with their parameters
      const newNodes = [];
      for (const node of nodeList) {
        const nodeParams = node.parameters || [];
        console.log(`Creating node "${node.name}" with ${nodeParams.length} parameters`);
        
        try {
          const createdNode = await prisma.node.create({
            data: {
              name: node.name,
              type: node.type || 'Task',
              processId,
              parameters: {
                create: nodeParams.map(param => ({
                  name: param.name || '',
                  type: param.type || 'Textbox',
                  mandatory: !!param.mandatory,
                  options: param.options || []
                }))
              }
            },
            include: { parameters: true } // Include parameters in return value
          });
          
          newNodes.push(createdNode);
          console.log(`Node created with ${createdNode.parameters.length} parameters`);
        } catch (nodeError) {
          console.error(`Error creating node "${node.name}":`, nodeError);
          throw nodeError; // Re-throw to be caught by the main error handler
        }
      }
      
      console.log(`Created ${newNodes.length} new nodes with their parameters`);
    }
    
    // Return the updated process with all its nodes and parameters
    const refreshedProcess = await prisma.process.findUnique({
      where: { id: processId },
      include: {
        nodes: { include: { parameters: true } },
        parameters: true
      }
    });
    
    return NextResponse.json(refreshedProcess, { status: 200 });

  } catch (error) {
    console.error("Error updating process:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
