import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Node {
  id: number,
  name: string,
  type: string,
  description: string | null,
  parameters: ProcessParameter[]
}


interface ProcessParameter {
  name: string
  type: string
  mandatory: boolean
  options: string[]
}

interface ProcessDependency {
  processId: string;
  fromId: string;
  trigger?: string;
  playbookId: string;
}


export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);

      const processId = searchParams.get('processId');
      const playbookId = searchParams.get('playbookId');

      if (!processId && !playbookId){
        return NextResponse.json({
          message: "[Process Dependency route] Must provide either processId or playbookId"
        }, { status: 400 });
      }


      // retrieve all dependencies of that process
      if (processId && !playbookId ){
        const dependencies = await prisma.processDependency.findMany({
            where: {
                processId: processId,
            },
        });
        return NextResponse.json(dependencies);

      }

      // retrieve all dependencies in that playbook
      // if (playbookId){
      //   const dependencies = await prisma.processDependency.findMany({
      //       where: {
      //           playbookId: playbookId,
      //       },
      //   });
      //   return NextResponse.json(dependencies);
      // }


      return NextResponse.json({});
    } catch (error:any){


        return NextResponse.json({
            message:"[Process Dependency route] Internal server error",
            error: error.message || "[Process Dependency route] Internal server error"
            }, {status:500}
        );
    }

}