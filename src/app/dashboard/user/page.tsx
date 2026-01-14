'use client';

/**
 * User Dashboard - Events management page for regular users
 * Modern Shadcn UI with Oxford Blue + Gold theme
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from "@/components/UserContext";
import { PlaybookAPI, EventAPI } from '@/services/api';
import { Playbook as PlaybookType, Event as EventType } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogBody,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PlusCircle, 
  ArrowRight, 
  Calendar,
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserDashboard() {
  const user = useUser();
  const router = useRouter();
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [events, setEvents] = useState<EventType[]>([]);
  const [playbooks, setPlaybooks] = useState<PlaybookType[]>([]);
  const [playbookNameForEvent, setPlaybookNameForEvent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbooksLoading, setPlaybooksLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaybooks = async () => {
      setPlaybooksLoading(true);
      try {
        const data = await PlaybookAPI.getAll({ status: 'PUBLISHED' });
        setPlaybooks(data || []);
      } catch (error: any) {
        console.error("Error fetching playbooks:", error);
        setError("Failed to fetch published playbooks. Please try again later.");
      } finally {
        setPlaybooksLoading(false);
      }
    };

    fetchPlaybooks();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const data = await EventAPI.getAll({ userId: user.id });
        setEvents(data || []);
      } catch (error: any) {
        console.error("Error fetching events:", error);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent mb-4" />
      <p className="text-muted-foreground">Loading user data...</p>
    </div>
  );

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playbookNameForEvent.trim()) {
      setError("Please select a playbook.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const selectedPlaybook = playbooks.find((p) => p.name === playbookNameForEvent);
      if (selectedPlaybook) {
        router.push(`/events/new?playbookId=${selectedPlaybook.id}`);
      } else {
        throw Error(`Could not find playbook named "${playbookNameForEvent}"`);
      }
    } catch (error: any) {
      setError(error.message || "Failed to initiate event creation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseEventModal = () => {
    setShowCreateEventModal(false);
    setPlaybookNameForEvent("");
    setError(null);
  };

  const handleShowEventModal = () => {
    if (playbooksLoading) {
      setError("Playbooks are still loading. Please wait.");
      return;
    }
    if (playbooks.length === 0) {
      setError("No published playbooks available to create an event from.");
      return;
    }
    setShowCreateEventModal(true);
  };

  const renderSkeletonCards = (count: number) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  );

  return (
    <>
      <div className="min-h-screen bg-background">
      <div className="page-wrapper max-w-6xl">
        {/* Header */}
        <div className="section-header mb-8">
          <div>
            <h1 className="heading-1">
              Welcome, {user.email?.split('@')[0] || 'User'}
            </h1>
            <p className="body-muted mt-1">Manage your events and workflows</p>
          </div>
        </div>

        {/* My Events Section */}
        <section className="section">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">
              My Events
            </h2>
            <Button
              onClick={handleShowEventModal}
              disabled={playbooksLoading || playbooks.length === 0}
              className="bg-oxford-blue hover:bg-oxford-blue/90"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Event
            </Button>
          </div>

          {error && !showCreateEventModal && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {eventsLoading ? (
            <div className="card-grid">
              {renderSkeletonCards(3)}
            </div>
          ) : events.length > 0 ? (
            <div className="card-grid">
              {events.map((eventItem: EventType) => (
                <motion.div
                  key={eventItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card variant="accent" className="h-full hover:-translate-y-1 cursor-pointer group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="heading-3 line-clamp-1">
                          {eventItem.name}
                        </CardTitle>
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
                <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="body-muted text-center mb-4">
                  You haven't created any events yet.
                </p>
                <Button 
                  onClick={handleShowEventModal}
                  variant="outline"
                  disabled={playbooksLoading || playbooks.length === 0}
                  className="border-oxford-blue text-oxford-blue hover:bg-oxford-blue hover:text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
      </div>

      {/* Create Event Dialog - Size: sm (400px) */}
      <Dialog open={showCreateEventModal} onOpenChange={setShowCreateEventModal}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle className="text-oxford-blue">
              Create New Event
            </DialogTitle>
            <DialogDescription>
              Select a published playbook to create a new event from.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent}>
            <DialogBody>
              <div className="space-y-4">
                {error && showCreateEventModal && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="playbook-select">Select Playbook</Label>
                  <Select
                    value={playbookNameForEvent}
                    onValueChange={setPlaybookNameForEvent}
                    disabled={playbooksLoading}
                  >
                    <SelectTrigger id="playbook-select">
                      <SelectValue placeholder="-- Select a published playbook --" />
                    </SelectTrigger>
                    <SelectContent>
                      {playbooks.map((playbook) => (
                        <SelectItem key={playbook.id} value={playbook.name}>
                          {playbook.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {playbooksLoading && (
                    <p className="text-sm text-muted-foreground">Loading playbooks...</p>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEventModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!playbookNameForEvent || isLoading || playbooksLoading}
                className="bg-oxford-blue hover:bg-oxford-blue/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Proceeding...
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
