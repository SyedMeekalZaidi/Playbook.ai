'use client';

/**
 * PlaybookPage - Displays a single playbook with its processes and events
 * Converted to Shadcn UI components for consistent design
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, FileText, Settings, Key, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useUser } from '@/components/UserContext';
import { PlaybookAPI, EventAPI } from '@/services/api';
import { Playbook as PlaybookType, Process as ProcessType, Event as EventType } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

// Demo data for collaborators
const demoCollaborators = {
  admin: [
    { id: '1', name: 'John Doe', email: 'john@example.com', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', avatar: 'https://i.pravatar.cc/150?img=5' },
  ],
  collaborator: [
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', name: 'Emily Davis', email: 'emily@example.com', avatar: 'https://i.pravatar.cc/150?img=9' },
    { id: '5', name: 'Alex Turner', email: 'alex@example.com', avatar: 'https://i.pravatar.cc/150?img=12' },
  ],
  implementor: [
    { 
      id: '6', 
      name: 'Robert Williams', 
      email: 'robert@example.com', 
      avatar: 'https://i.pravatar.cc/150?img=7',
      copiedPlaybookId: 'copied-playbook-1'
    },
    { 
      id: '7', 
      name: 'Sophia Martinez', 
      email: 'sophia@example.com', 
      avatar: 'https://i.pravatar.cc/150?img=20',
      copiedPlaybookId: 'copied-playbook-2'
    },
  ]
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const PlaybookPage = ({ params }: PageProps) => {
  const { id: playbookId } = use(params);
  const router = useRouter();
  const user = useUser();

  // State
  const [playbook, setPlaybook] = useState<PlaybookType | undefined>(undefined);
  const [playbookLoading, setPlaybookLoading] = useState(true);
  const [processes, setProcesses] = useState<ProcessType[]>([]);
  const [processesLoading, setProcessesLoading] = useState(true);
  const [events, setEvents] = useState<EventType[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch playbook and processes
  useEffect(() => {
    if (!playbookId) return;

    const fetchPlaybookAndRelatedData = async () => {
      setPlaybookLoading(true);
      setProcessesLoading(true);
      setError(null);
      try {
        const playbookData = await PlaybookAPI.getById(playbookId, { 
          includeProcess: true, 
          includeNodes: true, 
          includeNodeParams: true 
        });
        setPlaybook(playbookData);
        setProcesses(playbookData.Process || []);
      } catch (err: any) {
        console.error("[Playbook [id] page] Error fetching playbook data:", err);
        setError(err.message || "Failed to load playbook data.");
      } finally {
        setPlaybookLoading(false);
        setProcessesLoading(false);
      }
    };
    fetchPlaybookAndRelatedData();
  }, [playbookId]);

  // Fetch events
  useEffect(() => {
    if (!playbookId || !user?.id) return;

    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const data = await EventAPI.getAll({ playbookId: playbookId });
        setEvents(data || []);
      } catch (err: any) {
        console.error("[Playbook [id] page] Error fetching events:", err);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [playbookId, user?.id]);

  const handleOpenCollaboratorsModal = () => {
    setModalLoading(true);
    setShowCollaboratorsModal(true);
    setTimeout(() => setModalLoading(false), 800);
  };

  const handleViewImplementorPlaybook = (copiedPlaybookId: string) => {
    router.push(`/playbook/${copiedPlaybookId}`);
  };

  // Loading states
  if (!user) return (
    <div className="page-wrapper flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-gold mb-2" />
      <p className="body-muted">Loading user data...</p>
    </div>
  );

  if (playbookLoading) {
    return (
      <div className="page-wrapper">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <section className="section">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="card-grid">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => router.refresh()} className="bg-oxford-blue hover:bg-oxford-blue/90">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        {/* Header */}
        <div className="section-header mb-8">
          <div>
            <h1 className="heading-1">{playbook?.name || "Playbook"}</h1>
            <p className="body-muted mt-1">{playbook?.shortDescription || "No description available."}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleOpenCollaboratorsModal}
            className="border-oxford-blue text-oxford-blue hover:bg-oxford-blue/5"
          >
            <Users className="mr-2 h-4 w-4" />
            Collaborators
          </Button>
        </div>

        {/* Processes Section */}
        <section className="section">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">Processes</h2>
            <Button
              onClick={() => router.push(`/processes/new-process?playbookId=${playbookId}`)}
              className="bg-oxford-blue hover:bg-oxford-blue/90"
            >
              Create New Process
            </Button>
          </div>
          
          {processesLoading ? (
            <div className="card-grid">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : processes.length > 0 ? (
            <div className="card-grid">
              {processes.map((process: ProcessType, index) => (
                <motion.div
                  key={process.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    variant="accent"
                    className="h-full cursor-pointer group hover:-translate-y-1 transition-transform"
                    onClick={() => router.push(`/modeler/${playbookId}/${process.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="heading-3 line-clamp-1">{process.name}</CardTitle>
                        <ArrowRight className="h-4 w-4 text-gold group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="body-muted line-clamp-2 mb-4">
                        {process.shortDescription || "No description."}
                      </CardDescription>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); router.push(`/processes/${process.id}/docs`); }}
                          className="border-oxford-blue text-oxford-blue hover:bg-oxford-blue hover:text-white"
                        >
                          <FileText className="mr-1 h-3 w-3" /> Docs
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); router.push(`/processes/${process.id}/parameters`); }}
                          className="border-gold text-oxford-blue hover:bg-gold hover:text-oxford-blue"
                        >
                          <Settings className="mr-1 h-3 w-3" /> Parameters
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card variant="ghost" className="bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="body-muted text-center mb-4">No processes created for this playbook yet.</p>
                <Button
                  onClick={() => router.push(`/processes/new-process?playbookId=${playbookId}`)}
                  className="bg-oxford-blue hover:bg-oxford-blue/90"
                >
                  Create The First Process
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Events Section */}
        <section className="section">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">Events</h2>
            <Button
              onClick={() => router.push(`/events/new?playbookId=${playbookId}`)}
              className="bg-oxford-blue hover:bg-oxford-blue/90"
            >
              Create New Event
            </Button>
          </div>
          
          {eventsLoading ? (
            <div className="card-grid">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="card-grid">
              {events.map((eventItem: EventType, index) => (
                <motion.div
                  key={eventItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card variant="accent" className="h-full hover:-translate-y-1 transition-transform cursor-pointer group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="heading-3 line-clamp-1">{eventItem.name}</CardTitle>
                        <ArrowRight className="h-4 w-4 text-gold group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="body-muted line-clamp-2">
                        {eventItem.description || "No description."}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card variant="ghost" className="bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="body-muted text-center">No events created for this playbook yet.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Collaborators Dialog - Size: lg (720px) */}
      <Dialog open={showCollaboratorsModal} onOpenChange={setShowCollaboratorsModal}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Playbook Collaborators
            </DialogTitle>
          </DialogHeader>
          
          <DialogBody>
            {modalLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold mb-2" />
                <p className="body-muted">Loading collaborators...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Admins Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="h-4 w-4 text-oxford-blue" />
                    <h3 className="heading-3">Admins</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <TooltipProvider>
                      {demoCollaborators.admin.map(admin => (
                        <Tooltip key={admin.id}>
                          <TooltipTrigger asChild>
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-oxford-blue cursor-pointer hover:scale-105 transition-transform">
                              <img src={admin.avatar} alt={admin.name} className="w-full h-full object-cover" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{admin.name}</p>
                            <p className="text-xs">{admin.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>

                {/* Collaborators Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-oxford-blue" />
                    <h3 className="heading-3">Collaborators</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <TooltipProvider>
                      {demoCollaborators.collaborator.map(collab => (
                        <Tooltip key={collab.id}>
                          <TooltipTrigger asChild>
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold cursor-pointer hover:scale-105 transition-transform">
                              <img src={collab.avatar} alt={collab.name} className="w-full h-full object-cover" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{collab.name}</p>
                            <p className="text-xs">{collab.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>

                {/* Implementors Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Copy className="h-4 w-4 text-oxford-blue" />
                    <h3 className="heading-3">Implementors (Copies)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {demoCollaborators.implementor.map(impl => (
                      <Card key={impl.id} variant="outline" className="hover:-translate-y-0.5 transition-transform">
                        <CardContent className="flex items-center p-4">
                          <img 
                            src={impl.avatar} 
                            alt={impl.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gold-300 mr-3"
                          />
                          <div className="flex-grow min-w-0">
                            <p className="font-medium text-oxford-blue truncate">{impl.name}</p>
                            <p className="body-small truncate">{impl.email}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewImplementorPlaybook(impl.copiedPlaybookId)}
                            className="border-oxford-blue text-oxford-blue shrink-0"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" /> View
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollaboratorsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaybookPage;
